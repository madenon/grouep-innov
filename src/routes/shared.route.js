import express from "express"
import { protectRoutes } from "../middelware/protectRoute.js";
import { getSharesByPost, sharePost } from "../controllers/shared.contoller.js";

const router = express.Router()

router.post("/:id", protectRoutes, sharePost);
router.get("/post/:postId", protectRoutes, getSharesByPost);

export default router