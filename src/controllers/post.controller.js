import cloudinary from "../lib/cloudinary.js";
import { sendCommentNotificationEmail } from "../mailtrap/emails.js";
import Notification from "../models/notification.model.js";
import Post from "../models/posts.model.js";
import streamifier from "streamifier";

/** GET - Feed des posts */
const getFeedPosts = async (req, res) => {
  try {
    // Paramètres de recherche (si disponible)
    const search = req.query.search?.trim();
    const regex = search ? new RegExp(search, "i") : null;

    // Définition du filtre de recherche
    const filter = regex ? { content: regex } : {};

    // Paramètres de pagination (page et limit)
    const page = Math.max(1, parseInt(req.query.page)) || 1; // Page minimale 1
    const limit = Math.min(50, parseInt(req.query.limit)) || 100; // Limite maximale 50
    const skip = (page - 1) * limit;

    // Récupération des posts avec les utilisateurs, et gestion de la pagination
    const [rawPosts, total] = await Promise.all([
      Post.find(filter)
        .populate("author", "name username profilePicture headline")
        .populate("comments.user", "name profilePicture")
        .sort({ createdAt: -1 }) // Trier par date (les plus récents en premier)
        .skip(skip) // Pagination (sauter les posts déjà récupérés)
        .limit(limit) // Limiter le nombre de posts
        .lean(), // Pour transformer le résultat en un format JavaScript natif
      Post.countDocuments(filter), // Compter le total de posts selon le filtre
    ]);

    // Traitement des posts pour ajouter les comptages de "likes" et "comments"
    const posts = rawPosts.map((post) => ({
      ...post,
      likeCount: post.likes.length, // Nombre de likes
      commentCount: post.comments.length, // Nombre de commentaires
    }));

    // Calcul des pages totales
    const totalPages = Math.ceil(total / limit);

    // Retourner la réponse avec les posts et des informations de pagination
    res.status(200).json({
      posts,
      currentPage: page,
      totalPages,
      totalPosts: total,
    });
  } catch (error) {
    console.error("Erreur getFeedPosts:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

const createPosts = async (req, res) => {
  try {
    const { content } = req.body;

    // Vérification que le contenu est présent
    if (!content) return res.status(400).json({ message: "Contenu manquant" });

    // Création du nouveau post
    let newPost = new Post({
      author: req.user._id,
      content,
    });

    // Vérification et gestion de l'image (si présente)
    if (req.files?.images && req.files.images[0]?.buffer) {
      const imgResult = await uploadBufferToCloudinary(
        req.files.images[0].buffer,
        { folder: "posts", resource_type: "image" }
      );
      newPost.image = imgResult.secure_url;
      newPost.imagePublicId = imgResult.public_id;
    }

    // Vérification et gestion de la vidéo (si présente)
    if (req.files?.video && req.files.video[0]?.buffer) {
      const videoResult = await uploadBufferToCloudinary(
        req.files.video[0].buffer,
        { folder: "posts", resource_type: "video" }
      );
      newPost.videoFile = videoResult.secure_url;
      newPost.videoPublicId = videoResult.public_id;
    }

    // Sauvegarde du post
    await newPost.save();

    // Renvoyer la réponse avec le nouveau post créé
    res.status(201).json({ message: "Post créé avec succès", post: newPost });
  } catch (error) {
    // Gérer l'erreur
    console.error("Erreur lors de l'upload ou de la création du post:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
};
const deletePosts = async (req, res) => {
  try {
    const { id: postId } = req.params;
    const userId = req.user?._id; // Vérifie si req.user est défini et contient _id

    if (!userId) {
      return res.status(400).json({ message: "Utilisateur non authentifié" });
    }

    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ message: "Post introuvable" });

    // Vérifie si l'auteur du post est bien l'utilisateur connecté
    if (post.author?.toString() !== userId.toString()) {
      return res.status(403).json({ message: "Action non autorisée" });
    }

    /* 🔹 Rassembler TOUTES les URLs à supprimer (images[], vidéo, pdf) */
    const mediaUrls = [
      ...(post.images || []), // aplatit le tableau d’images
      post.videoFile,
      post.pdfFile,
    ].filter(Boolean); // retire undefined / null

    // 🔹 Suppression Cloudinary
    await deleteCloudinaryMedia(mediaUrls);

    // 🔹 Suppression du document MongoDB
    await Post.findByIdAndDelete(postId);

    res.status(200).json({ message: "Post supprimé avec succès" });
  } catch (error) {
    console.error("Erreur deletePosts:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
};
/** GET - Post par ID */
const getPostById = async (req, res) => {
  const { id } = req.params;
  try {
    const post = await Post.findById(id); // Ou ton modèle Mongoose spécifique
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }
    res.json({ post });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
};

/** POST - Ajouter un commentaire */
const createComment = async (req, res) => {
  try {
    const { id: postId } = req.params;
    const { content } = req.body;

    if (!content || content.trim() === "") {
      return res.status(400).json({ message: "Le commentaire est vide" });
    }

    // Ajout du commentaire brut
    const post = await Post.findByIdAndUpdate(
      postId,
      {
        $push: {
          comments: {
            user: req.user._id,
            content,
          },
        },
      },
      { new: true }
    );

    if (!post) return res.status(404).json({ message: "Post introuvable" });

    // Récupérer le commentaire ajouté
    const newComment = post.comments.at(-1);

    // Repeupler manuellement le champ user du nouveau commentaire

    // Notification
    if (post.author.toString() !== req.user._id.toString()) {
      await new Notification({
        recipient: post.author,
        type: "comment",
        relatedUser: req.user._id,
        relatedPost: postId,
      }).save();

      try {
        const postUrl = `${process.env.CLIENT_URL}/post/${postId}`;
        await sendCommentNotificationEmail(
          post.author.email,
          post.author.name,
          req.user.name,
          postUrl,
          content
        );
      } catch (emailError) {
        console.warn("Erreur envoi mail:", emailError);
      }
    }

    res.status(201).json({
      message: "Commentaire ajouté avec succès",
      comment: newComment, // ici, newComment.user est bien peuplé
    });
  } catch (error) {
    console.error("Erreur createComment:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
};
/** PUT - Modifier un post */
const updatePost = async (req, res) => {
  const { id: postId } = req.params;
  const { content } = req.body;

  try {
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: "Post introuvable" });
    }

    const userId = req.user?._id;
    if (!userId) {
      return res.status(400).json({ message: "Utilisateur non authentifié" });
    }

    if (post.author?.toString() !== userId.toString()) {
      return res.status(403).json({ message: "Action non autorisée" });
    }

    post.content = content || post.content;

    // Sauvegarde
    await post.save();

    res.status(200).json({ message: "Post mis à jour avec succès", post });
  } catch (error) {
    console.error("Erreur updatePost:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
};
/** PUT - Modifier un commentaire */
const updateComment = async (req, res) => {
  try {
    const { postId, commentId } = req.params;
    const { content } = req.body;

    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ message: "Post introuvable" });

    const comment = post.comments.id(commentId);
    if (!comment)
      return res.status(404).json({ message: "Commentaire introuvable" });

    if (comment.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Action non autorisée" });
    }

    comment.content = content;
    await post.save();

    res.status(200).json({ message: "Commentaire mis à jour", comment });
  } catch (error) {
    console.error("Erreur updateComment:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
};
/** DELETE - Commentaire */



 const deleteComment = async (req, res) => {
  const { postId, commentId } = req.params;

  try {
    // Vérifier si le post existe
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: "Post non trouvé" });
    }

    // Vérifier si le commentaire existe
    const commentIndex = post.comments.findIndex(
      (comment) => comment._id.toString() === commentId
    );
    if (commentIndex === -1) {
      return res.status(404).json({ message: "Commentaire non trouvé" });
    }

    // Supprimer le commentaire
    post.comments.splice(commentIndex, 1);
    await post.save();

    res.status(200).json({ message: "Commentaire supprimé avec succès" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erreur interne du serveur" });
  }
};

/** POST - Like / Unlike un post */
const likePost = async (req, res) => {
  try {
    const { id: postId } = req.params;
    const userId = req.user._id;

    // Récupérer le post
    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ message: "Post introuvable" });

    // Vérifier si l'utilisateur a déjà aimé le post
    const hasLiked = post.likes.some(
      (id) => id.toString() === userId.toString()
    );

    if (hasLiked) {
      // Si l'utilisateur a déjà aimé le post, on supprime le like
      post.likes.pull(userId);
    } else {
      // Sinon, on ajoute le like
      post.likes.push(userId);

      // Envoi de notification si l'utilisateur n'est pas l'auteur du post
      if (post.author.toString() !== userId.toString()) {
        const newNotification = new Notification({
          recipient: post.author,
          type: "like",
          relatedUser: userId,
          relatedPost: postId,
        });
        await newNotification.save();
      }
    }

    // Sauvegarder les modifications du post
    await post.save();

    // Peupler les données de l'auteur du post avant de renvoyer la réponse
    await post.populate("author", "name username profilePicture headline");

    res.status(200).json(post);
  } catch (error) {
    console.error("Erreur likePost:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
};
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
/** Helper: Supprimer des médias Cloudinary */
const deleteCloudinaryMedia = async (mediaArray) => {
  if (!Array.isArray(mediaArray)) return; // ✅ sécurité

  for (const media of mediaArray) {
    const publicId = extractCloudinaryPublicId(media);
    if (publicId) {
      await cloudinary.uploader.destroy(publicId);
    }
  }
};
/** GET - Nombre de posts de l'utilisateur */
const getUserPostCount = async (req, res) => {
  try {
    // Vérification de l'authentification de l'utilisateur
    if (!req.user || !req.user._id) {
      return res.status(400).json({ message: "Utilisateur non authentifié" });
    }

    // Option de filtrage pour ne compter que les posts actifs, par exemple
    const count = await Post.countDocuments({
      author: req.user._id,
      isDeleted: { $ne: true }, // Exclut les posts supprimés
    });

    // Retourner le compte
    res.status(200).json({ count });
  } catch (error) {
    console.error("Erreur getUserPostCount:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
};
const extractCloudinaryPublicId = (url) => {
  if (!url) return null;

  try {
    // Exemple: https://res.cloudinary.com/ton-cloud/image/upload/v123456/posts/abcxyz.jpg
    const parts = url.split("/upload/")[1]; // on garde "v123456/posts/abcxyz.jpg"
    if (!parts) return null;

    const segments = parts.split("/").slice(1); // ignore "v123456"
    const fileName = segments.join("/"); // "posts/abcxyz.jpg"
    const publicId = fileName.substring(0, fileName.lastIndexOf(".")); // retire ".jpg" => "posts/abcxyz"

    return publicId;
  } catch (err) {
    console.warn("Erreur extractCloudinaryPublicId:", err);
    return null;
  }
};

const updateReply = async (req, res) => {
  const { postId, commentId, replyId } = req.params;
  const { content } = req.body;

  if (!content?.trim()) {
    return res
      .status(400)
      .json({ message: "Le contenu de la réponse est vide." });
  }

  try {
    const post = await Post.findOne({ _id: postId, "comments._id": commentId });
    if (!post)
      return res
        .status(404)
        .json({ message: "Post ou commentaire introuvable" });

    const comment = post.comments.id(commentId);
    const reply = comment.replies.id(replyId);

    if (!reply) return res.status(404).json({ message: "Réponse introuvable" });

    // Vérification si l'utilisateur est bien l'auteur de la réponse
    if (reply.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Action non autorisée." });
    }

    reply.content = content.trim();
    await post.save();

    res.status(200).json({
      message: "Réponse mise à jour avec succès.",
      reply,
    });
  } catch (err) {
    console.error("Erreur lors de la mise à jour de la réponse:", err);
    res.status(500).json({ message: "Erreur serveur" });
  }
};


const replyToComment = async (req, res) => {
  try {
    const { postId, commentId } = req.params;
    const { content } = req.body; // Assure-toi que c'est "content" et pas "text"

    if (!content) {
      return res.status(400).json({ message: "Le contenu de la réponse est requis" });
    }

    // Recherche le post
    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ message: "Post introuvable" });

    // Recherche le commentaire spécifique
    const comment = post.comments.id(commentId);
    if (!comment) return res.status(404).json({ message: "Commentaire introuvable" });

    // Vérifie si une réponse existe déjà. Si oui, refuse l'ajout d'une nouvelle réponse.
    if (comment.reply) {
      return res.status(400).json({ message: "Ce commentaire a déjà une réponse." });
    }

    // Ajout de la réponse dans le champ `reply`
    comment.reply = {
      user: req.user._id, // L'utilisateur qui répond
      content,            // Le contenu de la réponse
      createdAt: new Date(),
    };

    // Sauvegarde les changements dans la base de données
    await post.save();

    res.status(201).json({ message: "Réponse ajoutée", post });
  } catch (error) {
    console.error("Erreur lors de la réponse au commentaire:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

const deleteReply = async (req, res) => {
  try {
    const { postId, commentId, replyId } = req.params;

    // Recherche du post
    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ message: "Post introuvable" });

    // Recherche du commentaire
    const comment = post.comments.id(commentId);
    if (!comment) return res.status(404).json({ message: "Commentaire introuvable" });

    // Recherche de la réponse dans le commentaire
    const reply = comment.reply.id(replyId); // Remplacer "repliescommente" par "reply"
    if (!reply) return res.status(404).json({ message: "Réponse introuvable" });

    // Vérification des droits d'utilisateur
    const isOwner = reply.user.toString() === req.user._id.toString();  // Utilisateur ayant écrit la réponse
    const isAuthor = post.author.toString() === req.user._id.toString(); // Auteur du post

    if (!isOwner && !isAuthor) {
      return res.status(403).json({ message: "Action non autorisée" });
    }

    // Suppression de la réponse
    comment.reply.pull(replyId); // Utiliser .pull() pour supprimer la réponse du tableau
    await post.save();

    res.status(200).json({ message: "Réponse supprimée" });
  } catch (error) {
    console.error("Erreur deleteReply:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
};


export {
  getFeedPosts,
  createPosts,
  getPostById,
  updatePost,
  likePost,
  getUserPostCount,
  deletePosts,
  createComment,
  updateComment,
  deleteComment,
  replyToComment,
  updateReply,
  deleteReply,
};
