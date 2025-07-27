import cloudinary from "../lib/cloudinary.js";
import Country from "../models/country.model.js";
//  Créer un pays
const createCountry = async (req, res) => {
  try {
    const { name, code, continent, flagUrl, city } = req.body;

    const trimmedCity = city?.trim();
    const trimmedName = name?.trim();
    const trimmedCode = code?.trim().toUpperCase();
    const trimmedContinent = continent?.trim();

    if (!trimmedName || !trimmedCode || !trimmedContinent || !trimmedCity) {
      return res.status(400).json({ message: "Tous les champs sont requis." });
    }

    const existing = await Country.findOne({ name: trimmedName });
    if (existing) {
      return res.status(400).json({ message: "Ce pays existe déjà." });
    }

    const existingCode = await Country.findOne({ code: trimmedCode });
    if (existingCode) {
      return res.status(400).json({ message: "Ce code est déjà utilisé par un autre pays." });
    }

    let uploadedFlagUrl = flagUrl;

    if (flagUrl && flagUrl.startsWith("http") && !flagUrl.includes("cloudinary")) {
      return res.status(400).json({
        message: "Seuls les fichiers image ou Cloudinary sont autorisés.",
      });
    }

    if (flagUrl && flagUrl.startsWith("data:image")) {
      const result = await cloudinary.uploader.upload(flagUrl, {
        folder: "flags",
      });
      uploadedFlagUrl = result.secure_url;
    }

    const country = await Country.create({
      name: trimmedName,
      code: trimmedCode,
      city: trimmedCity,
      continent: trimmedContinent,
      flagUrl: uploadedFlagUrl,
    });

    res.status(201).json(country);
  } catch (error) {
    console.error("Erreur création pays :", error.message);
    res.status(500).json({ message: "Erreur serveur lors de la création du pays." });
  }
};

//  Obtenir tous les pays
const getCountries = async (req, res) => {
  try {
    const countries = await Country.find().sort({ name: 1 });
    res.status(200).json(countries);
  } catch (error) {
    console.error("Erreur récupération des pays :", error.message);
    res.status(500).json({ message: "Erreur serveur lors de la récupération des pays." });
  }
};

//  Mettre à jour un pays
const updateCountry = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, code, continent, flagUrl, city } = req.body;

    const country = await Country.findById(id);
    if (!country) {
      return res.status(404).json({ message: "Pays non trouvé." });
    }

    const trimmedCity = city?.trim();
    const trimmedName = name?.trim();
    const trimmedCode = code?.trim().toUpperCase();
    const trimmedContinent = continent?.trim();

    if (trimmedName && trimmedName !== country.name) {
      const existing = await Country.findOne({ name: trimmedName });
      if (existing) {
        return res.status(400).json({ message: "Ce nom est déjà utilisé par un autre pays." });
      }
    }

    if (trimmedCode && trimmedCode !== country.code) {
      const existingCode = await Country.findOne({ code: trimmedCode });
      if (existingCode) {
        return res.status(400).json({ message: "Ce code est déjà utilisé par un autre pays." });
      }
    }

    let updatedFlagUrl = country.flagUrl;

    if (flagUrl && flagUrl.startsWith("data:image")) {
      const result = await cloudinary.uploader.upload(flagUrl, {
        folder: "flags",
      });
      updatedFlagUrl = result.secure_url;
    }

    if (trimmedCity) country.city = trimmedCity;
    if (trimmedName) country.name = trimmedName;
    if (trimmedCode) country.code = trimmedCode;
    if (trimmedContinent) country.continent = trimmedContinent;
    if (updatedFlagUrl) country.flagUrl = updatedFlagUrl;

    await country.save();
    res.status(200).json({ message: "Pays mis à jour avec succès", country });

  } catch (error) {
    console.error("Erreur mise à jour pays :", error.message);
    res.status(500).json({ message: "Erreur serveur lors de la mise à jour." });
  }
};

//  Supprimer un pays
const deleteCountry = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Country.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({ message: "Pays non trouvé." });
    }

    res.status(200).json({ message: "Pays supprimé avec succès." });
  } catch (error) {
    console.error("Erreur suppression pays :", error.message);
    res.status(500).json({ message: "Erreur serveur lors de la suppression." });
  }
};

export { createCountry, getCountries, deleteCountry, updateCountry };
