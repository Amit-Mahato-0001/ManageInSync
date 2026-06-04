const path = require("path")
const mongoose = require("mongoose")
const {
    DeleteObjectCommand,
    GetObjectCommand,
    HeadObjectCommand,
    PutObjectCommand
} = require("@aws-sdk/client-s3")
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner")

const ProjectFile = require("../models/projectFile.model")
const s3 = require("../config/s3")
const canAccessProject = require("../utils/canAccessProject")
const createHttpError = require("../utils/httpError")

const DEFAULT_UPLOAD_URL_TTL_SECONDS = 5 * 60
const DEFAULT_MAX_UPLOAD_SIZE_MB = 25

const ALLOWED_FILE_TYPES = {
    ".pdf": ["application/pdf"],
    ".png": ["image/png"],
    ".jpg": ["image/jpeg"],
    ".jpeg": ["image/jpeg"],
    ".webp": ["image/webp"],
    ".txt": ["text/plain"],
    ".doc": ["application/msword"],
    ".docx": ["application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
    ".xls": ["application/vnd.ms-excel"],
    ".xlsx": ["application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"],
    ".csv": ["text/csv", "application/csv", "application/vnd.ms-excel"]
}

const getUploadUrlTtlSeconds = () =>
    Number(process.env.AWS_S3_UPLOAD_URL_EXPIRES_SECONDS) || DEFAULT_UPLOAD_URL_TTL_SECONDS

const getMaxUploadSizeBytes = () =>
    (Number(process.env.MAX_UPLOAD_SIZE_MB) || DEFAULT_MAX_UPLOAD_SIZE_MB) * 1024 * 1024

const sanitizeFileName = (fileName) => {
    const safeFileName = fileName
        .trim()
        .replace(/[\\/:*?"<>|]+/g, "-")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .replace(/^\.+/, "")
        .slice(0, 120)

    return safeFileName || "file"
}

const sanitizeFolderName = (folderName) => {
    if (!folderName) return ""

    return folderName
        .trim()
        .replace(/(^[\/\\]+|[\/\\]+$)/g, "")
        .replace(/\.\.+/g, "")
        .replace(/[\x00-\x1F\x7F<>:\"|?*]+/g, "-")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .slice(0, 200)
}


const getExtension = (fileName) => path.extname(fileName).toLowerCase()

const assertS3Configured = () => {
    if (!process.env.AWS_REGION) {
        throw createHttpError("AWS_REGION is not configured", 500, "s3_not_configured")
    }

    if (!process.env.AWS_S3_BUCKET) {
        throw createHttpError("AWS_S3_BUCKET is not configured", 500, "s3_not_configured")
    }
}

const assertValidFilePolicy = ({ fileName, mimeType, fileSize }) => {
    const extension = getExtension(fileName)
    const allowedMimeTypes = ALLOWED_FILE_TYPES[extension]

    if (!allowedMimeTypes || !allowedMimeTypes.includes(mimeType)) {
        throw createHttpError(
            "This file type is not allowed",
            400,
            "unsupported_file_type",
            {
                allowedExtensions: Object.keys(ALLOWED_FILE_TYPES)
            }
        )
    }

    const maxUploadSizeBytes = getMaxUploadSizeBytes()

    if (fileSize > maxUploadSizeBytes) {
        throw createHttpError(
            `File is too large. Maximum size is ${Math.round(maxUploadSizeBytes / 1024 / 1024)} MB`,
            400,
            "file_too_large"
        )
    }
}

const ensureProjectAccess = async ({ projectId, user, tenantId }) =>
    canAccessProject({
        projectId,
        userId: user._id,
        role: user.role,
        tenantId
    })

const getProjectFileOrThrow = async ({ projectId, fileId, tenantId, includeDeleted = false }) => {
    if (!mongoose.Types.ObjectId.isValid(fileId)) {
        throw createHttpError("Invalid fileId", 400, "invalid_file_id")
    }

    const query = {
        _id: new mongoose.Types.ObjectId(fileId),
        projectId: new mongoose.Types.ObjectId(projectId),
        tenantId: new mongoose.Types.ObjectId(tenantId)
    }

    if (!includeDeleted) {
        query.deletedAt = null
        query.status = { $ne: "deleted" }
    }

    const file = await ProjectFile.findOne(query)

    if (!file) {
        throw createHttpError("File not found", 404, "file_not_found")
    }

    return file
}

const serializeFile = (file) => ({
    id: file._id,
    projectId: file.projectId,
    uploadedByUserId: file.uploadedByUserId,
    originalFileName: file.originalFileName,
    folder: file.folder || "",
    objectKey: file.storedObjectKey,
    mimeType: file.mimeType,
    fileSize: file.fileSize,
    status: file.status,
    createdAt: file.createdAt,
    updatedAt: file.updatedAt
})

const createPendingProjectFile = async ({ projectId, fileName, mimeType, fileSize, tenantId, user, folder }) => {
    const bucket = process.env.AWS_S3_BUCKET
    const safeFileName = sanitizeFileName(fileName)
    const safeFolder = sanitizeFolderName(folder)

    const projectFile = await ProjectFile.create({
        projectId,
        tenantId,
        uploadedByUserId: user._id,
        originalFileName: fileName.trim(),
        storedObjectKey: `pending/${new mongoose.Types.ObjectId()}/${safeFileName}`,
        folder: safeFolder,
        bucket,
        mimeType,
        fileSize,
        status: "pending"
    })

    const parts = [
        "tenants",
        tenantId.toString(),
        "projects",
        projectId.toString(),
        "files"
    ]

    if (safeFolder) {
        parts.push(safeFolder)
    }

    parts.push(projectFile._id.toString(), safeFileName)

    projectFile.storedObjectKey = parts.join("/")

    await projectFile.save()

    return projectFile
}

const createProjectUploadUrl = async ({
    projectId,
    fileName,
    mimeType,
    fileSize,
    user,
    tenantId,
    folder
}) => {
    assertS3Configured()
    assertValidFilePolicy({ fileName, mimeType, fileSize })

    await ensureProjectAccess({ projectId, user, tenantId })

    const projectFile = await createPendingProjectFile({
        projectId,
        fileName,
        mimeType,
        fileSize,
        tenantId,
        user,
        folder
    })
    const bucket = process.env.AWS_S3_BUCKET

    const command = new PutObjectCommand({
        Bucket: bucket,
        Key: projectFile.storedObjectKey,
        ContentType: mimeType
    })

    const expiresIn = getUploadUrlTtlSeconds()
    const uploadUrl = await getSignedUrl(s3, command, { expiresIn })

    return {
        fileId: projectFile._id,
        uploadUrl,
        objectKey: projectFile.storedObjectKey,
        method: "PUT",
        expiresIn,
        headers: {
            "Content-Type": mimeType
        },
        file: serializeFile(projectFile)
    }
}

const uploadProjectFileThroughBackend = async ({
    projectId,
    fileName,
    mimeType,
    fileBuffer,
    user,
    tenantId,
    folder
}) => {
    assertS3Configured()

    const fileSize = fileBuffer?.length || 0

    assertValidFilePolicy({ fileName, mimeType, fileSize })

    await ensureProjectAccess({ projectId, user, tenantId })

    const projectFile = await createPendingProjectFile({
        projectId,
        fileName,
        mimeType,
        fileSize,
        tenantId,
        user,
        folder
    })

    try {
        await s3.send(new PutObjectCommand({
            Bucket: projectFile.bucket,
            Key: projectFile.storedObjectKey,
            Body: fileBuffer,
            ContentType: mimeType
        }))
    } catch (error) {
        projectFile.status = "failed"
        await projectFile.save()

        throw createHttpError("Could not upload file to S3", 502, "s3_upload_failed", error.message)
    }

    projectFile.status = "uploaded"
    await projectFile.save()

    return serializeFile(projectFile)
}

const completeProjectUpload = async ({ projectId, fileId, user, tenantId }) => {
    assertS3Configured()

    await ensureProjectAccess({ projectId, user, tenantId })

    const file = await getProjectFileOrThrow({ projectId, fileId, tenantId })

    if (file.status === "uploaded") {
        return serializeFile(file)
    }

    if (file.status !== "pending") {
        throw createHttpError("File cannot be completed from its current status", 409, "invalid_file_status")
    }

    try {
        await s3.send(new HeadObjectCommand({
            Bucket: file.bucket,
            Key: file.storedObjectKey
        }))
    } catch (error) {
        throw createHttpError(
            "Upload was not found in S3 yet",
            409,
            "s3_object_not_found",
            error.message
        )
    }

    file.status = "uploaded"
    await file.save()

    return serializeFile(file)
}

const listProjectFiles = async ({ projectId, page = 1, limit = 10, user, tenantId, folder }) => {
    await ensureProjectAccess({ projectId, user, tenantId })

    const skip = (page - 1) * limit
    const query = {
        projectId: new mongoose.Types.ObjectId(projectId),
        tenantId: new mongoose.Types.ObjectId(tenantId),
        deletedAt: null,
        status: "uploaded"
    }

    if (folder) {
        query.folder = folder
    }

    const [files, total] = await Promise.all([
        ProjectFile.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean(),
        ProjectFile.countDocuments(query)
    ])

    return {
        data: files.map(serializeFile),
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.max(1, Math.ceil(total / limit))
        }
    }
}

const createProjectDownloadUrl = async ({ projectId, fileId, user, tenantId }) => {
    assertS3Configured()

    await ensureProjectAccess({ projectId, user, tenantId })

    const file = await getProjectFileOrThrow({ projectId, fileId, tenantId })

    if (file.status !== "uploaded") {
        throw createHttpError("File is not ready for download", 409, "file_not_uploaded")
    }

    const expiresIn = getUploadUrlTtlSeconds()
    const command = new GetObjectCommand({
        Bucket: file.bucket,
        Key: file.storedObjectKey,
        ResponseContentType: file.mimeType,
        ResponseContentDisposition: `attachment; filename="${sanitizeFileName(file.originalFileName)}"`
    })

    const downloadUrl = await getSignedUrl(s3, command, { expiresIn })

    return {
        fileId: file._id,
        downloadUrl,
        expiresIn
    }
}



const deleteProjectFile = async ({ projectId, fileId, user, tenantId }) => {
    assertS3Configured()

    await ensureProjectAccess({ projectId, user, tenantId })

    const file = await getProjectFileOrThrow({ projectId, fileId, tenantId })

    try {
        await s3.send(new DeleteObjectCommand({
            Bucket: file.bucket,
            Key: file.storedObjectKey
        }))
    } catch (error) {
        throw createHttpError("Could not delete file from S3", 502, "s3_delete_failed", error.message)
    }

    file.status = "deleted"
    file.deletedAt = new Date()
    await file.save()

    return serializeFile(file)
}

module.exports = {
    createProjectDownloadUrl,
    createProjectUploadUrl,
    completeProjectUpload,
    deleteProjectFile,
    listProjectFiles,
    uploadProjectFileThroughBackend
}
}
