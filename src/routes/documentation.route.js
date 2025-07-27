import express from "express"
import { protectAdminRoutes } from "../middelware/protectRoute.js"
import { protectAdminAndSuperAdminRoutes } from './../middelware/protectRoute.js';
import { createDocument, deleteDocument, getAllDocuments, getDocumentById, updateDocument } from "../controllers/documentation.controller.js";
import upload from "../middelware/uplod.post.js";

const router = express.Router()
router.post("/", protectAdminRoutes,protectAdminAndSuperAdminRoutes,upload.array('files', 10), createDocument)
router.put("/:id", protectAdminRoutes,protectAdminAndSuperAdminRoutes, upload.array('files',10), updateDocument)
router.delete("/:id", protectAdminRoutes,protectAdminAndSuperAdminRoutes, deleteDocument)
router.get("/:id", getDocumentById);
router.get("/", getAllDocuments);


export default router