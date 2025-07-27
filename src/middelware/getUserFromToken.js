import jwt from "jsonwebtoken";
import User from "../models/user.model.js";

// Fonction pour récupérer l'utilisateur à partir du token
export const getUserFromToken = async (token) => {
  if (!token) {
    throw new Error("Token manquant, accès interdit");
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);  // On décode le token pour récupérer l'ID de l'utilisateur
    const user = await User.findById(decoded.userId).select("-password");  // On cherche l'utilisateur dans la base de données

    if (!user) {
      throw new Error("Utilisateur introuvable");
    }

    return user;  // Si l'utilisateur est trouvé, on le renvoie
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      throw new Error("Le token est expiré, veuillez vous reconnecter");
    }
    throw new Error("Erreur de validation du token");
  }
};
