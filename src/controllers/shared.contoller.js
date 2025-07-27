import Share from "../models/share.model.js";
import mongoose from "mongoose";

const allowedPlatforms = [
  "email",
  "whatsapp",
  "linkedin",
  "facebook",
  "twitter",
  "autre",
];

const sharePost = async (req, res) => {
  try {
    const postId = req.params.id;
    const { platform } = req.body;

    if (!platform || !allowedPlatforms.includes(platform)) {
      return res.status(400).json({ message: "Plateforme invalide ou manquante" });
    }

    if (!mongoose.Types.ObjectId.isValid(postId)) {
      return res.status(400).json({ message: "ID de post invalide" });
    }

    // Évite les doublons
    const alreadyShared = await Share.findOne({
      post: postId,
      user: req.user._id,
      platform,
    });

    if (alreadyShared) {
      return res.status(400).json({ message: "Vous avez déjà partagé ce post sur cette plateforme" });
    }

    const share = new Share({
      post: postId,
      user: req.user._id,
      platform,
    });

    await share.save();

    res.status(201).json({ message: "Partage enregistré", share });
  } catch (error) {
    console.error("Erreur dans sharePost:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

const getSharesByPost = async (req, res) => {
  try {
    const { postId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(postId)) {
      return res.status(400).json({ message: "ID de post invalide" });
    }

    const shares = await Share.find({ post: postId })
      .populate("user", "name username profilePicture")
      .sort({ createdAt: -1 });

    res.status(200).json({
      count: shares.length,
      shares,
    });
  } catch (error) {
    console.error("Erreur dans la récupération des partages :", error.message);
    res.status(500).json({ message: "Erreur serveur interne" });
  }
};

export { sharePost, getSharesByPost };
