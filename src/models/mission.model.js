import mongoose from "mongoose";
const missionSchema = new mongoose.Schema(
  {
    content: { type: String, required: true },
    date: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

const MissionPanneau = mongoose.model("MissionPanneau", missionSchema);
export default MissionPanneau;
