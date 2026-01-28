import Book from "../models/bookModel.js";
import IssuedBook from "../models/issuedBookModel.js";
import asyncHandler from "express-async-handler";

// GET all books (Admin + Member)
export const getBooks = asyncHandler(async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const isAdmin = req.user.role === "admin";
  const now = new Date();

  const books = await Book.find({}).lean();

  const booksWithCounts = await Promise.all(
    books.map(async (book) => {
      const quantity = book.quantity ?? 0;

      const issuedCount = await IssuedBook.countDocuments({
        bookId: book._id,
        returned: false,
      });

      const returnedCount = await IssuedBook.countDocuments({
        bookId: book._id,
        returned: true,
      });

      // Overdue count (Admin only)
      const overdueCount = await IssuedBook.countDocuments({
        bookId: book._id,
        returned: false,
        dueAt: { $lt: now },
      });

      if (isAdmin) {
        return {
          ...book,
          quantity,
          issuedCount,    
          returnedCount,
          overdueCount,    
        };
      }

      // Member view
      return {
        ...book,
        quantity,
        issuedCount,
        availableQuantity: Math.max(quantity - issuedCount, 0),
      };
    })
  );

  res.json(booksWithCounts);
});

// GET single book by ID
export const getBookById = asyncHandler(async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const book = await Book.findById(req.params.id).lean();
  if (!book) return res.status(404).json({ message: "Book not found" });

  const now = new Date();

  const issuedCount = await IssuedBook.countDocuments({
    bookId: book._id,
    returned: false,
  });

  const returnedCount = await IssuedBook.countDocuments({
    bookId: book._id,
    returned: true,
  });

  const overdueCount = await IssuedBook.countDocuments({
    bookId: book._id,
    returned: false,
    dueAt: { $lt: now },
  });

  const isAdmin = req.user.role === "admin";

  if (isAdmin) {
    return res.json({
      ...book,
      issuedCount,
      returnedCount,
      overdueCount, 
    });
  }

  res.json({
    ...book,
    issuedCount,
    availableQuantity: Math.max((book.quantity ?? 0) - issuedCount, 0),
  });
});

// CREATE book (Admin only)
export const createBook = asyncHandler(async (req, res) => {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({ message: "Admin access only" });
  }

  const { title, author, isbn, quantity, category } = req.body;
  if (!title || !author || quantity === undefined || !category) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  const image = req.file ? `/uploads/${req.file.filename}` : undefined;

  const book = new Book({ title, author, isbn, quantity, category, image });
  await book.save();

  res.status(201).json(book);
});

// UPDATE book (Admin only)
export const updateBook = asyncHandler(async (req, res) => {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({ message: "Admin access only" });
  }

  const book = await Book.findById(req.params.id);
  if (!book) return res.status(404).json({ message: "Book not found" });

  const { title, author, isbn, quantity, category } = req.body;

  if (title !== undefined) book.title = title;
  if (author !== undefined) book.author = author;
  if (isbn !== undefined) book.isbn = isbn;
  if (quantity !== undefined) book.quantity = quantity;
  if (category !== undefined) book.category = category;
  if (req.file) book.image = `/uploads/${req.file.filename}`;

  await book.save();
  res.json(book);
});


// DELETE book (Admin only)
export const deleteBook = asyncHandler(async (req, res) => {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({ message: "Admin access only" });
  }

  const book = await Book.findById(req.params.id);
  if (!book) return res.status(404).json({ message: "Book not found" });

  await book.deleteOne();
  res.json({ message: "Book deleted successfully" });
});
