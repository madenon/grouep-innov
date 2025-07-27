import mongoose from "mongoose";
import Filter from "../models/filter.model.js";

 const createFilter = async (req, res) => {
  const { type, label, country } = req.body;

  if (!country) return res.status(400).json({ message: "Pays requis" });

  const exists = await Filter.findOne({ type, label, country });
  if (exists) return res.status(400).json({ message: "Existe déjà" });

  const filter = await Filter.create({ type, label, country });
  res.status(201).json(filter);
};


// READ
// GET /filters?country=xxx
const getGroupedFilters = async (req, res) => {
  const { country } = req.query;

  let query = {};
  if (country) {
    if (mongoose.Types.ObjectId.isValid(country)) {
      query.country = new  mongoose.Types.ObjectId(country);
    } else {
      return res.status(400).json({ message: "Invalid country id" });
    }
  }

  // Utilise ici `query` et pas `{ country }`
  const filters = await Filter.find(query)
    .sort({ label: 1 })
    .lean();

  const grouped = {
    juridiction: [],
    thematique: [],
    annee: [],
  };

  filters.forEach((f) => {
    if (grouped[f.type]) {
      grouped[f.type].push(f);
    }
  });

  res.json(grouped);
};


// UPDATE
const updateFilter = async (req, res) => {
  const { id } = req.params;
  const { type, label } = req.body;
  try {
    const updated = await Filter.findByIdAndUpdate(id, { type, label }, { new: true });
    if (!updated) return res.status(404).json({ error: "Filtre non trouvé" });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: "Erreur lors de la mise à jour" });
  }
};

// DELETE
const deleteFilter = async (req, res) => {
  const { id } = req.params;
  try {
    const deleted = await Filter.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ error: "Filtre non trouvé" });
    res.json({ message: "Filtre supprimé" });
  } catch (error) {
    res.status(500).json({ error: "Erreur lors de la suppression" });
  }
};

export { createFilter, getGroupedFilters, updateFilter, deleteFilter };