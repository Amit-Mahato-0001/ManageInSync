# AWS S3 File Upload Feature Implementation Plan

## Goal

Add a file upload feature inside the project section, but keep it on a separate project page similar to pages like tasks and conversation.

The feature should allow project-related files to be uploaded safely to AWS S3, listed inside the app, downloaded when permitted, and managed without exposing AWS credentials or making the app hard to scale later.

## Recommended Approach

Use direct-to-S3 uploads with pre-signed URLs.

This means the application backend creates a short-lived upload URL, and the browser uploads the file directly to S3 using that URL. The file itself does not pass through the app server.

This is usually the best approach because:

- AWS credentials stay on the server only.
- Large files do not overload the backend.
- Upload traffic goes directly to S3, which scales well.
- The backend still controls who can upload, where the file is stored, and what metadata is saved.
- Upload URLs expire quickly, reducing risk if a URL leaks.

Avoid uploading files through the backend unless there is a very specific reason, such as needing to transform the file before storage.

## High-Level User Flow

1. User opens a project.
2. User navigates to a new project page, for example `Files`, alongside pages such as tasks and conversation.
3. User selects one or more files.
4. Frontend asks the backend for permission to upload each file.
5. Backend checks that the user has access to the project.
6. Backend validates file name, file type, file size, and project ownership.
7. Backend creates a short-lived S3 pre-signed upload URL.
8. Frontend uploads the file directly to S3.
9. Frontend tells the backend the upload completed.
10. Backend saves file metadata in the database.
11. File appears in the project files list.

## Suggested Page Placement

Add a separate page inside the project section:

- Project overview
- Tasks
- Conversation
- Files

The files page should be scoped to a single project. A good route shape would be one of these, depending on the current routing style:

- `/projects/:projectId/files`
- `/dashboard/projects/:projectId/files`
- `/project/:projectId/files`

Use whichever route pattern already exists for tasks and conversation.

## Main Features

### First Version

- Upload file to a project.
- Show project files list.
- Download/open file through a secure link.
- Show upload progress.
- Show file name, size, type, uploader, and upload date.
- Prevent unsupported file types.
- Prevent files over the allowed size.
- Delete file if the user has permission.

### Later Improvements

- Drag-and-drop upload.
- Multiple file upload.
- Folder-like grouping or tags.
- Search and filter.
- File preview for images, PDFs, and text files.
- File versioning.
- Virus scanning.
- Storage usage limits per workspace, team, or project.
- Audit log for upload, download, and delete events.

## Data Model

Create a database table or collection for file metadata. Do not rely only on S3 objects as the source of truth.

Suggested fields:

- `id`
- `projectId`
- `workspaceId` or `organizationId`, if the app uses one
- `uploadedByUserId`
- `originalFileName`
- `storedObjectKey`
- `bucket`
- `mimeType`
- `fileSize`
- `status`
- `createdAt`
- `updatedAt`
- `deletedAt`, if soft delete is used

Suggested statuses:

- `pending`
- `uploaded`
- `failed`
- `deleted`

The `storedObjectKey` should not be just the original file name. Use a safe generated path, for example:

```text
workspaces/{workspaceId}/projects/{projectId}/files/{fileId}/{sanitizedFileName}
```

This keeps files organized and prevents users from overwriting each other files.

## Backend API Design

The exact endpoint names should match the existing backend style.

### 1. Create Upload Request

```http
POST /api/projects/:projectId/files/upload-url
```

Request body:

```json
{
  "fileName": "proposal.pdf",
  "mimeType": "application/pdf",
  "fileSize": 1048576
}
```

Backend responsibilities:

- Confirm the user is authenticated.
- Confirm the user has access to the project.
- Validate file size.
- Validate MIME type and extension.
- Create a file metadata record with `pending` status.
- Generate an S3 object key.
- Create a short-lived pre-signed upload URL.
- Return the upload URL and file record ID.

Response:

```json
{
  "fileId": "file_123",
  "uploadUrl": "https://...",
  "objectKey": "workspaces/ws_1/projects/proj_1/files/file_123/proposal.pdf",
  "expiresIn": 300
}
```

### 2. Confirm Upload

```http
POST /api/projects/:projectId/files/:fileId/complete
```

Backend responsibilities:

- Confirm user access to project.
- Verify the file record exists and belongs to the project.
- Optionally check S3 object metadata.
- Mark the file as `uploaded`.

### 3. List Project Files

```http
GET /api/projects/:projectId/files
```

Backend responsibilities:

- Confirm user access to project.
- Return only metadata, not permanent public S3 URLs.

### 4. Create Download URL

```http
GET /api/projects/:projectId/files/:fileId/download-url
```

Backend responsibilities:

- Confirm user access to project.
- Generate a short-lived pre-signed download URL.
- Return the URL.

### 5. Delete File

```http
DELETE /api/projects/:projectId/files/:fileId
```

Backend responsibilities:

- Confirm user permission.
- Soft-delete the database record or mark status as `deleted`.
- Delete the S3 object immediately, or queue deletion if background jobs exist.

## AWS S3 Setup

### Bucket

Create a private S3 bucket. Do not make the bucket public.

Recommended settings:

- Block all public access enabled.
- Server-side encryption enabled.
- Bucket versioning considered for recovery.
- Lifecycle rules configured for incomplete multipart uploads.
- CORS configured only for the frontend domain.

