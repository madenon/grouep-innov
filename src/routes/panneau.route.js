import express from "express";
import {
  addComment,
  createPanneau,
  deleteComment,
  deletePanneau,
  deleteReply,
  getPanneau,
  getPanneauById,
  replyToComment,
  toggleLike,
  updatePanneau,
} from "../controllers/panneau.controller.js";
import { protectAdminAndSuperAdminRoutes, protectRoutes } from "./../middelware/protectRoute.js";
import upload from "../middelware/uplod.post.js";

const router = express.Router();

router.post(
  "/create",
  upload.fields([
    { name: "images", maxCount: 5 },
    { name: "video", maxCount: 1 },
    { name: "pdfdoc", maxCount: 1 },
  ]),
  protectAdminAndSuperAdminRoutes,
  createPanneau
);
router.get("/get", getPanneau);
router.get("/:id", getPanneauById);
router.put("/:id", protectAdminAndSuperAdminRoutes, updatePanneau);
router.post("/:panneauId/like", protectRoutes, toggleLike);
router.post("/:id/comment/", protectRoutes, addComment);
router.delete("/:id", protectAdminAndSuperAdminRoutes, deletePanneau);
router.delete("/:panneauId/comments/:panneauCommentId", protectRoutes, deleteComment);
router.post("/:panneauId/comments/:panneauCommentId/replies", protectRoutes, replyToComment);
router.delete("/:panneauId/comments/:panneauCommentId/replies/:replyId", protectRoutes, deleteReply);



export default router;
