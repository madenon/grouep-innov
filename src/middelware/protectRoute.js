// middleware/protectRoute.js
import { getUserFromToken } from "./getUserFromToken.js";

// Middleware de protection des routes basiques
export const protectRoutes = async (req, res, next) => {
  const token = req.cookies["panneaux"];
  if (!token) {
    // Ne rien logger ici, car pas de token = utilisateur non connecté
    return res.status(401).json({
      success: false,
      message: "Token manquant, accès interdit",
    });
  }

  try {
    const user = await getUserFromToken(token);
    req.user = user;
    next();
  } catch (error) {
    console.error("Erreur vérification token:", error.message);
    res.status(401).json({
      success: false,
      message: error.message || "Token invalide ou expiré",
    });
  }
};

// Middleware de protection des routes réservées aux administrateurs
export const protectAdminRoutes = async (req, res, next) => {

  
  const token = req.cookies["panneaux"];  // On récupère le token

  try {
    const user = await getUserFromToken(token);  // On appelle la fonction pour récupérer l'utilisateur

    if (!user.isAdmin) {  // Si l'utilisateur n'est pas un admin, on l'empêche d'accéder à cette route
      throw new Error("Accès réservé aux administrateurs");
    }

    req.user = user;
    next();
  } catch (error) {
    console.error("Erreur middleware admin:", error);
    res.status(403).json({ message: error.message || "Accès interdit" });
  }
}

// Middleware de protection des routes réservées aux administrateurs ou super administrateurs
export const protectAdminAndSuperAdminRoutes = async (req, res, next) => {
  const token = req.cookies["panneaux"];

  try {
    const user = await getUserFromToken(token);

    if (!(user.isAdmin || user.isSuperAdmin)) {  // Vérifie si l'utilisateur est Admin ou SuperAdmin
      throw new Error("Accès réservé aux Admins ou Super Admins");
    }

    req.user = user;
    next();
  } catch (error) {
    console.error("Erreur middleware Admin & Super Admin:", error);
    res.status(403).json({ message: error.message || "Accès interdit" });
  }
};
