import { deleteFile } from "../middelware/deleteFile.js";
import saveFile from "../middelware/gestionFile.js";
import DocumentLibrary from "../models/documentation.model.js";

const createDocument = async (req, res) => {
  try {
    const { title, category, pages, excerpt, author, releaseDate, number } = req.body;

    if (!title || !category) {
      return res.status(400).json({ message: "Le titre et la catégorie sont obligatoires." });
    }

    const pdfFile = req.files?.pdfFile?.[0];
    const coverFile = req.files?.coverImage?.[0];
    const videoFile = req.files?.videoFile?.[0];

    if (!pdfFile || !coverFile || !videoFile) {
      return res.status(400).json({ message: "PDF, image de couverture et vidéo sont requis." });
    }

    const pdfUrl = saveFile(pdfFile, "pdf");
    const coverUrl = saveFile(coverFile, "covers");
    const videoUrl = saveFile(videoFile, "videos");

    const pagesNumber = Number.isInteger(+pages) && +pages > 0 ? +pages : 1;
    const authorName = author && author.trim() !== "" ? author.trim() : "Inconnu";

    const newDocument = new DocumentLibrary({
      title,
      category,
      pages: pagesNumber,
      pdfUrl,
      coverUrl,
      videoUrl,
      excerpt,
      author: authorName,
      releaseDate: releaseDate ? new Date(releaseDate) : null,
      number: number ? Number(number) : null,
    });

    await newDocument.save();
    res.status(201).json(newDocument);
  } catch (err) {
    console.error("Erreur createDocument:", err);
    res.status(400).json({
      message: "Erreur lors de la création du document",
      error: err.message,
    });
  }
};


const updateDocument = async (req, res) => {
  try {
    const doc = await DocumentLibrary.findById(req.params.id);
    if (!doc) return res.status(404).json({ message: "Document non trouvé" });

    const update = { ...req.body };
    if (update.author !== undefined) {
      update.author = update.author.trim() === "" ? "Inconnu" : update.author.trim();
    }

    if (req.files?.pdfFile?.[0]) {
      deleteFile(doc.pdfUrl);
      update.pdfUrl = saveFile(req.files.pdfFile[0], "pdf");
    }

    if (req.files?.coverImage?.[0]) {
      deleteFile(doc.coverUrl);
      update.coverUrl = saveFile(req.files.coverImage[0], "covers");
    }

    if (req.files?.videoFile?.[0]) {
      deleteFile(doc.videoUrl);
      update.videoUrl = saveFile(req.files.videoFile[0], "videos");
    }

    if (update.pages) {
      update.pages = Number.isInteger(+update.pages) && +update.pages > 0 ? +update.pages : doc.pages;
    }

    if (update.releaseDate) {
      update.releaseDate = new Date(update.releaseDate);
    }

    if (update.number) {
      update.number = Number(update.number);
    }

    const updatedDoc = await DocumentLibrary.findByIdAndUpdate(req.params.id, update, { new: true });

    res.status(200).json(updatedDoc);
  } catch (err) {
    console.error("Erreur updateDocument:", err);
    res.status(400).json({ message: "Erreur lors de la mise à jour", error: err.message });
  }
};

const getAllDocuments = async (req, res) => {
  const { category, search, page = 1, limit = 10 } = req.query;

  try {
    const filter = {};

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { excerpt: { $regex: search, $options: "i" } },
      ];
    }

    if (category) {
      filter.category = category;
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [docs, total] = await Promise.all([
      DocumentLibrary.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
      DocumentLibrary.countDocuments(filter),
    ]);

    res.status(200).json({
      documents: docs,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
    });
  } catch (err) {
    console.error("Erreur getAllDocuments:", err);
    res.status(500).json({
      message: "Erreur lors de la récupération des documents",
      error: err.message,
    });
  }
};

const getDocumentById = async (req, res) => {
  try {
    const doc = await DocumentLibrary.findById(req.params.id);
    if (!doc) return res.status(404).json({ message: "Document non trouvé" });
    res.status(200).json(doc);
  } catch (err) {
    console.error("Erreur getDocumentById:", err);
    res.status(500).json({ message: "Erreur lors de la récupération du document", error: err.message });
  }
};
const deleteDocument = async (req, res) => {
  try {
    const doc = await DocumentLibrary.findById(req.params.id);
    if (!doc) return res.status(404).json({ message: "Document non trouvé" });

    // Supprime les fichiers physiques
    deleteFile(doc.pdfUrl);
    deleteFile(doc.coverUrl);
    deleteFile(doc.videoUrl);

    // Supprime le document en base
    await doc.deleteOne();

    res.status(200).json({ message: "Document supprimé avec succès" });
  } catch (err) {
    console.error("Erreur deleteDocument:", err);
    res.status(500).json({ message: "Erreur lors de la suppression", error: err.message });
  }
};

export { createDocument, updateDocument, deleteDocument, getAllDocuments, getDocumentById };
