import multer from 'multer';
import path from 'path';

// Définir le stockage des fichiers (ici dans le dossier 'uploads')
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // Dossier de destination
  },
  filename: (req, file, cb) => {
    const fileExtension = path.extname(file.originalname);
    const fileName = Date.now() + fileExtension; // Renommer le fichier pour éviter les collisions
    cb(null, fileName);
  },
});

// Filtrage des fichiers acceptés (par exemple, on accepte seulement les images)
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true); // Accepter l'image
  } else {
    cb(new Error('Only image files are allowed!'), false); // Refuser les fichiers non images
  }
};

// Création du middleware d'upload
const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // Limite de taille (ici 5MB max)
});

export default upload;