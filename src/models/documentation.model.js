import mongoose from "mongoose";

const documentSchema = new mongoose.Schema({
  country: { type: mongoose.Schema.Types.ObjectId, ref: 'Country', required: true },
  title: { type: String, required: true },
  category: { type: String, enum: ['troisieme', 'seconde', 'premiere', 'terminale', 'licences1', 'licences2',"licences3","autre"], required: true },
  coverUrl: { type: String, required: true ,  match: /^https?:\/\/.+/ },
  pdfUrl: { type: String, required: true,  match: /^https?:\/\/.+/},
  videoUrl: { type: String, required: true,  match: /^https?:\/\/.+/},
  pages: { type: Number, default: 1 },
  excerpt: { type: String, default: "" },
  author: { type: String, default: "" },              // nouveau champ nom auteur
  releaseDate: { type: Date },                         // nouveau champ date de sortie (optionnel)
  number: { type: Number, default: null },             // nouveau champ numéro (optionnel)
}, { timestamps: true });

const DocumentLibrary = mongoose.model("DocumentLibrary", documentSchema);
export default DocumentLibrary;
