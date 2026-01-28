import express from "express";
import {
  getBooks,
  getBookById,
  createBook,
  updateBook,
  deleteBook,
} from "../controllers/bookController.js";
import { protect } from "../middleware/authMiddleware.js";
import upload from "../middleware/uploadMiddleware.js";

const router = express.Router();

router.get("/", protect, getBooks);
router.get("/:id", protect, getBookById);
router.post("/", protect, upload.single("image"), createBook);
router.put("/:id", protect, upload.single("image"), updateBook);
router.delete("/:id", protect, deleteBook);

export default router;
