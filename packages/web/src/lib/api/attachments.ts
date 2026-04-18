import axios from 'axios';
import type { PresignRequest } from '@ordinary-note/shared';
import { api } from '../axios';

interface PresignResponse {
  attachmentId: string;
  presignedUrl: string;
  url: string;
}

export async function presignAttachment(
  data: PresignRequest,
): Promise<PresignResponse> {
  const { data: res } = await api.post<PresignResponse>(
    '/api/attachments',
    data,
  );
  return res;
}

async function uploadToS3(presignedUrl: string, file: File): Promise<void> {
  await axios.put(presignedUrl, file, {
    headers: { 'Content-Type': file.type },
  });
}

export async function uploadImage(
  noteId: string,
  file: File,
): Promise<string> {
  const { presignedUrl, url } = await presignAttachment({
    noteId,
    fileName: file.name,
    mimeType: file.type as PresignRequest['mimeType'],
    fileSize: file.size,
  });
  await uploadToS3(presignedUrl, file);
  return url;
}
