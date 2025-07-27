import express from "express";

import { protectAdminAndSuperAdminRoutes, protectAdminRoutes, protectRoutes } from "../middelware/protectRoute.js";
import {
  cancelAppointment,
  checkAvailability,
  getAllAppointments,
  getAppointmentById,
  rescheduleAppointment,
  reserveAppointment,
} from "../controllers/rendez-vous.controller.js";

const router = express.Router();

// Vérifier la disponibilité du créneau
router.get("/check-availability", checkAvailability);

// Réserver un créneau
router.post("/reserve", protectRoutes, reserveAppointment);

router.get("/all", protectAdminRoutes, getAllAppointments);

// Annuler un rendez-vous
router.patch("/cancel/:appointmentId", protectAdminAndSuperAdminRoutes, cancelAppointment);

// Reporter un rendez-vous
router.patch(
  "/reschedule/:appointmentId",
  protectRoutes,
  rescheduleAppointment
);

// Récupérer un rendez-vous par son ID
router.get("/:appointmentId", getAppointmentById);

export default router;
