import multer from 'multer';

// Configure storage (memory storage for this example)
const storage = multer.memoryStorage();

// Configure the image upload middleware
export const handleUpload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB file size limit
  },
  fileFilter: (req, file, cb) => {
    // Accept only image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!') as any, false);
    }
  },
});

// Configure the document upload middleware
export const handleDocumentUpload = multer({
  storage: storage,
  limits: {
    fileSize: 15 * 1024 * 1024, // 15MB file size limit for documents
  },
  fileFilter: (req, file, cb) => {
    // Accept PDF, DOC, DOCX, and image files
    const allowedMimeTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/jpeg',
      'image/png',
      'image/webp',
    ];

    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new Error('Only PDF, DOC, DOCX, and image files are allowed!') as any,
        false
      );
    }
  },
});