### CORS

S3 CORS must allow browser uploads from the app domain.

Example shape:

```json
[
  {
    "AllowedOrigins": ["https://your-app-domain.com"],
    "AllowedMethods": ["PUT", "GET"],
    "AllowedHeaders": ["*"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3000
  }
]
```

For local development, add the local frontend URL temporarily, for example:

```text
http://localhost:3000
```

Do not leave broad origins like `*` in production.

### IAM Permissions

Create an IAM user or role for the backend only. The frontend should never receive AWS access keys.

The backend needs limited permissions:

- `s3:PutObject`
- `s3:GetObject`
- `s3:DeleteObject`
- possibly `s3:HeadObject`

Restrict permissions to the upload bucket and project file prefix if possible.

## Environment Variables

Add environment variables for the backend:

```text
AWS_REGION=
AWS_S3_BUCKET=
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_S3_UPLOAD_URL_EXPIRES_SECONDS=300
MAX_UPLOAD_SIZE_MB=25
```

If the app is deployed on AWS, prefer IAM roles over static access keys.

## Security Checklist

- Never expose AWS credentials to the browser.
- Keep S3 bucket private.
- Use short-lived pre-signed URLs.
- Validate project access before creating upload or download URLs.
- Validate file size on backend before signing upload.
- Validate allowed MIME types and file extensions.
- Generate object keys on the backend.
- Do not trust user-provided file paths.
- Store file metadata in the database.
- Avoid permanent public S3 URLs.
- Add delete permissions carefully.
- Add rate limits for upload URL creation.
- Consider virus scanning before allowing downloads for high-risk file types.

## Scalability Checklist

- Upload directly from browser to S3.
- Store metadata in the database for fast project file listing.
- Use pagination on the files list.
- Use S3 lifecycle rules for old temporary or failed uploads.
- Use multipart upload for large files if needed later.
- Add background processing for scanning, previews, or cleanup.
- Track storage usage by workspace or project.

## File Type Policy

Start with a conservative allowlist.

Suggested first version:

- PDF
- PNG
- JPG/JPEG
- WebP
- TXT
- DOC/DOCX
- XLS/XLSX
- CSV

Avoid executable or script-like file types:

- EXE
- MSI
- BAT
- CMD
- SH
- JS
- HTML
- PHP
- JAR

If the business needs these later, add stricter scanning and download warnings.

## Frontend Implementation Steps

1. Add a `Files` navigation item in the project section.
2. Create the project files page.
3. Add an upload button or dropzone.
4. Validate file size and type on the client for quick feedback.
5. Call the backend upload-url endpoint.
6. Upload the file directly to S3 with `PUT`.
7. Show upload progress.
8. Call the backend complete endpoint.
9. Refresh the project files list.
10. Add download/open action using a backend-generated download URL.
11. Add delete action if the current user has permission.
12. Add empty, loading, failed, and uploading states.

Client-side validation is only for user experience. Backend validation is still required.

## Backend Implementation Steps

1. Add S3 configuration and AWS SDK setup.
2. Add file metadata model/table.
3. Add backend validation helpers for file name, MIME type, and size.
4. Add project permission checks for every file endpoint.
5. Add upload-url endpoint.
6. Add complete-upload endpoint.
7. Add list-files endpoint.
8. Add download-url endpoint.
9. Add delete-file endpoint.
10. Add cleanup for stale `pending` uploads.
11. Add tests for permissions, validation, and happy paths.

## Testing Plan

### Unit Tests

- File size validation.
- File type validation.
- Object key generation.
- Permission checks.
- Upload URL creation.
- Download URL creation.

### Integration Tests

- User can create upload URL for a project they can access.
- User cannot create upload URL for another user's project.
- User can complete upload only for their project file.
- User can list only files from accessible projects.
- User cannot download deleted files.
- Delete marks file deleted and/or removes S3 object.

### Manual Tests

- Upload valid file.
- Try unsupported file type.
- Try oversized file.
- Refresh page after upload.
- Download uploaded file.
- Delete uploaded file.
- Confirm another project does not show the file.
- Confirm unauthenticated users cannot access file endpoints.

## Suggested Rollout Plan

1. Add database model and backend endpoints.
2. Add S3 bucket and development environment variables.
3. Build the project files page.
4. Test uploads locally with a development bucket.
5. Add production bucket configuration.
6. Add logging and basic monitoring.
7. Release to a small group of users.
8. Add virus scanning and file previews if needed.

## Open Decisions Before Implementation

Before writing code, decide:

- Maximum file size for the first release.
- Allowed file types.
- Whether files belong only to projects or also to tasks/conversations.
- Whether deleted files should be recoverable.
- Whether file downloads should be logged.
- Whether the app needs virus scanning before launch.
- Whether users need file previews or only download links.
- Whether storage limits should be enforced per project, user, or workspace.

## Best First Version

For the first implementation, keep the scope focused:

- One `Files` page per project.
- Private S3 bucket.
- Direct browser-to-S3 upload using pre-signed URLs.
- Backend-controlled upload and download permissions.
- Metadata stored in the database.
- Conservative file type allowlist.
- 25 MB maximum file size.
- No public file URLs.

This gives a safe and scalable foundation without making the first version too complex.
