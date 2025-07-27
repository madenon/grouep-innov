import multer from "multer";

const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    "image/jpeg",
    "image/png",
    "image/webp",
    "video/mp4",
    "video/quicktime", // MOV
    "application/pdf", // ✅ support PDF
  ];

  if (!allowedTypes.includes(file.mimetype)) {
    return cb(new Error("Type de fichier non autorisé"), false);
  }
  cb(null, true);
};

const storage = multer.memoryStorage();

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fieldSize: 10 * 1024 * 1024, // pour les champs texte
    fileSize: 2 * 1024 * 1024 * 1024, //  2go  max (ajuste si besoin)
  },
});

export default upload;
