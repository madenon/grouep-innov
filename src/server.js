import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import userRoutes from "./routes/user.route.js";
import postRoutes from "./routes/post.route.js";
import notificationRoutes from "./routes/notification.route.js";
import connectionRoutes from "./routes/connection.route.js";
import countryRoutes from "./routes/country.route.js";
import documentationRoute from "./routes/documentation.route.js";
import legalTextRoutes from "./routes/legal.text.route.js";
import sharedRoutes from "./routes/shared.route.js";
import filterRoutes from "./routes/filter.route.js";
import authRoutes from "./routes/auth.route.js";
import panneauRoute from "./routes/panneau.route.js";
import messagerieRoute from "./routes/msm.route.js";
import rendezVousRoute from "./routes/rendezvous.route.js";
import courseRoute from "./routes/courses.route.js";
import MissionPanneauRoute from "./routes/panneau.mission.route.js";
import notreMissionRoute from "./routes/notremission.route.js";
import fs from "fs";
import { connectDB } from "./lib/db.js";
import cookieParser from "cookie-parser";
import path from "path";
import { fileURLToPath } from 'url';
import { protectRoutes } from "./middelware/protectRoute.js";
dotenv.config();

const PORT = process.env.PORT || 5000;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);



const uploadDirs = [
  'uploads/pdf',
  'uploads/images',
  'uploads/videos',
];



const app = express();

app.use(cors({ origin: process.env.CLIENT_URL,
   credentials: true }));
   app.use(express.json({ limit: "100mb" }));
   app.use(express.urlencoded({ limit: "100mb", extended: true }));  // Limite de 100MB pour l'upload de fichiers via des formulaires

app.use(cookieParser());


app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/posts", postRoutes);
app.use("/api/v1/notifications", notificationRoutes);
app.use("/api/v1/connections", connectionRoutes);
app.use("/api/v1/country", countryRoutes);
app.use("/api/v1/documentations", documentationRoute);
app.use("/api/v1/legalText", legalTextRoutes);
app.use("/api/v1/shared", sharedRoutes);
app.use("/api/v1/filter", filterRoutes);
app.use("/api/v1/panneau", panneauRoute);
app.use("/api/v1/messagerie", messagerieRoute);
app.use("/api/v1/rendezvous", rendezVousRoute);
app.use("/api/v1/courses", courseRoute);
app.use("/api/v1/missionpanneau", MissionPanneauRoute);
app.use("/api/v1/notremission", notreMissionRoute);



app.get("/health", async (req, res) => {
  res.send({ message: "health ok !" });
});


app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: "Erreur serveur" });
});
// Création des dossiers upload s’ils n’existent pas
uploadDirs.forEach(dir => {
  const fullPath = path.join(__dirname, dir);
  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true });
    console.log(` Created directory: ${fullPath}`);
  } else {
    console.log(` Directory exists: ${fullPath}`);
  }
});

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server démarré sur le port ${PORT}`);
  });
}).catch((err) => {
  console.error('Erreur lors de la connexion à la base de données', err);
  process.exit(1);  // Arrêter le serveur si la connexion échoue
});


