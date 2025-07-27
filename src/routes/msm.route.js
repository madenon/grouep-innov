import express from "express";
import { createMessage, deleteMessage, getMessages } from "../controllers/msm.controller.js";
import { protectRoutes } from "../middelware/protectRoute.js";


const router = express.Router();

// Route pour envoyer un message
router.post("/", protectRoutes, createMessage);
router.get("/:userId/messages", getMessages);
// Route pour supprimer un message
router.delete("/:conversationId/messages/:messageId", protectRoutes, deleteMessage);

export default router