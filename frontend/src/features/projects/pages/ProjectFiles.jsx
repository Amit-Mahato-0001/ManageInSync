import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { ArrowLeft, Download, FileUp, Trash2, Loader2 } from "lucide-react";
import { useAuth } from "@/features/auth/hooks/useAuth";
import InfiniteScrollSentinel from "@/shared/components/InfiniteScrollSentinel";
import { PageLoader } from "@/shared/components/LoadingSpinner";
import {
  completeUpload,
  createUploadUrl,
  deleteProjectFile,
  fetchProjectFiles,
  getDownloadUrl,
  uploadFileThroughBackend,
  uploadFileToS3,
} from "../api/files";
import { getErrorMessage, runAsyncToast } from "../utils/projectModuleUtils";

const MAX_UPLOAD_SIZE_BYTES = 25 * 1024 * 1024;
const ALLOWED_EXTENSIONS = [
  ".pdf",
  ".png",
  ".jpg",
  ".jpeg",
  ".webp",
  ".txt",
  ".doc",
  ".docx",
  ".xls",
  ".xlsx",
  ".csv",
];
const MIME_TYPE_BY_EXTENSION = {
  ".pdf": "application/pdf",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".txt": "text/plain",
  ".doc": "application/msword",
  ".docx":
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ".xls": "application/vnd.ms-excel",
  ".xlsx":
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ".csv": "text/csv",
};

const getTabClassName = (active) => {
  return active
    ? "rounded-lg bg-white px-4 py-2 text-2xl font-medium border border-white/10 bg-gradient-to-br from-[#18181B] to-blue-500"
    : "px-4 py-2 text-2xl font-medium";
};

const getFileExtension = (fileName = "") => {
  const index = fileName.lastIndexOf(".");
  return index >= 0 ? fileName.slice(index).toLowerCase() : "";
};

const formatFileSize = (bytes = 0) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
};

const getUploadErrorMessage = (error) => {
  if (!error?.response && error?.message) {
    return error.message;
  }
  return getErrorMessage(error, "Failed to upload file");
};

