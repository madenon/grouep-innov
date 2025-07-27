import mongoose from 'mongoose';

const examSchema = new mongoose.Schema({
  title: { type: String, required: true },
  type: { type: String, enum: ['Final', 'Midterm', 'Test de niveau'], required: true },
  content: { type: String },
  image: { type: String },
  country: { type: mongoose.Schema.Types.ObjectId, ref: 'Country', required: true },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' }
});

const Examen = mongoose.model('Examen', examSchema);

export default Examen;
