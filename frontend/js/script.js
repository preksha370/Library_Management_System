// Base API URL
const BASE_URL = "http://127.0.0.1:5000/api";

// Elements
const loginBtn = document.getElementById("loginBtn");
const registerBtn = document.getElementById("registerBtn");
const nameField = document.getElementById("nameField");
const confirmPasswordField = document.getElementById("confirmPasswordField");
const roleField = document.getElementById("roleField");
const submitBtn = document.getElementById("submitBtn");
const formMessage = document.getElementById("formMessage");

let mode = "login";

// Default state
nameField.style.display = "none";
confirmPasswordField.style.display = "none";
roleField.style.display = "none";

// Toggle buttons
loginBtn.addEventListener("click", () => {
    mode = "login";
    nameField.style.display = "none";
    confirmPasswordField.style.display = "none";
    roleField.style.display = "none";
    submitBtn.textContent = "Login";
    loginBtn.classList.add("active");
    registerBtn.classList.remove("active");
    formMessage.textContent = "";
});

registerBtn.addEventListener("click", () => {
    mode = "register";
    nameField.style.display = "block";
    confirmPasswordField.style.display = "block";
    roleField.style.display = "flex";
    submitBtn.textContent = "Register";
    registerBtn.classList.add("active");
    loginBtn.classList.remove("active");
    formMessage.textContent = "";
});

// Form submit
document.getElementById("authForm").addEventListener("submit", async (e) => {
    e.preventDefault();

    const name = document.getElementById("name").value.trim();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;
    const confirmPassword = document.getElementById("confirmPassword").value;
    const role = mode === "register" ? document.querySelector('input[name="role"]:checked')?.value : null;

    formMessage.style.color = "red";
    formMessage.textContent = "";

    // Password validation for register
    if (mode === "register" && password !== confirmPassword) {
        formMessage.textContent = "Passwords do not match";
        return;
    }

    const url = mode === "login"
        ? `${BASE_URL}/auth/login`
        : `${BASE_URL}/auth/register`;

    const bodyData = mode === "login"
        ? { email, password }
        : { name, email, password, role };

    try {
        const res = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(bodyData),
        });

        const data = await res.json();

        if (!res.ok) {
            formMessage.textContent = data.message || "Something went wrong";
            return;
        }

        formMessage.style.color = "green";
        formMessage.textContent = data.message;

        // Save user info and token in localStorage
        localStorage.setItem("user", JSON.stringify({
            token: data.token,
            user: data.user
        }));

        // Reset form fields
        document.getElementById("authForm").reset();

        // Redirect after short delay
        setTimeout(() => {
            if (data.user.role === "admin") {
                window.location.href = "admin-dashboard.html";
            } else {
                window.location.href = "user-dashboard.html";
            }
        }, 800);

    } catch (error) {
        console.error(error);
        formMessage.textContent = "Error connecting to server";
    }
});
