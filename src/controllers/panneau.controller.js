import cloudinary from "../lib/cloudinary.js";
import { sendCommentNotificationEmail } from "../mailtrap/emails.js";
import Notification from "../models/notification.model.js";
import Panneau from "../models/panneaux.model.js";
import streamifier from "streamifier";
const uploadBufferToCloudinary = (buffer, options) => {
  return new Promise((resolve, reject) => {
    let isResolved = false;

    // Créer un stream de téléchargement vers Cloudinary
    const stream = cloudinary.uploader.upload_stream(
      options,
      (error, result) => {
        if (isResolved) return; // Ignore si déjà résolu/rejeté

        if (error) {
          isResolved = true;
          console.error("Erreur Cloudinary upload:", error); // Log de l'erreur
          return reject(error);
        }

        // Réponse de Cloudinary avec le résultat de l'upload
        isResolved = true;
        // console.log("Upload réussi:", result.secure_url);  // Log du résultat
        resolve(result);
      }
    );

    // Timeout pour éviter le blocage infini (ex: 30 secondes)
    const timeoutId = setTimeout(() => {
      if (!isResolved) {
        isResolved = true;
        stream.destroy(); // Détuire le stream en cas de timeout
        console.error("Timeout de l'upload Cloudinary"); // Log du timeout
        reject(new Error("Upload Cloudinary timeout"));
      }
    }, 30000);

    // Envoie du buffer vers Cloudinary en stream
    streamifier
      .createReadStream(buffer)
      .on("error", (err) => {
        if (!isResolved) {
          clearTimeout(timeoutId); // Annuler le timeout
          isResolved = true;
          console.error("Erreur lors du streamification du buffer:", err); // Log de l'erreur de stream
          reject(err);
        }
      })
      .pipe(stream);
  });
};

