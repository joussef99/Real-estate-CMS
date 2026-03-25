import { useEffect, useRef } from 'react';
import { deleteTemporaryMedia } from '../utils/tempMedia';
import { queueCleanupNotice } from './useCleanupNotice';

function logCleanupFailure(publicId: string, error: unknown) {
  console.warn(`Temporary media cleanup failed for ${publicId}:`, error);
}

export function useTemporaryMediaManager() {
  const temporaryPublicIdsRef = useRef<Set<string>>(new Set());
  const savedRef = useRef(false);

  const trackTemporaryUpload = (publicId?: string | null) => {
    if (!publicId) return;
    savedRef.current = false;
    temporaryPublicIdsRef.current.add(publicId);
  };

  const untrackTemporaryUpload = (publicId?: string | null) => {
    if (!publicId) return;
    temporaryPublicIdsRef.current.delete(publicId);
  };

  const isTemporaryUpload = (publicId?: string | null) => {
    if (!publicId) return false;
    return temporaryPublicIdsRef.current.has(publicId);
  };

  const cleanupTemporaryUpload = async (publicId?: string | null) => {
    if (!publicId || !temporaryPublicIdsRef.current.has(publicId)) {
      return false;
    }

    temporaryPublicIdsRef.current.delete(publicId);

    try {
      await deleteTemporaryMedia(publicId);
    } catch (error) {
      logCleanupFailure(publicId, error);
    }

    return true;
  };

  const cleanupAllTemporaryUploads = async () => {
    const publicIds = Array.from(temporaryPublicIdsRef.current);
    temporaryPublicIdsRef.current.clear();

    await Promise.all(
      publicIds.map(async (publicId) => {
        try {
          await deleteTemporaryMedia(publicId);
        } catch (error) {
          logCleanupFailure(publicId, error);
        }
      }),
    );

    return publicIds.length;
  };

  const markSaved = () => {
    savedRef.current = true;
    temporaryPublicIdsRef.current.clear();
  };

  useEffect(() => {
    return () => {
      if (!savedRef.current && temporaryPublicIdsRef.current.size > 0) {
        void cleanupAllTemporaryUploads().then((count) => {
          if (count > 0) {
            queueCleanupNotice(count === 1 ? 'Temporary upload cleaned up' : 'Temporary uploads cleaned up');
          }
        });
      }
    };
  }, []);

  return {
    cleanupAllTemporaryUploads,
    cleanupTemporaryUpload,
    isTemporaryUpload,
    markSaved,
    trackTemporaryUpload,
    untrackTemporaryUpload,
  };
}