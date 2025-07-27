import express from "express";
import { protectRoutes } from "../middelware/protectRoute.js";
import {
  acceptConnectionRequest,
  getConnectionRequests,
  getConnectionStatus,
  getUserConnections,
  rejectConnectionRequest,
  removeConnection,
  sendConnectionRequest,
} from "../controllers/connection.controler.js";

const router = express.Router();

router.post("/request/:userId", protectRoutes, sendConnectionRequest);
router.put("/accept/:requestId", protectRoutes, acceptConnectionRequest);
router.put("/reject/:requestId", protectRoutes, rejectConnectionRequest);
//get allconnection request for the current user
router.get("/requests", protectRoutes, getConnectionRequests);

router.get("/", protectRoutes, getUserConnections);
router.delete("/:userId", protectRoutes, removeConnection);
router.get("/status/:userId", protectRoutes, getConnectionStatus);

export default router;
