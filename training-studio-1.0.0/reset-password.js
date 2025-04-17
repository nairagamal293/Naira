document.addEventListener("DOMContentLoaded", function () {
    const form = document.getElementById("reset-password-form");
    const errorMessage = document.getElementById("error-message");
    const successMessage = document.getElementById("success-message");
    const resetButton = document.getElementById("reset-button");
    const buttonText = document.getElementById("button-text");
    const buttonSpinner = document.getElementById("button-spinner");

    // Extract token and email from URL query parameters
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    const email = urlParams.get('email');

    // Set hidden fields
    document.getElementById("token").value = token || "";
    document.getElementById("email").value = email || "";

    form.addEventListener("submit", async function (e) {
        e.preventDefault();

        // Validate token and email
        if (!token || !email) {
            errorMessage.textContent = "Invalid reset link. Please request a new one.";
            errorMessage.style.display = "block";
            return;
        }

        // Validate passwords match
        const newPassword = document.getElementById("new-password").value;
        const confirmPassword = document.getElementById("confirm-password").value;

        if (newPassword !== confirmPassword) {
            errorMessage.textContent = "Passwords do not match.";
            errorMessage.style.display = "block";
            return;
        }

        // UI Loading State
        buttonText.style.display = "none";
        buttonSpinner.style.display = "inline-block";
        resetButton.disabled = true;
        errorMessage.style.display = "none";

        try {
            const response = await fetch("https://localhost:7020/api/auth/reset-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email: email,
                    token: token,
                    newPassword: newPassword
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Password reset failed.");
            }

            // Success
            successMessage.textContent = "Password reset successfully! Redirecting to login...";
            successMessage.style.display = "block";

            // Redirect to login after 3 seconds
            setTimeout(() => {
                window.location.href = "login.html";
            }, 3000);

        } catch (error) {
            errorMessage.textContent = error.message || "An error occurred. Please try again.";
            errorMessage.style.display = "block";
        } finally {
            buttonText.style.display = "inline-block";
            buttonSpinner.style.display = "none";
            resetButton.disabled = false;
        }
    });
});