import mongoose from "mongoose";
import cloudinary from "../lib/cloudinary.js";
import Course from "../models/courses.model.js";
import CourseReview from "../models/review.course.model.js";
import { Readable } from "stream";

const uploadToCloudinary = (file, resourceType = "image") => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { resource_type: resourceType }, // "image" ou "video"
      (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result);
        }
      }
    );

    const bufferStream = Readable.from(file.buffer);
    bufferStream.pipe(stream);
  });
};

const extractPublicId = (url) => {
  if (!url) return null;
  const parts = url.split("/");
  const folder = parts[parts.length - 2];
  const filename = parts[parts.length - 1].split(".")[0];
  return `${folder}/${filename}`;
};

const getAverageRating = async (req, res) => {
  try {
    const { courseId } = req.params;

    const stats = await CourseReview.aggregate([
      { $match: { course: new mongoose.Types.ObjectId(courseId) } },
      {
        $group: {
          _id: "$course",
          averageRating: { $avg: "$rating" },
          reviewCount: { $sum: 1 },
        },
      },
    ]);

    if (!stats.length) {
      return res.status(200).json({
        averageRating: 0,
        reviewCount: 0,
      });
    }

    const { averageRating, reviewCount } = stats[0];
    res.status(200).json({ averageRating, reviewCount });
  } catch (error) {
    console.error("Erreur getAverageRating :", error.message);
    res
      .status(500)
      .json({ message: "Erreur lors du calcul de la note moyenne." });
  }
};

const createCourse = async (req, res) => {
  try {
    const { title, content, subject, country, city } = req.body;
    const author = req.user._id;

    // Fichiers uploadés
    const image = req.files?.image?.[0];
    const video = req.files?.videocour?.[0];

    let imageUrl, videoUrl;

    // Upload de l'image vers Cloudinary
    if (image) {
      const imageUpload = await uploadToCloudinary(image, "image");
      imageUrl = imageUpload.secure_url; // URL publique de l'image
    }

    // Upload de la vidéo vers Cloudinary
    if (video) {
      const videoUpload = await uploadToCloudinary(video, "video");
      videoUrl = videoUpload.secure_url; // URL publique de la vidéo
    }

    const newCourse = new Course({
      title,
      content,
      subject,
      country,
      author,
      city,
      image: imageUrl || undefined,
      videocour: videoUrl || undefined,
    });

    await newCourse.save();

    res.status(201).json(newCourse);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur serveur." });
  }
};

const getCourses = async (req, res) => {
  const { country } = req.query;
  if (!country) {
    return res.status(400).json({ message: "Le pays est requis" });
  }

  try {
    const courses = await Course.find({ country: country });
    if (courses.length === 0) {
      return res.status(404).json({ message: "Aucun cours trouvé pour ce pays." });
    }
    res.status(200).json(courses);
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur." });
  }
};

const getCourseById = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id)
      .populate("country", "name")
      .populate("author", "name email");

    if (!course) {
      return res.status(404).json({ message: "Cours non trouvé." });
    }

    res.status(200).json(course);
  } catch (error) {
    console.error("Erreur getCourseById :", error.message);
    res
      .status(500)
      .json({ message: "Erreur lors de la récupération du cours." });
  }
};
const updateCourse = async (req, res) => {
  try {
    const courseId = req.params.id;
    const {
      title,
      image, // base64 ou URL Cloudinary
      videocour, // idem
      content,
      subject,
      country,
      city,
    } = req.body;

    const existingCourse = await Course.findById(courseId);
    if (!existingCourse) {
      return res.status(404).json({ message: "Cours non trouvé." });
    }

    let updatedImage = existingCourse.image;
    let updatedVideo = existingCourse.videocour;

    // Si une nouvelle image est envoyée en base64, on l'upload vers Cloudinary
    if (image?.startsWith("data:image")) {
      // Supprimer l'image précédente de Cloudinary si elle existe
      if (updatedImage?.includes("cloudinary.com")) {
        const imageId = extractPublicId(updatedImage);
        await cloudinary.uploader.destroy(imageId, { resource_type: "image" });
      }
      const imageUpload = await uploadToCloudinary(image, "image");
      updatedImage = imageUpload.secure_url; // URL de la nouvelle image
    }

    // Si une nouvelle vidéo est envoyée en base64, on l'upload vers Cloudinary
    if (videocour?.startsWith("data:video")) {
      // Supprimer la vidéo précédente de Cloudinary si elle existe
      if (updatedVideo?.includes("cloudinary.com")) {
        const videoId = extractPublicId(updatedVideo);
        await cloudinary.uploader.destroy(videoId, { resource_type: "video" });
      }
      const videoUpload = await uploadToCloudinary(videocour, "video");
      updatedVideo = videoUpload.secure_url; // URL de la nouvelle vidéo
    }

    // Mise à jour des informations du cours
    existingCourse.title = title || existingCourse.title;
    existingCourse.image = updatedImage;
    existingCourse.videocour = updatedVideo;
    existingCourse.content = content || existingCourse.content;
    existingCourse.subject = subject || existingCourse.subject;
    existingCourse.city = city || existingCourse.city;
    existingCourse.country = country || existingCourse.country;
    existingCourse.lastUpdated = Date.now();

    await existingCourse.save();

    res.status(200).json(existingCourse);
  } catch (error) {
    console.error("Erreur updateCourse :", error.message);
    res
      .status(500)
      .json({ message: "Erreur lors de la mise à jour du cours." });
  }
};

const deleteCourse = async (req, res) => {
  try {
    const { id } = req.params;

    const course = await Course.findById(id);
    if (!course) {
      return res.status(404).json({ message: "Cours non trouvé." });
    }

    // Supprimer l'image si elle existe sur Cloudinary
    if (course.image?.includes("cloudinary.com")) {
      const imageId = extractPublicId(course.image);
      await cloudinary.uploader.destroy(imageId, { resource_type: "image" });
    }

    // Supprimer la vidéo si elle existe sur Cloudinary
    if (course.videocour?.includes("cloudinary.com")) {
      const videoId = extractPublicId(course.videocour);
      await cloudinary.uploader.destroy(videoId, { resource_type: "video" });
    }

    await Course.findByIdAndDelete(id);

    res.status(200).json({ message: "Cours supprimé avec succès." });
  } catch (error) {
    console.error("Erreur deleteCourse :", error.message);
    res
      .status(500)
      .json({ message: "Erreur lors de la suppression du cours." });
  }
};

export {
  createCourse,
  getCourses,
  getCourseById,
  updateCourse,
  deleteCourse,
  getAverageRating,
};
