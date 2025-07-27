import express from "express";
import { protectAdminAndSuperAdminRoutes } from "./../middelware/protectRoute.js";
import {
  createMission,
  deleteMission,
  getMissionById,
  getMissions,
  updateMission,
} from "../controllers/mission.panneau.controller.js";

const router = express.Router();
router.post("/create", protectAdminAndSuperAdminRoutes, createMission);
router.get("/", getMissions);
router.get("/:id", getMissionById);
router.put("/:id", protectAdminAndSuperAdminRoutes, updateMission);
router.delete("/delete/:id", protectAdminAndSuperAdminRoutes, deleteMission);

export default router;
