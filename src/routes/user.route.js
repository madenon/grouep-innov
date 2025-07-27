import express from 'express'
import { protectRoutes } from '../middelware/protectRoute.js'
import { getPublicProfile, getSuggestedConnection, updateProfile } from '../controllers/user.controller.js'

const router = express.Router()

router.get("/suggestions", protectRoutes,getSuggestedConnection)
router.get("/pr/:username", protectRoutes,getPublicProfile)
router.put("/profile", protectRoutes,updateProfile)

export default router