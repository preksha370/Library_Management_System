import express from "express";
import {
  issueBook,
  returnBook,
  getIssuedReturnCounts,
  getAllIssuedBooks,
  getUserIssuedBooks,
  getIssuedUsersByBook,
} from "../controllers/issuedBookController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// ---------------- MEMBER ROUTES ----------------

// Issue a book (member)
router.post("/issue", protect, issueBook);

// Return a book (member)
router.post("/return", protect, returnBook);

// Get issued books for the logged-in member
router.get("/user", protect, getUserIssuedBooks);

// ---------------- ADMIN ROUTES ----------------

// Get issued/returned counts (Admin only — validated inside controller)
router.get("/counts", protect, getIssuedReturnCounts);

// Get all issued books with user & book info (Admin only)
router.get("/", protect, getAllIssuedBooks);

// Get all users who issued a specific book (Admin only)
router.get("/book/:bookId", protect, getIssuedUsersByBook);

// Get issued books of a specific user (Admin only)
router.get("/user/:userId", protect, getUserIssuedBooks);

export default router;
