import multer from "multer";

// Types de fichiers autorisés (image, vidéo et PDF)
const allowedTypes = [
  "image/jpeg",      // JPEG
  "image/png",       // PNG
  "image/webp",      // WebP
  "video/mp4",       // MP4
  "video/quicktime", // MOV (QuickTime)
  "application/pdf", // PDF
];

// Filtrage des fichiers selon leur type MIME
const fileFilter = (req, file, cb) => {
  if (!allowedTypes.includes(file.mimetype)) {
    return cb(new Error("Type de fichier non autorisé"), false);
  }
  cb(null, true); // Si le type est autorisé, continuer
};

// Stockage en mémoire (au lieu de stockage local sur le serveur)
const storage = multer.memoryStorage();

// Initialisation de multer
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 2 * 1024 * 1024 * 1024, // 2 Go max
  },
});

export default upload;
