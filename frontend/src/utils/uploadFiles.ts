type HeadersMap = Record<string, string>;

interface UploadResponse {
  filePaths?: string[];
}

type UploadPost = <T>(endpoint: string, body: unknown, headers?: HeadersMap) => Promise<T | null>;

export async function uploadFiles(
  files: File[],
  endpoint: string,
  post: UploadPost,
  headers: HeadersMap = {}
): Promise<string[]> {
  if (files.length === 0) return [];

  const uploadedFilePaths: string[] = [];
  for (const file of files) {
    const formData = new FormData();
    formData.append("images", file);
    const res = await post<UploadResponse>(endpoint, formData, headers);
    if (res?.filePaths?.length) {
      uploadedFilePaths.push(...res.filePaths);
    }
  }
  return uploadedFilePaths;
}
