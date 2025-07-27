import express from "express";
import fetch from "node-fetch";
import { protectRoutes } from './../middelware/protectRoute.js';
import upload from "../middelware/uplod.post.js";
import {
  createComment,
  createPosts,
  deleteComment,
  deletePosts,
  deleteReply,
  getFeedPosts,
  getPostById,
  likePost,
  replyToComment,
  updateComment,
  updatePost,
  updateReply,
} from "../controllers/post.controller.js";

const router = express.Router();
/** Proxy Vidéo */
router.get("/video-proxy", async (req, res) => {
  try {
    const videoUrl = req.query.url;

    if (!videoUrl || !videoUrl.startsWith("https://res.cloudinary.com")) {
      return res.status(400).send("URL vidéo invalide ou manquante");
    }

    const response = await fetch(videoUrl);

    if (!response.ok) {
      return res.status(404).send("Vidéo introuvable ou erreur serveur Cloudinary");
    }

    // Démarrage de l'envoi de la vidéo avec le bon type MIME
    const contentType = response.headers.get("content-type");
    res.set({
      "Content-Type": contentType || "video/mp4", // Type de contenu dynamique
      "Content-Disposition": "inline; filename=video.mp4",
    });

    response.body.pipe(res);
  } catch (err) {
    console.error("Erreur proxy vidéo:", err);
    res.status(500).send("Erreur serveur proxy vidéo");
  }
});
// Autres routes
router.get("/", protectRoutes, getFeedPosts); // ou getPostById si nécessaire

router.post(
  '/',
  protectRoutes,
  upload.fields([
    { name: "images", maxCount: 1 },
    { name: "video", maxCount: 1 },
    
  ]),
  createPosts
);

router.put(
  '/:id',
  protectRoutes,
  updatePost
);

router.delete("/:id", protectRoutes, deletePosts);
router.get("/:id", protectRoutes, getPostById);
// Route de mise à jour de commentaire
router.put("/:postId/comments/:commentId", protectRoutes, updateComment);
router.delete("/:postId/comments/:commentId", protectRoutes, deleteComment);

router.post("/:id/comment", protectRoutes, createComment);
router.post("/:id/like", protectRoutes, likePost);
router.post("/:postId/:commentId/replies",protectRoutes, replyToComment); 
router.put("/:postId/comments/:commentId/replies/:replyId", protectRoutes, updateReply); 
router.delete("/:postId/comments/:commentId/replies/:replyId", protectRoutes, deleteReply);

export default router;