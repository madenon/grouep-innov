import express from "express";
import { createCourse, deleteCourse, getAverageRating, getCourseById, getCourses, updateCourse } from "../controllers/courses.controller.js";
import { protectAdminRoutes } from "../middelware/protectRoute.js";
import upload from "../middelware/course.js";


const router = express.Router();

router.post("/create", protectAdminRoutes, upload.fields([
    { name: "image", maxCount: 1 },
    { name: "videocour", maxCount: 1 },
    
  ]), createCourse)
router.get('/', getCourses);
router.get('/courses/:id', getCourseById);
router.put('/courses/:id', updateCourse);
router.get("/courses/:courseId/rating", getAverageRating);
router.delete('/courses/:id', deleteCourse);


export default router