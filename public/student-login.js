
const form = document.getElementById("studentLoginForm");
const message = document.getElementById("studentLoginMessage");

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const email = document.getElementById("studentEmail").value.trim();
  const password = document.getElementById("studentPassword").value;
  const button = form.querySelector('button[type="submit"]');

  message.textContent = "Signing in...";
  button.disabled = true;

  try {
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      credentials: "same-origin",
      body: JSON.stringify({
        email,
        password,
        role: "student"
      })
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      message.textContent =
        result.message || `Login failed (${response.status}).`;
      return;
    }

    if (result.role !== "student") {
      message.textContent = "This is not a student account.";
      return;
    }

    message.textContent = "Login successful! Opening dashboard...";
    window.location.href = "student-dashboard.html";
  } catch (error) {
    console.error("Student login error:", error);
    message.textContent =
      "Unable to connect to the server. Please try again.";
  } finally {
    button.disabled = false;
  }
});
