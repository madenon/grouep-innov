import express from 'express';
import { createBookCover, deleteBookCover, getBookCoverById, getBookCovers, updateBookCover } from '../controllers/education.controller.js';
import upload from '../middelware/educationFille.js';
import { protectAdminRoutes } from './../middelware/protectRoute';

const router = express.Router();

// Route POST pour créer une couverture avec image
router.post('/create', protectAdminRoutes, upload.single('image'), createBookCover);
router.get("/bookcovers", getBookCovers);
router.get("/bookcovers/:id", getBookCoverById);
router.put("/bookcovers/:id", protectAdminRoutes, upload.single('image'), updateBookCover);
router.delete("/bookcovers/:id", protectAdminRoutes, deleteBookCover);


export default router