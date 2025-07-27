import NotreMission from "../models/notremission.model.js";

// CREATE
const createNotreMission = async (req, res) => {
  try {
    const { content, contenu, objectif, date } = req.body;

    if (!content || !contenu || !objectif) {
      return res.status(400).json({ message: "Tous les champs sont requis." });
    }

    // On prépare dynamiquement les données
    const data = { content, contenu, objectif };
    if (date) {
      data.date = date;
    }

    const mission = new NotreMission(data);
    await mission.save();

    res.status(201).json({ message: "Mission ajoutée avec succès.", mission });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


// GET ALL
const getNotreMissions = async (req, res) => {
  try {
    const missions = await NotreMission.find().sort({ createdAt: -1 });
    res.json(missions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// GET BY ID
const getNotreMissionById = async (req, res) => {
  try {
    const mission = await NotreMission.findById(req.params.id);
    if (!mission) {
      return res.status(404).json({ message: "Mission introuvable." });
    }
    res.json(mission);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// UPDATE
const updateNotreMission = async (req, res) => {
  try {
    const { content, contenu, objectif, date } = req.body;

    const mission = await NotreMission.findByIdAndUpdate(
      req.params.id,
      { content, contenu, objectif, date },
      { new: true }
    );

    if (!mission) {
      return res.status(404).json({ message: "Mission introuvable." });
    }

    res.json({ message: "Mission mise à jour avec succès.", mission });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// DELETE
const deleteNotreMission = async (req, res) => {
  try {
    const mission = await NotreMission.findByIdAndDelete(req.params.id);
    if (!mission) {
      return res.status(404).json({ message: "Mission introuvable." });
    }
    res.json({ message: "Mission supprimée avec succès." });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export {
  createNotreMission,
  getNotreMissions,
  getNotreMissionById,
  updateNotreMission,
  deleteNotreMission,
};
