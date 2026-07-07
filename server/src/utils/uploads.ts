import multer from "multer";

const memoryStorage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed'), false);
  }
};

export const upload = multer({
  storage: memoryStorage,
  fileFilter: fileFilter,
  limits: { fileSize: 2 * 1024 * 1024 }
});

export const uploadDeveloper = multer({
  storage: memoryStorage,
  fileFilter: fileFilter,
  limits: { fileSize: 2 * 1024 * 1024 }
});

export const uploadDestination = multer({
  storage: memoryStorage,
  fileFilter: fileFilter,
  limits: { fileSize: 2 * 1024 * 1024 }
});

// Used by the public (unauthenticated) resale submission form — capped lower
// than admin uploads (6 files) since it's a public, unauthenticated endpoint.
export const uploadResalePhotos = multer({
  storage: memoryStorage,
  fileFilter: fileFilter,
  limits: { fileSize: 2 * 1024 * 1024, files: 6 }
});

// Error handling middleware for multer
export function handleMulterError(err, req, res, next) {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File too large. Maximum 2MB allowed.' });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({ error: 'Too many files uploaded.' });
    }
  } else if (err.message === 'Only image files are allowed') {
    return res.status(400).json({ error: 'Only image files are allowed' });
  }
  next(err);
}
