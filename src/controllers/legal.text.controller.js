import LegalText from "../models/legalText.model.js";

const createLegalText = async (req, res) => {
  const { title, content } = req.body;
  const { type } = req.params;

  if (!title || !content || !type) {
    return res.status(400).json({ message: "Type, titre et contenu sont requis." });
  }

  try {
    const existingText = await LegalText.findOne({ type });
    if (existingText) {
      return res.status(409).json({ message: `Le texte ${type} existe déjà.` });
    }

    const legalText = new LegalText({ type, title, content });
    await legalText.save();
    res.status(201).json(legalText);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


const getLegalText = async (req, res) => {
  try {
    const { type } = req.params;
    const doc = await LegalText.findOne({ type }); 
    if (!doc) return res.status(404).json({ message: "Texte non trouvé" });
    res.json(doc);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const updateLegalText = async (req, res) => {
  try {
    const { type } = req.params;
    const updated = await LegalText.findOneAndUpdate(
      { type },
      { ...req.body, lastUpdated: new Date() },
      { new: true, upsert: true }
    );
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export { createLegalText, getLegalText, updateLegalText };
