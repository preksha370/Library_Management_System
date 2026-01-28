import express from "express";
import {
  getBooks,
  getBookById,
  createBook,
  updateBook,
  deleteBook,
} from "../controllers/bookController.js";
import { protect, adminOnly } from "../middleware/authMiddleware.js";
import upload from "../middleware/uploadMiddleware.js";

const router = express.Router();

// MEMBER ROUTES
router.get("/", protect, getBooks);
router.get("/:id", protect, getBookById);

// ADMIN ROUTES
router.post("/", protect, adminOnly, upload.single("image"), createBook);
router.put("/:id", protect, adminOnly, upload.single("image"), updateBook);
router.delete("/:id", protect, adminOnly, deleteBook);

export default router;
