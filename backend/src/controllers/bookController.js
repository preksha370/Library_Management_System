import Book from "../models/bookModel.js";
import IssuedBook from "../models/issuedBookModel.js";
import asyncHandler from "express-async-handler";
import cloudinary from "../config/cloudinary.js";

// helper
const uploadToCloudinary = (fileBuffer) =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: "library_books" },
      (error, result) => {
        if (error) reject(error);
        else resolve(result.secure_url);
      }
    );
    stream.end(fileBuffer);
  });

// GET all books
export const getBooks = asyncHandler(async (req, res) => {
  if (!req.user) return res.status(401).json({ message: "Unauthorized" });

  const isAdmin = req.user.role === "admin";
  const now = new Date();

  const books = await Book.find({}).lean();

  const data = await Promise.all(
    books.map(async (book) => {
      const issuedCount = await IssuedBook.countDocuments({ bookId: book._id, returned: false });
      const returnedCount = await IssuedBook.countDocuments({ bookId: book._id, returned: true });
      const overdueCount = await IssuedBook.countDocuments({
        bookId: book._id,
        returned: false,
        dueAt: { $lt: now },
      });

      if (isAdmin) return { ...book, issuedCount, returnedCount, overdueCount };

      return {
        ...book,
        availableQuantity: Math.max((book.quantity ?? 0) - issuedCount, 0),
      };
    })
  );

  res.json(data);
});

// GET book by ID
export const getBookById = asyncHandler(async (req, res) => {
  if (!req.user) return res.status(401).json({ message: "Unauthorized" });

  const book = await Book.findById(req.params.id).lean();
  if (!book) return res.status(404).json({ message: "Book not found" });

  if (req.user.role === "admin") return res.json(book);

  const issuedCount = await IssuedBook.countDocuments({ bookId: book._id, returned: false });

  res.json({
    ...book,
    availableQuantity: Math.max((book.quantity ?? 0) - issuedCount, 0),
  });
});

// CREATE book
export const createBook = asyncHandler(async (req, res) => {
  if (req.user.role !== "admin") return res.status(403).json({ message: "Admin only" });

  const { title, author, isbn, quantity, category } = req.body;
  if (!title || !author || quantity === undefined || !category)
    return res.status(400).json({ message: "Missing fields" });

  let image = "";
  if (req.file) image = await uploadToCloudinary(req.file.buffer);

  const book = await Book.create({
    title: title.trim(),
    author: author.trim(),
    isbn: isbn?.trim(),
    quantity,
    category: category.trim(),
    image,
  });

  res.status(201).json(book);
});

// UPDATE book
export const updateBook = asyncHandler(async (req, res) => {
  if (req.user.role !== "admin") return res.status(403).json({ message: "Admin only" });

  const book = await Book.findById(req.params.id);
  if (!book) return res.status(404).json({ message: "Book not found" });

  const { title, author, isbn, quantity, category } = req.body;

  if (title) book.title = title.trim();
  if (author) book.author = author.trim();
  if (isbn) book.isbn = isbn.trim();
  if (quantity !== undefined) book.quantity = quantity;
  if (category) book.category = category.trim();

  if (req.file) book.image = await uploadToCloudinary(req.file.buffer);

  await book.save();
  res.json(book);
});

// DELETE book
export const deleteBook = asyncHandler(async (req, res) => {
  if (req.user.role !== "admin") return res.status(403).json({ message: "Admin only" });

  const book = await Book.findById(req.params.id);
  if (!book) return res.status(404).json({ message: "Book not found" });

  await book.deleteOne();
  res.json({ message: "Book deleted" });
});
