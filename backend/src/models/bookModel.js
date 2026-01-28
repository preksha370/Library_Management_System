import mongoose from "mongoose";

const bookSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    author: { type: String, required: true, trim: true },
    isbn: { type: String, trim: true },
    category: { type: String, required: true, trim: true },
    quantity: { type: Number, default: 1 },
    image: { type: String },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual: total issued books (active)
bookSchema.virtual("issuedCount", {
  ref: "IssuedBook",
  localField: "_id",
  foreignField: "bookId",
  count: true,
  match: { returned: false },
});

// Virtual: total returned books
bookSchema.virtual("returnedCount", {
  ref: "IssuedBook",
  localField: "_id",
  foreignField: "bookId",
  count: true,
  match: { returned: true },
});

export default mongoose.model("Book", bookSchema);
