

import { BookCover } from "../models/education.model.js";

// Créer une couverture avec image
const createBookCover = async (req, res) => {
  try {
    // Vérifier si une image a été téléchargée
    if (!req.file) {
      return res.status(400).json({ message: "L'image est obligatoire" });
    }
    // Récupérer les informations envoyées dans la requête
    const { title, type, country, city } = req.body;

    // Générer l'URL de l'image téléchargée (chemin relatif)
    const imageUrl = `/uploads/${req.file.filename}`; // Le chemin de l'image

    // Créer une nouvelle couverture avec les données de la requête
    const newBookCover = new BookCover({
      title,
      type,
      imageUrl, // L'URL de l'image téléchargée
      country,
      city,
    });

    // Sauvegarder dans la base de données
    await newBookCover.save();

    // Répondre avec l'objet BookCover créé
    res.status(201).json(newBookCover);
  } catch (error) {
    // Gestion des erreurs
    res.status(500).json({ message: error.message });
  }
};

import BookCover from "../models/BookCover"; // Assure-toi que le chemin est correct

/**
 * Récupérer toutes les couvertures de livre
 */
const getBookCovers = async (req, res) => {
  try {
    // Récupère toutes les couvertures de livres dans la base de données
    const bookCovers = await BookCover.find();
    
    // Vérifie s'il y a des couvertures
    if (bookCovers.length === 0) {
      return res.status(404).json({ message: "Aucune couverture trouvée" });
    }

    // Retourne les couvertures trouvées
    return res.status(200).json(bookCovers);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Erreur serveur lors de la récupération des couvertures" });
  }
};

import BookCover from "../models/BookCover"; // Assure-toi que le chemin est correct

/**
 * Récupérer une couverture de livre par ID
 */
const getBookCoverById = async (req, res) => {
  try {
    // Cherche la couverture de livre par son ID
    const bookCover = await BookCover.findById(req.params.id);

    // Vérifie si la couverture existe
    if (!bookCover) {
      return res.status(404).json({ message: "Couverture non trouvée" });
    }

    // Retourne la couverture trouvée
    return res.status(200).json(bookCover);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Erreur serveur lors de la récupération de la couverture" });
  }
};

import BookCover from "../models/BookCover"; // Assure-toi que le chemin est correct

/**
 * Mettre à jour une couverture de livre
 */
const updateBookCover = async (req, res) => {
  try {
    const { id } = req.params; // Récupère l'ID de la couverture de livre depuis les paramètres de la requête
    const { title, type, imageUrl, country, city } = req.body; // Récupère les nouvelles valeurs du corps de la requête

    // Vérifie si l'ID est valide
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "ID invalide" });
    }

    // Recherche la couverture de livre dans la base de données
    const bookCover = await BookCover.findById(id);

    // Vérifie si la couverture existe
    if (!bookCover) {
      return res.status(404).json({ message: "Couverture non trouvée" });
    }

    // Mettre à jour la couverture avec les nouvelles valeurs
    bookCover.title = title || bookCover.title;
    bookCover.type = type || bookCover.type;
    bookCover.imageUrl = imageUrl || bookCover.imageUrl;
    bookCover.country = country || bookCover.country;
    bookCover.city = city || bookCover.city;

    // Sauvegarder les changements dans la base de données
    await bookCover.save();

    // Retourner la couverture mise à jour
    return res.status(200).json(bookCover);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Erreur serveur lors de la mise à jour de la couverture" });
  }
};

import BookCover from "../models/BookCover"; // Assure-toi que le chemin est correct

/**
 * Supprimer une couverture de livre par ID
 */
const deleteBookCover = async (req, res) => {
  try {
    const { id } = req.params; // Récupère l'ID de la couverture de livre depuis les paramètres de la requête

    // Vérifie si l'ID est valide
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "ID invalide" });
    }

    // Cherche la couverture dans la base de données
    const bookCover = await BookCover.findById(id);

    // Vérifie si la couverture existe
    if (!bookCover) {
      return res.status(404).json({ message: "Couverture non trouvée" });
    }

    // Supprimer la couverture de la base de données
    await bookCover.remove();

    // Retourner une réponse de succès
    return res.status(200).json({ message: "Couverture supprimée avec succès" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Erreur serveur lors de la suppression de la couverture" });
  }
};


export {
  createBookCover,
  getBookCovers,
  getBookCoverById,
  updateBookCover,
  deleteBookCover,
};