const ProjectFiles = () => {
  const { projectId } = useParams();
  const { state } = useLocation();
  const { user } = useAuth();
  const fileInputRef = useRef(null);
  const [currentFolder, setCurrentFolder] = useState("");
  const [folders, setFolders] = useState([]);
  const [previewUrl, setPreviewUrl] = useState("");
  const [previewingFile, setPreviewingFile] = useState(null);

  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [pagination, setPagination] = useState({});
  const [pageError, setPageError] = useState("");
  const [uploadError, setUploadError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [deletingFileId, setDeletingFileId] = useState(null);

  // NEW: state to store actual image URLs for preview
  const [imageUrls, setImageUrls] = useState({});
  const [loadingImages, setLoadingImages] = useState({});

  const canViewTasks = user?.role !== "client";
  const canUploadFiles =
    user?.role === "owner" || user?.role === "admin" || user?.role === "member";
  const canDeleteFiles = user?.role === "owner" || user?.role === "admin";
  const projectName = state?.projectName || "Project";
  const projectRouteState = {
    projectName,
    projectDescription: state?.projectDescription || "",
    projectTargetDate: state?.projectTargetDate || "",
    projectStatus: state?.projectStatus,
    unreadCount: Number(state?.unreadCount) || 0,
  };

  const loadFiles = useCallback(
    async ({ pageToLoad = 1, append = false, showLoader = true, throwOnError = false } = {}) => {
      try {
        if (showLoader) setLoading(true);
        setPageError("");

        const response = await fetchProjectFiles(projectId, {
          page: pageToLoad,
          limit: 10,
          folder: currentFolder,
        });
        const nextFiles = response.data?.files?.data || [];

        setFiles((prev) => (append ? [...prev, ...nextFiles] : nextFiles));
        setPagination(response.data?.files?.pagination || {});

        const foundFolders = Array.from(
          new Set((response.data?.files?.data || []).map((f) => f.folder).filter(Boolean))
        );
        setFolders(foundFolders);
      } catch (error) {
        setPageError(getErrorMessage(error, "Failed to load files"));
        if (throwOnError) throw error;
      } finally {
        if (showLoader) setLoading(false);
      }
    },
    [projectId, currentFolder]
  );

  useEffect(() => {
    loadFiles();
  }, [loadFiles]);

  // NEW: fetch image URLs for all image files whenever files change
  useEffect(() => {
    const imageFiles = files.filter((file) => file.mimeType?.startsWith("image/"));
    if (imageFiles.length === 0) return;

    const fetchUrls = async () => {
      for (const file of imageFiles) {
        if (imageUrls[file.id]) continue; // already have URL
        setLoadingImages((prev) => ({ ...prev, [file.id]: true }));
        try {
          const resp = await getDownloadUrl(projectId, file.id);
          setImageUrls((prev) => ({ ...prev, [file.id]: resp.data.downloadUrl }));
        } catch (err) {
          console.error(`Failed to load image for ${file.id}`, err);
        } finally {
          setLoadingImages((prev) => ({ ...prev, [file.id]: false }));
        }
      }
    };
    fetchUrls();
  }, [files, projectId, imageUrls]);

  const handleChooseFile = () => {
    if (!canUploadFiles || uploading) return;
    fileInputRef.current?.click();
  };

  const validateSelectedFile = (file) => {
    if (!file) return "Choose a file first";
    if (file.size > MAX_UPLOAD_SIZE_BYTES) return "File must be 25 MB or smaller";
    if (!ALLOWED_EXTENSIONS.includes(getFileExtension(file.name)))
      return "This file type is not allowed";
    return "";
  };

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    const validationMessage = validateSelectedFile(file);
    if (validationMessage) {
      setUploadError(validationMessage);
      return;
    }

    try {
      setUploading(true);
      setUploadProgress(0);
      setUploadError("");

      await runAsyncToast(
        async () => {
          const uploadUrlResponse = await createUploadUrl(projectId, {
            fileName: file.name,
            mimeType: file.type || MIME_TYPE_BY_EXTENSION[getFileExtension(file.name)],
            fileSize: file.size,
            folder: currentFolder,
          });
          const uploadData = uploadUrlResponse.data;

          await uploadFileToS3({
            uploadUrl: uploadData.uploadUrl,
            file,
            headers: uploadData.headers,
            onUploadProgress: (progressEvent) => {
              const total = progressEvent.total || file.size;
              setUploadProgress(Math.round((progressEvent.loaded * 100) / total));
            },
          });

          await completeUpload(projectId, uploadData.fileId);
          await loadFiles({ showLoader: false, throwOnError: true });
        },
        {
          loadingMessage: "Uploading file...",
          successMessage: "File uploaded",
          fallbackError: "Failed to upload file",
        }
      );
    } catch (error) {
      if (import.meta.env.DEV && !error?.response) {
        try {
          const mimeType = file.type || MIME_TYPE_BY_EXTENSION[getFileExtension(file.name)];
          await runAsyncToast(
            async () => {
              await uploadFileThroughBackend({
                projectId,
                file,
                mimeType,
                folder: currentFolder,
                onUploadProgress: (progressEvent) => {
                  const total = progressEvent.total || file.size;
                  setUploadProgress(Math.round((progressEvent.loaded * 100) / total));
                },
              });
              await loadFiles({ showLoader: false, throwOnError: true });
            },
            {
              loadingMessage: "Uploading through local backend...",
              successMessage: "File uploaded",
              fallbackError: "Failed to upload file",
            }
          );
          return;
        } catch (fallbackError) {
          setUploadError(getUploadErrorMessage(fallbackError));
          return;
        }
      }
      setUploadError(getUploadErrorMessage(error));
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDownload = async (fileId) => {
    try {
      const response = await runAsyncToast(
        () => getDownloadUrl(projectId, fileId),
        {
          loadingMessage: "Preparing download...",
          successMessage: "",
          fallbackError: "Failed to create download link",
        }
      );
      window.open(response.data.downloadUrl, "_blank", "noopener,noreferrer");
    } catch {
      // error already handled by toast
    }
  };

  const handleDelete = async (fileId) => {
    if (!canDeleteFiles) {
      setPageError("Only owner/admin can delete files");
      return;
    }
    if (!confirm("Delete this file?")) return;

    try {
      setDeletingFileId(fileId);
      await runAsyncToast(
        async () => {
          await deleteProjectFile(projectId, fileId);
          // Clear image URL from state after deletion
          setImageUrls((prev) => {
            const newUrls = { ...prev };
            delete newUrls[fileId];
            return newUrls;
          });
          await loadFiles({ showLoader: false, throwOnError: true });
        },
        {
          loadingMessage: "Deleting file...",
          successMessage: "File deleted",
          fallbackError: "Failed to delete file",
        }
      );
    } catch {
      // error handled
    } finally {
      setDeletingFileId(null);
    }
  };

  const handleLoadMore = useCallback(async () => {
    const nextPage = (pagination.page || 1) + 1;
    if (loadingMore || nextPage > (pagination.totalPages || 1)) return;

    try {
      setLoadingMore(true);
      await loadFiles({
        pageToLoad: nextPage,
        append: true,
        showLoader: false,
        throwOnError: true,
      });
    } catch {
      // error handled
    } finally {
      setLoadingMore(false);
    }
  }, [loadFiles, loadingMore, pagination.page, pagination.totalPages]);

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <Link to="/projects" className="inline-flex items-center gap-2">
            <ArrowLeft className="h-12 w-12" />
          </Link>
          <div>
            <h1 className="text-5xl font-semibold">{projectName}</h1>
            <p className="text-2xl text-white/60">Upload and manage project files</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            {canViewTasks && (
              <Link
                to={`/projects/${projectId}/tasks`}
                state={projectRouteState}
                className={getTabClassName(false)}
              >
                Tasks
              </Link>
            )}
            <Link
              to={`/projects/${projectId}/conversation`}
              state={projectRouteState}
              className={getTabClassName(false)}
            >
              Conversation
            </Link>
            <Link
              to={`/projects/${projectId}/files`}
              state={projectRouteState}
              className={getTabClassName(true)}
            >
              Files
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <select
              value={currentFolder}
              onChange={(e) => setCurrentFolder(e.target.value)}
              className="rounded-lg border border-white/10 bg-[#0b0b0c] px-3 py-2 text-2xl text-white"
            >
              <option value="">All folders</option>
              {folders.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={() => {
                const name = prompt("New folder name");
                if (name) setCurrentFolder(name.trim());
              }}
              className="rounded-lg border border-white/10 px-3 py-2 text-2xl text-white"
            >
              New Folder
            </button>
          </div>

          {canUploadFiles && (
            <>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={handleFileChange}
                accept={ALLOWED_EXTENSIONS.join(",")}
              />
              <button
                type="button"
                onClick={handleChooseFile}
                disabled={uploading}
                className="inline-flex items-center gap-4 rounded-lg border border-white/10 bg-gradient-to-br from-[#18181B] to-blue-500 px-4 py-2 text-2xl font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                <FileUp className="h-6 w-6" />
                {uploading ? `${uploadProgress}%` : "Upload File"}
              </button>
            </>
          )}
        </div>
      </div>

      {uploadError && <p className="text-2xl text-red-400">{uploadError}</p>}
      {pageError && <p className="text-2xl text-red-400">{pageError}</p>}

      <div className="space-y-3">
        {loading && <PageLoader />}

        {!loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {files.map((file) => (
              <div
                key={file.id}
                className="rounded-lg border border-white/10 bg-gradient-to-br from-[#18181B] to-[#09090B] p-4"
              >
                <div className="h-40 w-full mb-3 flex items-center justify-center bg-[#0b0b0c] rounded overflow-hidden">
                  {file.mimeType?.startsWith("image/") ? (
                    <>
                      {loadingImages[file.id] ? (
                        <Loader2 className="h-8 w-8 animate-spin text-white/60" />
                      ) : imageUrls[file.id] ? (
                        <img
                          src={imageUrls[file.id]}
                          alt={file.originalFileName}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <img
                          src="/assets/placeholder-image.png"
                          alt="placeholder"
                          className="h-full w-full object-cover"
                        />
                      )}
                    </>
                  ) : (
                    <div className="text-3xl text-white/60">
                      {file.originalFileName.split(".").pop()}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <div className="min-w-0">
                    <h3 className="truncate text-xl font-medium text-white">
                      {file.originalFileName}
                    </h3>
                    <p className="text-sm text-white/50">{formatFileSize(file.fileSize)}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleDownload(file.id)}
                      className="p-2 rounded-lg border border-white/10 bg-gradient-to-br from-[#18181B] to-blue-500"
                      aria-label="Download file"
                    >
                      <Download className="h-5 w-5" />
                    </button>

                    {canDeleteFiles && (
                      <button
                        type="button"
                        disabled={deletingFileId === file.id}
                        onClick={() => handleDelete(file.id)}
                        className="p-2 rounded-lg border border-white/10 bg-gradient-to-br from-[#18181B] to-red-500 disabled:cursor-not-allowed disabled:opacity-60"
                        aria-label="Delete file"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && files.length === 0 && (
          <p className="text-2xl text-white/40">No files uploaded yet</p>
        )}

        <InfiniteScrollSentinel
          hasMore={(pagination.page || 1) < (pagination.totalPages || 1)}
          loading={loadingMore}
          onLoadMore={handleLoadMore}
        />
      </div>

      {/* Optional: keep the modal for larger preview on click */}
      {previewUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
          <div className="max-w-4xl w-full p-4">
            <div className="bg-[#0b0b0c] p-4 rounded">
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-2xl font-medium text-white">
                  {previewingFile?.originalFileName}
                </h3>
                <button
                  onClick={() => {
                    setPreviewUrl("");
                    setPreviewingFile(null);
                  }}
                  className="text-white"
                >
                  Close
                </button>
              </div>
              <div className="w-full">
                <img
                  src={previewUrl}
                  alt={previewingFile?.originalFileName}
                  className="w-full h-auto rounded"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectFiles;