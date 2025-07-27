import multer from "multer";

// Types de fichiers autorisés (image, vidéo et PDF)
const allowedTypes = [
  "image/jpeg", // JPEG
  "image/png", // PNG
  "video/mp4", // MP4
  "video/quicktime", // MOV (QuickTime)
  "application/pdf", // PDF
];

const fileFilter = (req, file, cb) => {
  if (!allowedTypes.includes(file.mimetype)) {
    return cb(new Error("Type de fichier non autorisé"), false);
  }
  cb(null, true);
};

// Storage en mémoire
const storage = multer.memoryStorage();

// Initialisation de multer
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 2 * 1024 * 1024 * 1024, // 2 GO max
  },
});

export default upload;
