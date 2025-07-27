import User from "../models/user.model.js";
import bcrypt from "bcryptjs";

import {
  sendResetPasswordEmail,
  sendResetSuccessEmail,
  sendVerificationEmail,
  sendwelcomeEmail,
} from "../mailtrap/emails.js";
import crypto from "crypto";
import { isValidPhoneNumber, parsePhoneNumber } from "libphonenumber-js";
import { generateTokenAndSetCookie } from "../utils/generateTokenAndSetCookie.js";

const signup = async (req, res) => {
  try {
    const { name, username, email, phone, password, confirmPassword } =
      req.body;

    const trimmedName = name?.trim();
    const trimmedUsername = username?.trim();
    const trimmedEmail = email?.trim();
    const trimmedPhone = phone?.trim();
    const trimmedPassword = password?.trim();
    const trimmedConfirmPassword = confirmPassword?.trim();
    // Vérifier que tous les champs sont remplis
    if (
      !trimmedName ||
      !trimmedUsername ||
      !trimmedEmail ||
      !trimmedPhone ||
      !trimmedPassword ||
      !trimmedConfirmPassword
    ) {
      return res
        .status(400)
        .json({ message: "Tous les champs sont obligatoires" });
    }

    // Vérifier que les mots de passe correspondent
    if (trimmedPassword !== trimmedConfirmPassword) {
      return res
        .status(400)
        .json({ message: "Les mots de passe ne correspondent pas" });
    }

    // Vérifier la longueur minimale du mot de passe
    if (trimmedPassword.length < 7) {
      return res
        .status(400)
        .json({
          message: "Le mot de passe doit contenir au moins 7 caractères",
        });
    }

    // Normalisation du numéro de téléphone
    const formattedPhone = trimmedPhone.startsWith("+")
      ? trimmedPhone.replace(/[^\d+]/g, "")
      : "+" + trimmedPhone.replace(/[^\d]/g, "");

    // Vérification personnalisée du numéro ivoirien
    const parsedPhone = parsePhoneNumber(formattedPhone);

    if (parsedPhone?.country === "CI") {
      // Numéro ivoirien : doit avoir 10 chiffres après +225 et commencer par un préfixe valide
      const ivoirienValidPrefixes = ["01", "05", "07", "25", "27", "09"];
      const match = formattedPhone.match(/^\+225(\d{2})(\d{8})$/);
      if (!match || !ivoirienValidPrefixes.includes(match[1])) {
        return res.status(400).json({
          error:
            "Numéro ivoirien invalide (ex: +2250707070707 ou +2250987768909)",
        });
      }
    } else {
      // Pour les autres pays : validation standard
      if (!isValidPhoneNumber(formattedPhone)) {
        return res.status(400).json({ error: "Numéro de téléphone invalide." });
      }
    }

    // Vérifier l’unicité de l’email et du nom d’utilisateur
    const existingEmail = await User.findOne({ email: trimmedEmail });
    if (existingEmail) {
      return res.status(400).json({ message: "Email déjà utilisé" });
    }

    const existingUsername = await User.findOne({ username: trimmedUsername });
    if (existingUsername) {
      return res.status(400).json({ message: "Nom de compte déjà utilisé" });
    }

    // Hachage du mot de passe
    const hashedPassword = await bcrypt.hash(trimmedPassword, 10);

    // Génération du token de vérification
    const verificationToken = Math.floor(
      100000 + Math.random() * 900000
    ).toString();
    const verificationTokenExpiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 min

    // Création de l'utilisateur
    const newUser = new User({
      name: trimmedName,
      username: trimmedUsername,
      email: trimmedEmail,
      phone: formattedPhone,
      password: hashedPassword,
      verificationToken,
      verificationTokenExpiresAt,
      isVerified: false,
    });
    await newUser.save();
    // Envoi de l'email de vérification
    const profileUrl = process.env.CLIENT_URL+"/profile/" + newUser.username;

    try {
      await sendVerificationEmail(newUser.email, newUser.name,profileUrl, verificationToken);
    } catch (emailError) {
      console.error(
        "Erreur lors de l'envoi de l'email de vérification:",
        emailError
      );
    }
    try {
       await sendWelcomeEmail(newUser.email, newUser.name, newUser);
    } catch (emailError) {
      console.error(
        "Erreur lors de l'envoi de l'email de bienvenue:",
        emailError
      )
    }

    generateTokenAndSetCookie(res, newUser._id);

    return res.status(201).json({
      success: true,
      message: "Inscription réussie",
      user: {
        ...newUser._doc,
        password: undefined,
      },
    });

 

  } catch (error) {
    console.error("Erreur signup:", error);
    return res.status(500).json({ message: "Erreur serveur" });
  }
};

