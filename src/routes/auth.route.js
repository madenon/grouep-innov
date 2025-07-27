import express from "express";
import { login, logout, signup, verifyEmail,forgotPassword,resetPassword,checkAuth, getCurrentUser } from "../controllers/auth.controller.js";
import { protectRoutes } from "../middelware/protectRoute.js";

const router = express.Router();

router.get("/check-auth",protectRoutes, checkAuth)
router.post("/signup",signup)
router.post("/login",login)
router.post("/logout",logout)

//get current user
router.get("/me",protectRoutes,getCurrentUser)
router.post("/forgot-password",forgotPassword)
router.post("/verify-email", verifyEmail);

router.post("/reset-password/:panneaux",resetPassword)



export default router;