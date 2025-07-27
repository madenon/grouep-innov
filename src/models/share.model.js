// models/share.model.js
import mongoose from "mongoose";

const shareSchema = new mongoose.Schema(
  {
    post: { type: mongoose.Schema.Types.ObjectId, ref: "Post", required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    platform: {
      type: String,
      enum: ["email", "whatsapp", "linkedin", "facebook", "twitter", "autre"],
      required: true,
    },
  },
  { timestamps: true }
);

const Share = mongoose.model("Share", shareSchema);

export default Share;
