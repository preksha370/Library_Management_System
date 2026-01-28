import cron from "node-cron";
import { autoReturnBooks } from "../utils/autoReturnBooks.js";

// Run every day at midnight
cron.schedule("0 0 * * *", async () => {
  console.log("Running auto-return job for overdue books...");
  try {
    await autoReturnBooks();
    console.log("Auto-return completed successfully.");
  } catch (error) {
    console.error("Auto-return failed:", error);
  }
});