const getPanneau = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const totalPanneaux = await Panneau.countDocuments();

    const panneaux = await Panneau.find()
      .populate("author", "name username profileImage")
      .populate("author", "name username profilePicture")
      .populate("likes", "name username profileImage")
      .populate("comments.user", "name username profileImage")
      .populate("comments.user", "name username profilePicture")
      .populate("comments.repliescommente.user", "name username profileImage")
      .populate("comments.repliescommente.user", "name username profilePicture") // on recupe les infos de l'utilisateur ayant repondu
      .populate("appointments.user", "name username profileImage")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.status(200).json({
      panneaux,
      totalPages: Math.ceil(totalPanneaux / limit),
      currentPage: page,
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des panneaux:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
};
const createPanneau = async (req, res) => {
  try {
    const { content } = req.body;

    if (!content) {
      return res.status(400).json({ message: "Contenu manquant" });
    }

    // Règles d'exclusivité : un seul type de média à la fois
    const hasImages = req.files?.images && req.files.images.length > 0;
    const hasVideo = req.files?.video && req.files.video.length > 0;
    const hasPDF = req.files?.pdfdoc && req.files.pdfdoc.length > 0;

    const typeCount = [hasImages, hasVideo, hasPDF].filter(Boolean).length;

    if (typeCount > 1) {
      return res.status(400).json({
        message:
          "Vous ne pouvez envoyer qu'un seul type de média : images (max 5), vidéo ou PDF.",
      });
    }

    const newPanneau = new Panneau({
      author: req.user._id,
      content,
      media: [],
    });

    // 📸 Upload d’images
    if (hasImages) {
      if (req.files.images.length > 5) {
        return res
          .status(400)
          .json({ message: "Maximum 5 images autorisées." });
      }

      const imageUploadResults = await Promise.all(
        req.files.images.map((file) =>
          uploadBufferToCloudinary(file.buffer, {
            folder: "posts",
            resource_type: "image",
          })
        )
      );

      const imageMedia = imageUploadResults.map((result) => ({
        url: result.secure_url,
        type: "image",
      }));

      newPanneau.media = imageMedia;
    }

    // 📄 Upload PDF
    if (hasPDF) {
      const pdfResult = await uploadBufferToCloudinary(
        req.files.pdfdoc[0].buffer,
        {
          folder: "posts",
          resource_type: "raw",
        }
      );

      newPanneau.media = [
        {
          url: pdfResult.secure_url,
          type: "pdf",
        },
      ];
    }

    // 🎥 Upload vidéo
    if (hasVideo) {
      const videoResult = await uploadBufferToCloudinary(
        req.files.video[0].buffer,
        {
          folder: "posts",
          resource_type: "video",
        }
      );

      newPanneau.media = [
        {
          url: videoResult.secure_url,
          type: "video",
          duration: videoResult.duration || null,
        },
      ];
    }

    // Sauvegarde en base
    await newPanneau.save();

    return res
      .status(201)
      .json({ message: "Panneau créé avec succès", post: newPanneau });
  } catch (error) {
    console.error("Erreur lors de la création du panneau:", error);
    return res.status(500).json({ message: "Erreur serveur" });
  }
};

const getPanneauById = async (req, res) => {
  try {
    const { id } = req.params;

    //  Vérification si l'ID est bien un ObjectId valide avant de faire la requête
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "ID invalide" });
    }

    // Recherche du panneau + population des relations
    const panneau = await Panneau.findById(id)
      .populate("author", "name username profileImage")
      .populate("likes", "name username profileImage")
      .populate("comments.user", "name username profilePicture")
      .populate("comments.repliescommente.user", "name username profileImage")
      .populate("appointments.user", "name username profileImage");

    if (!panneau) {
      return res.status(404).json({ message: "Panneau introuvable" });
    }

    // ✅ Réponse complète avec les médias inclus automatiquement
    res.status(200).json(panneau);
  } catch (error) {
    console.error("Erreur lors de la récupération du panneau :", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
};
const updatePanneau = async (req, res) => {
  try {
    const { id } = req.params;
    const { content, removeMedia, removeVideo } = req.body; // On prend en compte removeVideo pour la suppression de la vidéo

    if (!content || content.trim() === "") {
      return res.status(400).json({ message: "Le contenu est obligatoire" });
    }

    const panneau = await Panneau.findById(id);
    if (!panneau) {
      return res.status(404).json({ message: "Panneau introuvable" });
    }

    // Vérification que l'utilisateur connecté est bien l'auteur
    if (panneau.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Action non autorisée" });
    }

    // Mise à jour du contenu
    panneau.content = content;

    // Gestion de l'image (si présente)
    if (removeMedia === "true") {
      panneau.image = null;
    } else if (req.files && req.files.image) {
      const imageUrl = await uploadImage(req.files.image); // Fonction upload d'image
      panneau.image = imageUrl;
    }

    // Gestion de la vidéo (si présente)
    if (removeVideo === "true") {
      panneau.video = null; // Suppression de la vidéo
    } else if (req.files && req.files.video) {
      const videoUrl = await uploadVideo(req.files.video); // Fonction upload vidéo
      panneau.video = videoUrl;
    }

    await panneau.save();

    res.status(200).json({ message: "Panneau mis à jour", panneau });
  } catch (error) {
    console.error("Erreur lors de la mise à jour du panneau:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
};
const deletePanneau = async (req, res) => {
  try {
    const { id } = req.params;

    const panneau = await Panneau.findById(id);
    if (!panneau) {
      return res.status(404).json({ message: "Panneau introuvable" });
    }

    // Vérification que l'utilisateur connecté est bien l'auteur
    if (panneau.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Action non autorisée" });
    }

    await panneau.deleteOne();

    res.status(200).json({ message: "Panneau supprimé avec succès" });
  } catch (error) {
    console.error("Erreur lors de la suppression du panneau:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

const toggleLike = async (req, res) => {
  try {
    const { panneauId } = req.params;
    const userId = req.user._id;

    const post = await Panneau.findById(panneauId);
    if (!post) return res.status(404).json({ message: "Post introuvable" });

    const alreadyLiked = post.likes.includes(userId);

    if (alreadyLiked) {
      post.likes = post.likes.filter(
        (id) => id.toString() !== userId.toString()
      );
    } else {
      post.likes.push(userId);
    }

    await post.save();

    res.status(200).json({
      message: alreadyLiked ? "Like retiré" : "Post liké",
      likesCount: post.likes.length,
    });
  } catch (error) {
    console.error("Erreur lors du like:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

const addComment = async (req, res) => {
  try {
    const { id: panneauId } = req.params;
    const { content } = req.body;

    if (!content || content.trim() === "") {
      return res.status(400).json({ message: "Le commentaire est vide" });
    }

    // Récupérer le post
    const post = await Panneau.findById(panneauId)
      .populate({
        path: "comments.user",
        select: "name username profilePicture",
      })
      
      .populate({
        path: "author",
        select: "name username profilePicture",
      });

    if (!post) return res.status(404).json({ message: "Post introuvable" });

    // Récupérer l'utilisateur qui commente (avec son image de profil et autres infos)
    const user = req.user;

    // Ajouter le commentaire au post avec les infos utilisateur
    const newComment = {
      user: user._id,
      content,
      profilePicture: user.profilePicture,
      username: user.username,
    };

    post.comments.push(newComment);

    // Sauvegarder le post avec le nouveau commentaire
    await post.save();

    // Vérification et création de notification si c'est le premier commentaire
    const existingNotification = await Notification.findOne({
      recipient: post.author,
      type: "comment",
      relatedPost: panneauId,
      relatedUser: user._id,
    });

    if (
      !existingNotification &&
      post.author.toString() !== user._id.toString()
    ) {
      // Créer une nouvelle notification seulement pour le premier commentaire
      await new Notification({
        recipient: post.author,
        type: "comment",
        relatedUser: user._id,
        relatedPost: panneauId,
      }).save();

      try {
        const postUrl = `${process.env.CLIENT_URL}/panneau/${panneauId}`;
        // Envoi d'email de notification
        await sendCommentNotificationEmail(
          post.author.email,
          post.author.name,
          user.name,
          postUrl,
          content
        );
      } catch (emailError) {
        console.warn("Erreur envoi mail:", emailError);
      }
    }

    // Réponse avec le commentaire ajouté (avec image de profil)
    res.status(201).json({
      message: "Commentaire ajouté avec succès",
      comment: newComment, // Le commentaire contient maintenant des infos utilisateur comme profilePicture et username
    });
  } catch (error) {
    console.error("Erreur createComment:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
};
// Ajouter une réponse à un commentaire
const replyToComment = async (req, res) => {
  try {
    const { panneauId, panneauCommentId } = req.params;
    const { content } = req.body;  // Assure-toi que c'est "content" et pas "text"

    if (!content) {
      return res.status(400).json({ message: "Le contenu de la réponse est requis" });
    }

    const panneau = await Panneau.findById(panneauId);
    if (!panneau) return res.status(404).json({ message: "Panneau introuvable" });

    const comment = panneau.comments.id(panneauCommentId);
    if (!comment) return res.status(404).json({ message: "Commentaire introuvable" });

    comment.repliescommente.push({
      user: req.user._id,
      content,  // Utilisation de "content" ici
    });

    await panneau.save();

    res.status(201).json({ message: "Réponse ajoutée", panneau });
  } catch (error) {
    console.error("Erreur lors de la réponse au commentaire:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
}


const sharePost = async (req, res) => {
  try {
    const { panneauId } = req.params;
    const { platform } = req.body; // ex: "whatsapp", "facebook"

    const post = await Panneau.findById(panneauId);
    if (!post) return res.status(404).json({ message: "Panneau introuvable" });

    post.shares.set(platform, (post.shares.get(platform) || 0) + 1);

    await post.save();
    await panneau.populate({
      path: 'comments.repliescommente.user',  // Le chemin de la référence utilisateur dans les réponses
      select: 'name profilePicture'  // Les champs à récupérer dans le document utilisateur
    });


    res.status(200).json({ message: "Panneau partagé", shares: post.shares });
  } catch (error) {
    console.error("Erreur lors du partage du post panneau:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

const bookAppointment = async (req, res) => {
  try {
    const { panneauId } = req.params;
    const { type, scheduledAt, notes } = req.body;

    const post = await Panneau.findById(panneauId);
    if (!post) return res.status(404).json({ message: "Panneau introuvable" });

    post.appointments.push({
      user: req.user._id,
      type,
      scheduledAt,
      notes,
    });

    await post.save();

    res.status(201).json({ message: "Rendez-vous pris", post });
  } catch (error) {
    console.error("Erreur lors de la prise de rendez-vous:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

const cancelAppointment = async (req, res) => {
  try {
    const { panneauId, appointmentId } = req.params;

    const post = await Panneau.findById(panneauId);
    if (!post) return res.status(404).json({ message: "Panneau introuvable" });

    const appointment = post.appointments.id(appointmentId);
    if (!appointment)
      return res.status(404).json({ message: "Rendez-vous introuvable" });

    appointment.status = "cancelled";
    await post.save();

    res.status(200).json({ message: "Rendez-vous annulé", post });
  } catch (error) {
    console.error("Erreur lors de l'annulation du rendez-vous:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

const rescheduleAppointment = async (req, res) => {
  try {
    const { panneauId, appointmentId } = req.params;
    const { newDate } = req.body;

    const post = await Panneau.findById(panneauId);
    if (!post) return res.status(404).json({ message: "Panneau introuvable" });

    const appointment = post.appointments.id(appointmentId);
    if (!appointment)
      return res.status(404).json({ message: "Rendez-vous introuvable" });

    appointment.status = "rescheduled";
    appointment.scheduledAt = newDate;
    await post.save();

    res.status(200).json({ message: "Rendez-vous reporté", post });
  } catch (error) {
    console.error("Erreur lors du report du rendez-vous:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

const deleteComment = async (req, res) => {
  try {
    const { panneauId, panneauCommentId } = req.params;

    const post = await Panneau.findById(panneauId);
    if (!post) return res.status(404).json({ message: "Post introuvable" });

    const comment = post.comments.id(panneauCommentId);
    if (!comment) return res.status(404).json({ message: "Commentaire introuvable" });

    const isOwner = comment.user.toString() === req.user._id.toString();
    const isAuthor = post.author.toString() === req.user._id.toString();

    if (!isOwner && !isAuthor) {
      return res.status(403).json({ message: "Action non autorisée" });
    }

    post.comments.pull(panneauCommentId);
    await post.save();

    res.status(200).json({ message: "Commentaire supprimé" });
  } catch (error) {
    console.error("Erreur deleteComment:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
};


// Supprimer une réponse d'un commentaire
const deleteReply = async (req, res) => {
  try {
    const { panneauId, panneauCommentId, replyId } = req.params;

    // Recherche du post
    const post = await Panneau.findById(panneauId);
    if (!post) return res.status(404).json({ message: "Post introuvable" });

    // Recherche du commentaire
    const comment = post.comments.id(panneauCommentId);
    if (!comment)
      return res.status(404).json({ message: "Commentaire introuvable" });

    // Recherche de la réponse dans le commentaire
    const reply = comment.repliescommente.id(replyId);
    if (!reply) return res.status(404).json({ message: "Réponse introuvable" });

    // Vérification des droits d'utilisateur
    const isOwner = reply.user.toString() === req.user._id.toString();
    const isAuthor = post.author.toString() === req.user._id.toString();

    if (!isOwner && !isAuthor) {
      return res.status(403).json({ message: "Action non autorisée" });
    }

    // Suppression de la réponse
    comment.repliescommente.pull(replyId);
    await post.save();

    res.status(200).json({ message: "Réponse supprimée" });
  } catch (error) {
    console.error("Erreur deleteReply:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
};


export {
  createPanneau,
  getPanneau,
  getPanneauById,
  updatePanneau,
  deletePanneau,
  toggleLike,
  addComment,
  replyToComment,
  sharePost,
  bookAppointment,
  cancelAppointment,
  rescheduleAppointment,
  deleteComment,
  deleteReply
};
