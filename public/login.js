
const form = document.getElementById("commonLoginForm");
const roleSelect = document.getElementById("loginRole");
const message = document.getElementById("loginMessage");
const registerLink = document.getElementById("registerLink");

roleSelect.addEventListener("change", () => {
  registerLink.style.display =
    roleSelect.value === "student" ? "block" : "none";

  message.textContent = "";
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  message.textContent = "Signing in...";

  const email = document.getElementById("loginEmail").value.trim();
  const password = document.getElementById("loginPassword").value;
  const role = roleSelect.value;

  try {
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      credentials: "same-origin",
      body: JSON.stringify({ email, password, role })
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
  message.textContent =
    result.message || `Login failed (${response.status}).`;
  return;
}

if (result.role !== "student" && result.role !== "admin") {
  message.textContent = "Login response has an invalid role.";
  return;
}

message.textContent = "Login successful! Opening dashboard...";



    if (result.role === "admin") {
      window.location.href = "admin-dashboard.html";
    } else {
      window.location.href = "student-dashboard.html";
    }
  } catch (error) {
    message.textContent =
      "Unable to connect to the server. Please try again.";
  }
});
