import MissionPanneau from "../models/mission.model.js";

// CREATE
 const createMission = async (req, res) => {
  try {
    const { content, date } = req.body;
    const mission = new MissionPanneau({ content, date });
    await mission.save();
    res.status(201).json({ message: "Mission a bien bén ajouté", mission });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// GET ALL
 const getMissions = async (req, res) => {
  try {
    const missions = await MissionPanneau.find().sort({ createdAt: -1 });
    res.json(missions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// GET BY ID
 const getMissionById = async (req, res) => {
  try {
    const mission = await MissionPanneau.findById(req.params.id);
    if (!mission) return res.status(404).json({ message: "Mission not found" });
    res.json(mission);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// UPDATE
 const updateMission = async (req, res) => {
  try {
    const { content, date } = req.body;
    const mission = await MissionPanneau.findByIdAndUpdate(
      req.params.id,
      { content, date },
      { new: true }
    );
    if (!mission) return res.status(404).json({ message: "Mission not found" });
    res.json({ message: "Mission a bien bén mis à jour ", mission });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// DELETE
 const deleteMission = async (req, res) => {
  try {
    const mission = await MissionPanneau.findByIdAndDelete(req.params.id);
    if (!mission) return res.status(404).json({ message: "Mission not found" });
    res.json({ message: "Mission a bien bén supprimé" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export {
  createMission,
  getMissions,
  getMissionById,
  updateMission,
  deleteMission,}