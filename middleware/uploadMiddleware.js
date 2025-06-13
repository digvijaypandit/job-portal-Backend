import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Create uploads directory if it doesn't exist
const uploadDir = './uploads';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// Configure storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  }
});

// File filter for images only
const allowedExts = ['jpeg', 'jpg', 'png', 'pdf', 'doc', 'docx'];

const allowedMimes = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/octet-stream', // optional fallback for docs
];

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase().slice(1); // remove dot
  const mimetype = file.mimetype.toLowerCase()

  if (allowedMimes.includes(mimetype)) {
    cb(null, true);
  } else if (allowedExts.includes(ext)) {
    // Allow by extension if mimetype is missing or unusual
    cb(null, true);
  } else {
    cb(new Error('Only images and document files (PDF, DOC, DOCX) are allowed'));
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }
});

export default upload;
