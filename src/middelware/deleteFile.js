import fs from "fs";
import path from "path";
/**
 * @param {string} fileUrl - L'URL publique du fichier (ex: http://localhost:3000/uploads/pdf/file.pdf)
 */
export const deleteFile = (fileUrl) => {
  if (!fileUrl) return;

  const relativePath = fileUrl.split("/uploads/")[1];
  if (!relativePath) return;

  // Construire le chemin complet sur le disque
  const fullPath = path.join(process.cwd(), "uploads", relativePath);

  fs.unlink(fullPath, (err) => {
    if (err) {
      console.error(`Erreur suppression fichier ${fullPath} :`, err);
    } else {
      console.log(`Fichier supprimé : ${fullPath}`);
    }
  });
};
