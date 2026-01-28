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

const BASE_URL = "/api";

if (!authData || !user || !token || user.role !== "admin") {
  alert("Unauthorized access");
  window.location.href = "index.html";
}
adminName.textContent = user.name || user.email;

logoutBtn.addEventListener("click", () => {
  localStorage.removeItem("user");
  window.location.href = "index.html";
});

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

// modal
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
      const imageUrl = book.image || "https://via.placeholder.com/60x80?text=No+Image";
      const row = document.createElement("tr");
      row.innerHTML = `
        <td><img src="${imageUrl}" width="60" height="80"></td>
        <td>${book.title}</td>
        <td>${book.author}</td>
        <td>${book.category || "-"}</td>
        <td>${book.isbn || "-"}</td>
        <td>${book.quantity ?? 0}</td>
        <td>
          <span class="issued-badge" data-book-id="${book._id}" style="cursor:pointer; font-weight:bold;">
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
    bookTableBody.innerHTML = `<tr><td colspan="8" style="color:red">${err.message}</td></tr>`;
  }
}

// add/update
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
    alert(err.message);
  }
});

// actions
bookTableBody.addEventListener("click", async (e) => {
  const btn = e.target.closest("button, .issued-badge");
  if (!btn) return;

  if (btn.classList.contains("editBtn")) {
    const book = await authFetch(`${BASE_URL}/books/${btn.dataset.id}`);
    bookIdInput.value = book._id;
    titleInput.value = book.title;
    authorInput.value = book.author;
    isbnInput.value = book.isbn || "";
    categoryInput.value = book.category || "";
    quantityInput.value = book.quantity;
    formTitle.textContent = "Update Book";
  }

  if (btn.classList.contains("deleteBtn")) {
    if (confirm("Delete this book?")) {
      await authFetch(`${BASE_URL}/books/${btn.dataset.id}`, { method: "DELETE" });
      loadBooks();
    }
  }

  if (btn.classList.contains("issued-badge")) {
    modal.style.display = "block";
    modalTableBody.innerHTML = `<tr><td colspan="5">Loading...</td></tr>`;
    const users = await authFetch(`${BASE_URL}/issued/book/${btn.dataset.bookId}`);
    modalTableBody.innerHTML = users.length
      ? users.map(u => `
          <tr>
            <td>${u.userId?.name || "-"}</td>
            <td>${u.userId?.email || "-"}</td>
            <td>${new Date(u.issuedAt).toLocaleDateString()}</td>
            <td>${new Date(u.dueAt).toLocaleDateString()}</td>
            <td>${u.returned ? "Returned" : "Active"}</td>
          </tr>
        `).join("")
      : `<tr><td colspan="5">No issued users</td></tr>`;
  }
});

loadBooks();
