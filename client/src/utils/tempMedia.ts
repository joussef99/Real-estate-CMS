import { authJson } from './api';

export async function deleteTemporaryMedia(publicId: string): Promise<void> {
  if (!publicId) {
    return;
  }

  await authJson(`/api/media/temp/${encodeURIComponent(publicId)}`, {
    method: 'DELETE',
  });
}