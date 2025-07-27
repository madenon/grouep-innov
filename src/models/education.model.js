import mongoose from "mongoose";

// Constantes pour les valeurs d'énumération
const EXAM_STATUS = ["echec", "succes"];
const EXERCISE_DIFFICULTY = ["facile", "moyen", "difficile"];
const COURSE_MEDIA_TYPE = ["image", "pdf", "video"];

// SCHEMA COUVERTURE (BookCover)
const bookCoverSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    name: { type: String, required: true },
    type: {
      type: String,
      enum: ["document", "fascicule", "livre"],
      required: true,
    },
    imageUrl: { type: String, required: true },
    country: { type: String, required: true },
    city: { type: String, required: true },
  },
  { timestamps: true }
);

const BookCover = mongoose.model("BookCover", bookCoverSchema);

// SCHEMA COURS
const courseSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    content: { type: String, required: true },
    media: [
      {
        url: String,
        type: { type: String, enum: COURSE_MEDIA_TYPE },
      },
    ],
  },
  { timestamps: true }
);
const Course = mongoose.model("Course", courseSchema);

// SCHEMA EXERCICE
const exerciseSchema = new mongoose.Schema(
  {
    question: { type: String, required: true },
    answer: { type: String, required: true },
    difficulty: {
      type: String,
      enum: EXERCISE_DIFFICULTY,
      default: "moyen",
    },
  },
  { timestamps: true }
);
const Exercice = mongoose.model("Exercice", exerciseSchema);

// SCHEMA EXAMEN
const examSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: String,
    status: {
      type: String,
      enum: EXAM_STATUS,
      default: "echec", // Valeur par défaut
      required: true,
    },
    date: { type: Date, default: Date.now },
  },
  { timestamps: true }
);
const Examen = mongoose.model("Examen", examSchema);

// SCHEMA FORMATION
const formationSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: String,
    duration: String,
    price: { type: Number, default: 0 },
  },
  { timestamps: true }
);
const Formation = mongoose.model("Formation", formationSchema);

// CREATION DE LA MATIERE
const matiereSchema = new mongoose.Schema(
  {
    author: { type: String, required: true },
    name: { type: String, required: true },
    description: { type: String, required: false },
    level: { type: String, required: false },
  },
  { timestamps: true }
);
const Matiere = mongoose.model("Matiere", matiereSchema);

// SCHEMA MATIERE PRINCIPALE (Subject)
const subjectSchema = new mongoose.Schema(
  {
    name: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Matiere",
      required: true,
    },
    level: {
      type: String,
      required: true,
    },
    cover: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "BookCover",
      required: true,
    },
    courses: [courseSchema],
    exercises: [exerciseSchema],
    exams: [examSchema],
    formations: [formationSchema],
    certification: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// Middleware pour vérifier l'existence de la matière et de la couverture avant création d'un Subject
subjectSchema.pre("save", async function(next) {
  const matiere = await Matiere.findById(this.name);
  const cover = await BookCover.findById(this.cover);

  if (!matiere) {
    const error = new Error("Matière not found");
    return next(error);
  }

  if (!cover) {
    const error = new Error("Cover not found");
    return next(error);
  }

  next();
});

// Création du modèle Subject
const Subject = mongoose.model("Subject", subjectSchema);

// Exporter les modèles
export { BookCover, Matiere, Subject, Course, Examen, Exercice, Formation };
