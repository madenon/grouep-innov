
import mongoose from "mongoose";

const legalTextSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['mentions', 'cookies', 'conditions'],
    required: true,
    unique: true
  },
  title: String,
  content: String,
  lastUpdated: {
    type: Date,
    default: Date.now
  }
});

const LegalText = mongoose.model("LegalText", legalTextSchema);

export default LegalText;
