import express from "express";
import { createLegalText, getLegalText, updateLegalText } from "../controllers/legal.text.controller.js";
import { protectAdminAndSuperAdminRoutes, protectAdminRoutes } from "../middelware/protectRoute.js";


const router = express.Router();

//protectAdminRoutes import 
router.post("/:type",protectAdminAndSuperAdminRoutes, createLegalText); // POST /legal
router.get("/:type", getLegalText); // GET /legal/:type
router.put("/:type",protectAdminAndSuperAdminRoutes, updateLegalText); // 
export default router