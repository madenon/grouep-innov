import mongoose from 'mongoose';

const exerciseSchema = new mongoose.Schema({
  title: { type: String, required: true },
  content: { type: String, required: true },
  correction: { type: String },
  image: { type: String },
  country: { type: mongoose.Schema.Types.ObjectId, ref: 'Country', required: true },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' }
});

const Exercise = mongoose.model('Exercise', exerciseSchema);

export default Exercise;
