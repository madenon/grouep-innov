import express from "express";
import { createFilter, deleteFilter, getGroupedFilters, updateFilter } from "../controllers/filter.controller.js";
import { protectAdminRoutes } from "../middelware/protectRoute.js";

const router = express.Router();

router.get("/",getGroupedFilters)
router.post("/create", protectAdminRoutes, createFilter)
router.put("/:id", protectAdminRoutes,updateFilter)
router.delete("/:id", protectAdminRoutes, deleteFilter)

export default router