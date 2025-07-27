import express from "express";
import { protectAdminAndSuperAdminRoutes } from "../middelware/protectRoute.js";
import {
  createNotreMission,
  deleteNotreMission,
  getNotreMissionById,
  getNotreMissions,
  updateNotreMission,
} from "../controllers/notremissiom.controller.js";

const router = express.Router();
router.post("/create", protectAdminAndSuperAdminRoutes, createNotreMission);
router.get("/", getNotreMissions);
router.get("/:id", getNotreMissionById);
router.put("/:id", protectAdminAndSuperAdminRoutes, updateNotreMission);
router.delete(
  "/delete/:id",
  protectAdminAndSuperAdminRoutes,
  deleteNotreMission
);

export default router;
