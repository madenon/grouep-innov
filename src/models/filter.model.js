import mongoose from "mongoose";
const filterSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ["juridiction", "thematique", "annee"], // ou "year"
    required: true,
  },
  label: {
    type: String,
    required: true,
  },
  country: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Country", // référence à ton modèle de pays
    required: true, // tu peux le mettre en false si tu veux rendre ça optionnel
  },
}, { timestamps: true });

const Filter = mongoose.model("Filter", filterSchema);
export default Filter;