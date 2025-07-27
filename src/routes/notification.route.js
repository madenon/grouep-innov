import express from "express";
import { protectRoutes } from "../middelware/protectRoute.js";
import { deleteNotification, getUserNotifications, markNotificationAsRead } from "../controllers/notification.controller.js";

const router = express.Router();

router.get("/",protectRoutes,getUserNotifications )
router.put("/:id/read",protectRoutes,markNotificationAsRead )
router.delete("/:id",protectRoutes,deleteNotification )

export default router