/** GET /api/v2/projects/{project_id}/files 응답 - ProjectFileListResponse */
export interface ProjectFileRecord {
  id: string
  fileName: string
  status: "pending" | "done" | "error"
  contentType?: string | null
  fileExtension?: string | null
  isPinned: boolean
  createdAt: string
  updatedAt: string
}

export interface ProjectFileListResponse {
  files: ProjectFileRecord[]
}

/** POST /api/v2/projects/{project_id}/files 응답 */
export interface ProjectFileUploadResponse {
  id: string
  fileName: string
  status: "pending" | "done" | "error"
  message: string
}

/**
 * POST /api/v2/projects/{project_id}/files
 * 브라우저 업로드는 `multipart/form-data` 필드 `file` 사용.
 * JSON `{ file: base64, fileName? }` 를 받는 백엔드도 있음.
 */
export interface ProjectFileUploadRequest {
  file: string
  fileName?: string
}

/** DELETE /api/v2/projects/{project_id}/files/{file_id} — data */
export interface ProjectFileDeleteData {
  fileId: string
}

/** PATCH /api/v2/projects/{project_id}/files/{file_id}/pin 요청 본문 */
export interface ProjectFilePinRequest {
  pinned: boolean
}

/** PATCH /api/v2/projects/{project_id}/files/{file_id}/pin 응답 data */
export interface ProjectFilePinData {
  pinned: boolean
}
