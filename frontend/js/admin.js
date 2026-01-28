const authData = JSON.parse(localStorage.getItem("user"));
const user = authData?.user;
const token = authData?.token;

const adminName = document.getElementById("adminName");
const logoutBtn = document.getElementById("logoutBtn");

const bookForm = document.getElementById("bookForm");
const bookIdInput = document.getElementById("bookId");
const titleInput = document.getElementById("title");
const authorInput = document.getElementById("author");
const isbnInput = document.getElementById("isbn");
const categoryInput = document.getElementById("category");
const quantityInput = document.getElementById("quantity");
const imageInput = document.getElementById("image");
const bookTableBody = document.getElementById("bookTableBody");
const formTitle = document.getElementById("formTitle");

// use relative API URL
const BASE_URL = "/api";

// check authorization
if (!authData || !user || !token || user.role !== "admin") {
  alert("Unauthorized access");
  window.location.href = "index.html";
}
adminName.textContent = user.name || user.email;

// logout
logoutBtn.addEventListener("click", () => {
  localStorage.removeItem("user");
  window.location.href = "index.html";
});

// auth fetch helper
async function authFetch(url, options = {}) {
  const headers = { Authorization: `Bearer ${token}` };
  if (!(options.body instanceof FormData)) headers["Content-Type"] = "application/json";
  const res = await fetch(url, { ...options, headers });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || "Request failed");
  }
  return res.json();
}

// modal for issued users
const modal = document.createElement("div");
modal.classList.add("modal");
modal.innerHTML = `
  <div class="modal-content">
    <span class="close">&times;</span>
    <h3>Issued Users</h3>
    <table>
      <thead>
        <tr>
          <th>User</th>
          <th>Email</th>
          <th>Issued At</th>
          <th>Due At</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody></tbody>
    </table>
  </div>
`;
document.body.appendChild(modal);
const modalClose = modal.querySelector(".close");
const modalTableBody = modal.querySelector("tbody");
modalClose.addEventListener("click", () => modal.style.display = "none");
window.addEventListener("click", (e) => { if (e.target === modal) modal.style.display = "none"; });

// load books
async function loadBooks() {
  bookTableBody.innerHTML = "";
  try {
    const books = await authFetch(`${BASE_URL}/books`);
    if (!books.length) {
      bookTableBody.innerHTML = `<tr><td colspan="8">No books found</td></tr>`;
      return;
    }
    books.forEach(book => {
      const imageUrl = book.image ? `${BASE_URL}${book.image}` : "https://via.placeholder.com/60x80?text=No+Image";
      const row = document.createElement("tr");
      row.innerHTML = `
        <td><img src="${imageUrl}" width="60" height="80"></td>
        <td>${book.title}</td>
        <td>${book.author}</td>
        <td>${book.category || "-"}</td>
        <td>${book.isbn || "-"}</td>
        <td>${book.quantity ?? 0}</td>
        <td>
          <span class="issued-badge" data-book-id="${book._id}" style="cursor:pointer; color:#1e3a8a; font-weight:bold;">
            ${book.issuedCount ?? 0}
          </span>
        </td>
        <td>
          <button class="editBtn" data-id="${book._id}">Edit</button>
          <button class="deleteBtn" data-id="${book._id}">Delete</button>
        </td>
      `;
      bookTableBody.appendChild(row);
    });
  } catch (err) {
    bookTableBody.innerHTML = `<tr><td colspan="8" style="color:red">Failed to load books: ${err.message}</td></tr>`;
  }
}

// add/update book
bookForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  try {
    const formData = new FormData();
    formData.append("title", titleInput.value);
    formData.append("author", authorInput.value);
    formData.append("isbn", isbnInput.value);
    formData.append("category", categoryInput.value);
    formData.append("quantity", quantityInput.value);
    if (imageInput.files[0]) formData.append("image", imageInput.files[0]);
    const id = bookIdInput.value;
    const url = id ? `${BASE_URL}/books/${id}` : `${BASE_URL}/books`;
    const method = id ? "PUT" : "POST";
    await authFetch(url, { method, body: formData });
    bookForm.reset();
    bookIdInput.value = "";
    formTitle.textContent = "Add New Book";
    loadBooks();
  } catch (err) {
    alert("Failed to save book: " + err.message);
  }
});

// edit/delete books & issued users
bookTableBody.addEventListener("click", async (e) => {
  const btn = e.target.closest("button, .issued-badge");
  if (!btn) return;
  const id = btn.dataset.id;
  if (btn.classList.contains("editBtn")) {
    try {
      const book = await authFetch(`${BASE_URL}/books/${id}`);
      bookIdInput.value = book._id;
      titleInput.value = book.title;
      authorInput.value = book.author;
      isbnInput.value = book.isbn || "";
      categoryInput.value = book.category || "";
      quantityInput.value = book.quantity;
      formTitle.textContent = "Update Book";
    } catch (err) { alert("Failed to load book: " + err.message); }
  }
  if (btn.classList.contains("deleteBtn")) {
    if (confirm("Delete this book?")) {
      try {
        await authFetch(`${BASE_URL}/books/${id}`, { method: "DELETE" });
        loadBooks();
      } catch (err) { alert("Failed to delete book: " + err.message); }
    }
  }
  if (btn.classList.contains("issued-badge")) {
    const bookId = btn.dataset.bookId;
    modalTableBody.innerHTML = `<tr><td colspan="5">Loading...</td></tr>`;
    modal.style.display = "block";
    try {
      const issuedUsers = await authFetch(`${BASE_URL}/issued/book/${bookId}`);
      if (!issuedUsers.length) {
        modalTableBody.innerHTML = `<tr><td colspan="5">No users have issued this book</td></tr>`;
        return;
      }
      modalTableBody.innerHTML = "";
      issuedUsers.forEach(ib => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td>${ib.userId?.name || ib.userId?.email || "-"}</td>
          <td>${ib.userId?.email || "-"}</td>
          <td>${new Date(ib.issuedAt).toLocaleDateString()}</td>
          <td>${new Date(ib.dueAt).toLocaleDateString()}</td>
          <td>${ib.returned ? "Returned" : "Active"}</td>
        `;
        modalTableBody.appendChild(tr);
      });
    } catch (err) {
      modalTableBody.innerHTML = `<tr><td colspan="5" style="color:red">${err.message}</td></tr>`;
    }
  }
});

// initial load
loadBooks();
