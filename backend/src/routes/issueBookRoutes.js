import express from "express";
import {
  issueBook,
  returnBook,
  getIssuedReturnCounts,
  getAllIssuedBooks,
  getUserIssuedBooks,
  getIssuedUsersByBook,
  getIssuedBooksByUserId, 
} from "../controllers/issuedBookController.js";
import { protect, adminOnly } from "../middleware/authMiddleware.js";

const router = express.Router();

// ---------------- MEMBER ROUTES ----------------
router.post("/issue", protect, issueBook);
router.post("/return", protect, returnBook);
router.get("/user", protect, getUserIssuedBooks);

// ---------------- ADMIN ROUTES ----------------
router.get("/counts", protect, adminOnly, getIssuedReturnCounts);
router.get("/", protect, adminOnly, getAllIssuedBooks);
router.get("/book/:bookId", protect, adminOnly, getIssuedUsersByBook);
router.get("/user/:userId", protect, adminOnly, getIssuedBooksByUserId); 

export default router;
