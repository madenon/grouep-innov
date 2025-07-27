import CourseReview from "../models/review.course.model.js";

export const createOrUpdateReview = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { rating, comment } = req.body;
    const userId = req.userId; // supposé extrait via middleware d'auth

    const existingReview = await CourseReview.findOne({ course: courseId, author: userId });

    if (existingReview) {
      existingReview.rating = rating;
      existingReview.comment = comment;
      await existingReview.save();
      return res.status(200).json({ message: "Avis mis à jour", review: existingReview });
    }

    const newReview = new CourseReview({
      course: courseId,
      author: userId,
      rating,
      comment
    });

    await newReview.save();
    res.status(201).json({ message: "Avis ajouté", review: newReview });

  } catch (err) {
    console.error("Erreur review :", err.message);
    res.status(500).json({ message: "Erreur serveur." });
  }
};
