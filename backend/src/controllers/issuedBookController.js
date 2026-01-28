import asyncHandler from "express-async-handler";
import IssuedBook from "../models/issuedBookModel.js";
import Book from "../models/bookModel.js";
import mongoose from "mongoose";

// -------------------- ISSUE BOOK (MEMBER) --------------------
export const issueBook = asyncHandler(async (req, res) => {
  const { bookId } = req.body;

  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  if (!bookId || !mongoose.Types.ObjectId.isValid(bookId)) {
    return res.status(400).json({ message: "Valid book ID is required" });
  }

  // Check if the book exists
  const book = await Book.findById(bookId);
  if (!book) {
    return res.status(404).json({ message: "Book not found" });
  }

  // ---------------- LIMIT: MAX 2 BOOKS PER MEMBER ----------------
  const activeIssuedBooksCount = await IssuedBook.countDocuments({
    userId: req.user._id,
    returned: false,
  });

  if (activeIssuedBooksCount >= 2) {
    return res.status(400).json({
      message: "You can only issue a maximum of 2 books at a time",
    });
  }

  // Check if the book has available quantity
  const issuedCount = await IssuedBook.countDocuments({
    bookId,
    returned: false,
  });

  if (issuedCount >= (book.quantity ?? 0)) {
    return res.status(400).json({ message: "Book not available" });
  }

  // Issue the book
  const dueAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  const issuedBook = await IssuedBook.create({
    userId: req.user._id,
    bookId,
    issuedAt: new Date(),
    dueAt,
    returned: false,
  });

  res.status(201).json({
    message: "Book issued successfully",
    issuedBook,
  });
});

// -------------------- RETURN BOOK (MEMBER) --------------------
export const returnBook = asyncHandler(async (req, res) => {
  const { bookId } = req.body;

  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  if (!bookId || !mongoose.Types.ObjectId.isValid(bookId)) {
    return res.status(400).json({ message: "Valid book ID is required" });
  }

  // Find active issued book
  const issuedBook = await IssuedBook.findOne({
    userId: req.user._id,
    bookId,
    returned: false,
  });

  if (!issuedBook) {
    return res
      .status(404)
      .json({ message: "No active issued book found for you" });
  }

  issuedBook.returned = true;
  issuedBook.returnedAt = new Date();
  await issuedBook.save();

  res.json({ message: "Book returned successfully" });
});

// -------------------- GET ISSUED BOOKS (MEMBER / ADMIN) --------------------
export const getUserIssuedBooks = asyncHandler(async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const isAdmin = req.user.role?.toLowerCase() === "admin";
  let userId = req.user._id;

  if (
    isAdmin &&
    req.params.userId &&
    mongoose.Types.ObjectId.isValid(req.params.userId)
  ) {
    userId = req.params.userId;
  }

  const issuedBooks = await IssuedBook.find({
    userId,
    returned: false,
  })
    .populate("bookId", "title author category isbn quantity")
    .lean();

  const now = new Date();

  const enriched = issuedBooks.map((ib) => ({
    ...ib,
    isOverdue: !ib.returned && ib.dueAt && new Date(ib.dueAt) < now,
  }));

  res.json(enriched);
});

// -------------------- ISSUED / RETURN COUNTS (ADMIN) --------------------
export const getIssuedReturnCounts = asyncHandler(async (req, res) => {
  const isAdmin = req.user?.role?.toLowerCase() === "admin";

  if (!isAdmin) {
    return res.status(403).json({ message: "Admin access only" });
  }

  const issuedCount = await IssuedBook.countDocuments({ returned: false });
  const returnedCount = await IssuedBook.countDocuments({ returned: true });

  res.json({ issuedCount, returnedCount });
});

// -------------------- ALL ISSUED BOOKS (ADMIN) --------------------
export const getAllIssuedBooks = asyncHandler(async (req, res) => {
  const isAdmin = req.user?.role?.toLowerCase() === "admin";

  if (!isAdmin) {
    return res.status(403).json({ message: "Admin access only" });
  }

  const allIssuedBooks = await IssuedBook.find()
    .populate("userId", "fullname email")
    .populate("bookId", "title author category isbn")
    .lean();

  const now = new Date();

  const enriched = allIssuedBooks.map((ib) => ({
    ...ib,
    isOverdue: !ib.returned && ib.dueAt && new Date(ib.dueAt) < now,
  }));

  res.json(enriched);
});

// -------------------- GET ALL USERS WHO ISSUED A SPECIFIC BOOK (ADMIN) --------------------
export const getIssuedUsersByBook = asyncHandler(async (req, res) => {
  const isAdmin = req.user?.role?.toLowerCase() === "admin";

  if (!isAdmin) {
    return res.status(403).json({ message: "Admin access only" });
  }

  const { bookId } = req.params;

  if (!bookId || !mongoose.Types.ObjectId.isValid(bookId)) {
    return res.status(400).json({ message: "Valid book ID is required" });
  }

  const issuedRecords = await IssuedBook.find({ bookId, returned: false })
    .populate("userId", "name email")
    .populate("bookId", "title")
    .lean();

  const now = new Date();

  const enriched = issuedRecords.map((record) => ({
    ...record,
    isOverdue: !record.returned && record.dueAt && new Date(record.dueAt) < now,
  }));

  res.json(enriched);
});
