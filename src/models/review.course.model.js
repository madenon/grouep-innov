import mongoose from 'mongoose';

const courseReviewSchema = new mongoose.Schema({
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  comment: {
    type: String,
    trim: true
  }
}, { timestamps: true });

// Un utilisateur ne peut évaluer un cours qu'une seule fois
courseReviewSchema.index({ course: 1, author: 1 }, { unique: true });

const CourseReview = mongoose.model('CourseReview', courseReviewSchema);

export default CourseReview;
