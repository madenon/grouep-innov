import mongoose from "mongoose";

// Schéma pour les commentaires
const commentSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    content: { type: String, required: true },
    repliescommente: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        content: { type: String, required: true },
        createdAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

// Schéma pour les rendez-vous
const appointmentSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    scheduledAt: { type: Date, required: true },
    notes: { type: String },
  },
  { timestamps: true }
);

// Schéma pour le panneau de messages
const panneauSchema = new mongoose.Schema(
  {
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    content: { type: String, required: true },
    media: [
      {
        url: String,
        type: { type: String, enum: ["image", "video", "pdf"] },
        duration: Number, // utile pour vidéo
      },
    ],
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    shares: {
      type: Map,
      of: Number, // { whatsapp: 3, facebook: 2, linkedin: 1 }
      default: {},
    },
    comments: [commentSchema],
    appointments: [appointmentSchema], // Liste des rendez-vous associés au panneau
  },
  { timestamps: true }
);

// Modèle du panneau
const Panneau = mongoose.model("Panneau", panneauSchema);
export default Panneau;
