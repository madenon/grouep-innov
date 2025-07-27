import cloudinary from "../lib/cloudinary.js";
import User from "../models/user.model.js";

const getSuggestedConnection = async (req, res) => {
  try {
    const currentUser = await User.findById(req.user._id).select("connections");
    // find users  who are not  already connected, and also not the current user
    const suggestedUser = await User.find({
      // _id: { $ne: req.user._id, $nin: currentUser.connections },
        _id: { $nin: [...currentUser.connections, req.user._id] },

    })
      .select("name username profilePicture headline")
      .limit(10); // limets les  utilisateurs a 10
    res.json(suggestedUser);
  } catch (error) {
    console.log("Erreur de getSuggestedConnection", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const getPublicProfile = async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username }).select(
      "-password"
    );
    if (!user) {
      return res.status(404).json({ message: "Utilisateur introuvable" });
    }
    res.json(user);
  } catch (error) {
    console.log("Erreur de getPublicProfile", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const updateProfile = async (req, res) => {
  try {
    const allowedFields = [
      "name",
      "username",
      "headline",
      "about",
      "location",
      "profilePicture",
      "bannerImg",
      "skills",
      "experience",
      "education",
    ];
    const updatedData = {};

    const oldUser = await User.findById(req.user._id);

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updatedData[field] = req.body[field];
      }
    }

    // Vérification de la nouvelle image de profil
    if (req.body.profilePicture && req.body.profilePicture !== oldUser.profilePicture) {
      if (req.body.profilePicture.startsWith("https://res.cloudinary.com")) {
        updatedData.profilePicture = req.body.profilePicture; // Image déjà sur Cloudinary
      } else if (req.body.profilePicture.startsWith("data:image")) {
        // Image à télécharger sur Cloudinary
        try {
          const result = await cloudinary.uploader.upload(req.body.profilePicture);
          updatedData.profilePicture = result.secure_url;
        } catch (uploadError) {
          console.log("Erreur lors de l'upload de l'image de profil", uploadError);
          return res.status(500).json({ message: "Erreur lors de l'upload de l'image de profil" });
        }
      }
    }

    // Vérification de la nouvelle bannière
    if (req.body.bannerImg && req.body.bannerImg !== oldUser.bannerImg) {
      if (req.body.bannerImg.startsWith("https://res.cloudinary.com")) {
        updatedData.bannerImg = req.body.bannerImg; // Image déjà sur Cloudinary
      } else if (req.body.bannerImg.startsWith("data:image")) {
        // Image à télécharger sur Cloudinary
        try {
          const result = await cloudinary.uploader.upload(req.body.bannerImg);
          updatedData.bannerImg = result.secure_url;
        } catch (uploadError) {
          console.log("Erreur lors de l'upload de la bannière", uploadError);
          return res.status(500).json({ message: "Erreur lors de l'upload de la bannière" });
        }
      }
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updatedData },
      { new: true }
    ).select("-password");

    if (!user) {
      return res.status(404).json({ message: "Utilisateur non trouvé ou mise à jour échouée" });
    }

    res.json({
      message: "Profil mis à jour avec succès",
      user,
    });
  } catch (error) {
    console.log("Erreur de updateProfile", error);
    res.status(500).json({ message: "Erreur serveur interne" });
  }
};


export { getSuggestedConnection, getPublicProfile, updateProfile };
