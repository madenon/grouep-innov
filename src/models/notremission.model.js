import mongoose from "mongoose";
const notreSchema = new mongoose.Schema(
  {
    content: { type: String, required: true },
    contenu: { type: String, required: true },
    objectif: { type: String, required: true },
    date: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

const NotreMission = mongoose.model("NotreMission", notreSchema);
export default NotreMission;
