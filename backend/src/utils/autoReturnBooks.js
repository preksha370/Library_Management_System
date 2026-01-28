import IssuedBook from "../models/issuedBookModel.js";

export const autoReturnBooks = async () => {
  await IssuedBook.updateMany(
    {
      returned: false,
      dueAt: { $lt: new Date() },
    },
    {
      $set: {
        returned: true,
        returnedAt: new Date(),
      },
    }
  );
};