const verifyEmail = async (req, res) => {
  const { code } = req.body;
  try {
    const user = await User.findOne({
      verificationToken: code,
      verificationTokenExpiresAt: { $gt: new Date() }, // heure expiration superieur a la date actuelle
    });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Votre code a expiré ou est invalide",
      });
    }

    user.isVerified = true;
    user.verificationToken = undefined;
    user.verificationTokenExpiresAt = undefined;
    await user.save();

    await sendwelcomeEmail(user.email, user.name);

    res.status(200).json({
      success: true,
      message: "Votre compte a été vérifié avec succès",
      user: {
        ...user._doc,
        password: undefined,
      },
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const login = async (req, res) => {
  const { identifier, password } = req.body;
  try {
    const trimmedIdentifier = identifier?.trim();
    const trimmedPassword = password?.trim();

    if (!trimmedIdentifier || !trimmedPassword) {
      return res.status(400).json({ message: "Champs obligatoires manquants" });
    }

    // Trouver l'utilisateur soit par email soit par username
    const user = await User.findOne({
      $or: [{ email: trimmedIdentifier }, { username: trimmedIdentifier }],
    });

    if (!user) {
      return res
        .status(400)
        .json({ message: "Information utilisateur ou mot de passe incorrect" });
    }

    const isMatch = await bcrypt.compare(trimmedPassword, user.password);
    if (!isMatch) {
      return res
        .status(400)
        .json({ message: "Utilisateur ou mot de passe incorrect" });
    }

    generateTokenAndSetCookie(res, user._id, user.isAdmin);
    user.lastLogin = Date.now();
    await user.save();

    res.status(200).json({
      message: "Connexion réussie",
      user: {
        ...user._doc,
        password: undefined,
      },
    });
  } catch (error) {
    console.error("Erreur login:", error);
    res.status(500).json({ message: "Erreur serveur interne" });
  }
};

const logout = (req, res) => {
  res.clearCookie("panneaux");
  res.status(200).json({ message: "Déconnexion réussie" });
};


const forgotPassword = async (req, res) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "Utilisateur introuvable" });
    }
    // Envoi de l'email de reinitialisation de mot de passe
    const resetToken = crypto.randomBytes(20).toString("hex");
    const resetTokenExpiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000); // expire dans 30 minutes
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpiresAt = resetTokenExpiresAt;

    await user.save();
    await sendResetPasswordEmail(
      user.email,
      `${process.env.CLIENT_URL}/reset-password/${resetToken}`
    );

    res.status(200).json({
      success: true,
      message: "Email de reinitialisation envoyé avec succès",
    });
  } catch (error) {
    console.error("Erreur forgotPassword :", error);
    return res.status(500).json({
      success: false,
      message: "Erreur serveur interne",
    });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { panneaux } = req.params;
    const { password } = req.body;
    const user = await User.findOne({
      resetPasswordToken: panneaux,
      resetPasswordExpiresAt: { $gt: new Date() }, // heure expiration superieur a la date actuelle
    });

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "Utilisateur introuvable" });
    }
    // update password
    if (!password || password.length < 7) {
      return res.status(400).json({
        success: false,
        message: "Le mot de passe doit contenir au moins 7 caractères",
      });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    user.password = hashedPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpiresAt = undefined;

    await user.save();
    await sendResetSuccessEmail(user.email);
    res
      .status(200)
      .json({ success: true, message: "Mot de passe modifié avec succès" });
  } catch (error) {
    console.error("Erreur resetPassword:", error);
    res.status(500).json({ success: false, message: "Erreur serveur interne" });
  }
};

const checkAuth = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("-password");
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Utilisateur introuvable",
      });
    }

    res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    console.error("Erreur checkAuth:", error);
    res.status(500).json({
      success: false,
      message: "Erreur serveur interne",
    });
  }
};

const getCurrentUser = async (req, res) => {
  try {
    const user = req.user;

    res.status(200).json({
      _id: user._id,
      username: user.username,
      name: user.name,
      email: user.email,
      isAdmin: user.isAdmin,
      headline: user.headline,
      location: user.location,
      about: user.about,
      skills: user.skills,
      experience: user.experience,
      education: user.education,
      profilePicture: user.profilePicture,
      bannerImg: user.bannerImg,
      connections: user.connections,
       isSuperAdmin: user.isSuperAdmin,
       isVerified: user.isVerified
    });
  } catch (error) {
    console.log("Erreur de connexion", error.message);
    res.status(500).json({ message: "Erreur Serveur Internal" });
  }
};

export {
  signup,
  login,
  logout,
  verifyEmail,
  forgotPassword,
  resetPassword,
  checkAuth,
  getCurrentUser,
};
