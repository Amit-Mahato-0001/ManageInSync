const {
    createProjectDownloadUrl,
    createProjectUploadUrl,
    completeProjectUpload,
    deleteProjectFile,
    listProjectFiles,
    uploadProjectFileThroughBackend
} = require("../services/file.service")



const createProjectUploadUrlHandler = async (req, res, next) => {
    try {
        const result = await createProjectUploadUrl({
            projectId: req.params.projectId,
            fileName: req.body.fileName,
            mimeType: req.body.mimeType,
            fileSize: req.body.fileSize,
            folder: req.body.folder,
            user: req.user,
            tenantId: req.tenantId
        })

        res.status(201).json({
            success: true,
            ...result
        })
    } catch (error) {
        next(error)
    }
}

const completeProjectUploadHandler = async (req, res, next) => {
    try {
        const file = await completeProjectUpload({
            projectId: req.params.projectId,
            fileId: req.params.fileId,
            user: req.user,
            tenantId: req.tenantId
        })

        res.status(200).json({
            success: true,
            message: "File upload completed",
            file
        })
    } catch (error) {
        next(error)
    }
}

const uploadProjectFileHandler = async (req, res, next) => {
    try {
        const file = await uploadProjectFileThroughBackend({
            projectId: req.params.projectId,
            fileName: req.query.fileName,
            mimeType: req.query.mimeType,
            fileBuffer: req.body,
            folder: req.query.folder,
            user: req.user,
            tenantId: req.tenantId
        })

        res.status(201).json({
            success: true,
            message: "File uploaded",
            file
        })
    } catch (error) {
        next(error)
    }
}

const listProjectFilesHandler = async (req, res, next) => {
    try {
        const files = await listProjectFiles({
            projectId: req.params.projectId,
            page: req.query.page,
            limit: req.query.limit,
            folder: req.query.folder,
            user: req.user,
            tenantId: req.tenantId
        })

        res.status(200).json({
            success: true,
            files
        })
    } catch (error) {
        next(error)
    }
}

const createProjectDownloadUrlHandler = async (req, res, next) => {
    try {
        const result = await createProjectDownloadUrl({
            projectId: req.params.projectId,
            fileId: req.params.fileId,
            user: req.user,
            tenantId: req.tenantId
        })

        res.status(200).json({
            success: true,
            ...result
        })
    } catch (error) {
        next(error)
    }
}

const deleteProjectFileHandler = async (req, res, next) => {
    try {
        const file = await deleteProjectFile({
            projectId: req.params.projectId,
            fileId: req.params.fileId,
            user: req.user,
            tenantId: req.tenantId
        })

        res.status(200).json({
            success: true,
            message: "File deleted",
            file
        })
    } catch (error) {
        next(error)
    }
}

module.exports = {
    createProjectDownloadUrlHandler,
    createProjectUploadUrlHandler,
    completeProjectUploadHandler,
    deleteProjectFileHandler,
    listProjectFilesHandler,
    uploadProjectFileHandler
}
