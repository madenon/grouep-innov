import express from "express";
import { createCountry, deleteCountry, getCountries, updateCountry } from "../controllers/country.controler.js";
import { protectAdminAndSuperAdminRoutes, protectAdminRoutes } from "../middelware/protectRoute.js";
//protectAdminRoutes, a importer 
const router = express.Router();
router.post("/",protectAdminRoutes, protectAdminAndSuperAdminRoutes,  createCountry)
router.get("/", getCountries)
router.delete("/:id",protectAdminRoutes,protectAdminAndSuperAdminRoutes,  deleteCountry);
router.put("/:id",protectAdminRoutes,protectAdminAndSuperAdminRoutes,  updateCountry); //

export default router   