const authData = JSON.parse(localStorage.getItem("user") || "{}");
const user = authData?.user;
const token = authData?.token;

const logoutBtn = document.getElementById("logoutBtn");
const headerUserName = document.getElementById("headerUserName");
const dashboardUserName = document.getElementById("dashboardUserName");

const booksList = document.getElementById("booksList");
const issuedBooksList = document.getElementById("issuedBooksList");

const totalBooksEl = document.getElementById("totalBooks");
const issuedBooksEl = document.getElementById("issuedBooks");
const availableBooksEl = document.getElementById("availableBooks");

const searchInput = document.getElementById("searchBookInput");

const BASE_URL = "http://127.0.0.1:5000";

if (!authData || !token || !user || !user._id || user.role !== "member") {
  alert("Unauthorized access");
  window.location.href = "index.html";
} else {
  headerUserName.textContent = user.name || user.email;
  dashboardUserName.textContent = user.name || user.email;
}

logoutBtn?.addEventListener("click", () => {
  localStorage.removeItem("user");
  window.location.href = "index.html";
});

async function authFetch(url, options = {}) {
  const headers = { Authorization: `Bearer ${token}`, ...options.headers };
  const res = await fetch(url, { ...options, headers });
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.message || "Request failed");
  }
  return res.json();
}

async function loadBooks() {
  booksList.innerHTML = "";
  issuedBooksList.innerHTML = "";

  try {
    const books = await authFetch(`${BASE_URL}/api/books`);
    const userIssuedBooks = await authFetch(`${BASE_URL}/api/issued/user`);

    const issuedBookMap = new Map();
    userIssuedBooks.forEach(b => {
      if (b.bookId?._id) issuedBookMap.set(b.bookId._id, b.dueAt || null);
    });

    totalBooksEl.textContent = books.length;
    issuedBooksEl.textContent = issuedBookMap.size;

    let availableCount = 0;

    books.forEach(book => {
      if (!book?._id) return;

      const isIssued = issuedBookMap.has(book._id);
      const availableQty = book.availableQuantity ?? 0;
      if (!isIssued && availableQty > 0) availableCount++;

      const card = document.createElement("div");
      card.className = "book-card";

      const imageUrl = book.image
        ? `${BASE_URL}${book.image}`
        : "https://via.placeholder.com/180x180?text=No+Image";

      const dueDate = issuedBookMap.get(book._id);
      card.innerHTML = `
        <img src="${imageUrl}" alt="Book Cover">
        <div class="book-card-content">
          <h3>${book.title}</h3>
          <p><strong>Author:</strong> ${book.author}</p>
          <p><strong>Category:</strong> ${book.category || "-"}</p>
          <p><strong>ISBN:</strong> ${book.isbn || "-"}</p>
          ${
            isIssued
              ? `<p><small>Due: ${dueDate ? new Date(dueDate).toLocaleDateString() : '-'}</small></p>
                 <button class="return-btn" data-id="${book._id}">Return Book</button>`
              : availableQty > 0
                ? `<button class="issue-btn" data-id="${book._id}">Issue Book</button>`
                : `<button disabled>Not Available</button>`
          }
        </div>
      `;

      if (isIssued) issuedBooksList.appendChild(card);
      else booksList.appendChild(card);
    });

    availableBooksEl.textContent = availableCount;

  } catch (err) {
    console.error(err);
    booksList.innerHTML = `<p style="color:red;">${err.message}</p>`;
    issuedBooksList.innerHTML = "";
  }
}

document.addEventListener("click", async (e) => {
  const bookId = e.target.dataset.id;
  if (!bookId) return;

  try {
    if (e.target.classList.contains("issue-btn")) {
      if (!confirm("Do you want to issue this book?")) return;

      const userIssuedBooks = await authFetch(`${BASE_URL}/api/issued/user`);
      if (userIssuedBooks.length >= 2) {
        alert("You can issue a maximum of 2 books at a time.");
        return;
      }

      const result = await authFetch(`${BASE_URL}/api/issued/issue`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookId }),
      });

      alert(result.message);
      loadBooks();
    }

    if (e.target.classList.contains("return-btn")) {
      if (!confirm("Do you want to return this book?")) return;

      const result = await authFetch(`${BASE_URL}/api/issued/return`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookId }),
      });

      alert(result.message);
      loadBooks();
    }
  } catch (err) {
    alert(err.message);
  }
});

loadBooks();
setInterval(loadBooks, 10000);

searchInput?.addEventListener("input", () => {
  const query = searchInput.value.toLowerCase();
  const activeTab = document.querySelector(".tab-content.active");
  if (!activeTab) return;

  activeTab.querySelectorAll(".book-card").forEach(card => {
    const titleEl = card.querySelector("h3");
    const originalText = titleEl.textContent.replace(/<mark>|<\/mark>/gi, "");

    if (originalText.toLowerCase().includes(query) && query !== "") {
      card.style.display = "flex";
      const regex = new RegExp(`(${query})`, "gi");
      titleEl.innerHTML = originalText.replace(regex, `<mark>$1</mark>`);
    } else if (query === "") {
      card.style.display = "flex";
      titleEl.textContent = originalText;
    } else {
      card.style.display = "none";
      titleEl.textContent = originalText;
    }
  });
});
