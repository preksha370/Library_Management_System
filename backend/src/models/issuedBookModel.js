import mongoose from "mongoose";

const issuedBookSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    bookId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Book",
      required: true,
      index: true,
    },
    issuedAt: {
      type: Date,
      default: Date.now,
    },
    dueAt: {
      type: Date,
      default: () => {
        const d = new Date();
        d.setDate(d.getDate() + 7); // 7 days from today
        return d;
      },
      required: true,
      index: true,
    },
    returned: {
      type: Boolean,
      default: false,
      index: true,
    },
    returnedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual: is the book overdue?
issuedBookSchema.virtual("isOverdue").get(function () {
  return !this.returned && this.dueAt < new Date();
});

// Compound index to prevent duplicate active issues for same user & book
issuedBookSchema.index({ userId: 1, bookId: 1, returned: 1 }, { unique: true });

export default mongoose.model("IssuedBook", issuedBookSchema);
