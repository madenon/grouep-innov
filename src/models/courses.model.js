import mongoose from 'mongoose';

const courseSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true }, // Titre du cours
  image: { type: String }, // URL de l'image
  city: { type: String, trim: true },
  videocour: { type: String }, // URL de la vidéo
  content: { type: String, required: true }, // Contenu texte ou HTML
  subject: { type: String, trim: true }, // Nom de la matière (ex: Math)
  country: { type: mongoose.Schema.Types.ObjectId, ref: 'Country', required: true },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

const Course = mongoose.model('Course', courseSchema);

export default Course;
