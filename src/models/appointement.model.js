import mongoose from "mongoose";

const appointmentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",  // Référence à l'utilisateur qui réserve le rendez-vous
      required: true
    },
    type: {
      type: String,
      enum: ["installation", "discussion"],  // Types de rendez-vous disponibles
      required: true
    },
    status: {
      type: String,
      enum: ["pending", "confirmed", "cancelled", "rescheduled"],  // Statut du rendez-vous
      default: "pending"  // Par défaut le rendez-vous est "en attente"
    },
    scheduledAt: { 
      type: Date, 
      required: true 
    },
    notes: { 
      type: String, 
      default: ""  // Notes supplémentaires sur le rendez-vous
    }
  },
  { 
    timestamps: true  // Ajoute les champs `createdAt` et `updatedAt`
  }
);

const Appointment = mongoose.model("Appointment", appointmentSchema);

export default Appointment;
