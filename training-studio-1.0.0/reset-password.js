document.addEventListener("DOMContentLoaded", function () {
    const form = document.getElementById("reset-password-form");
    const errorMessage = document.getElementById("error-message");
    const successMessage = document.getElementById("success-message");
    const submitButton = document.getElementById("submit-button");
    const buttonText = document.getElementById("button-text");
    const buttonSpinner = document.getElementById("button-spinner");

    // Get token and email from URL
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    const email = urlParams.get('email');

    if (!token || !email) {
        errorMessage.textContent = "Invalid password reset link. Please request a new one.";
        errorMessage.style.display = "block";
        form.style.display = "none";
        return;
    }

    document.getElementById("token").value = token;
    document.getElementById("email").value = email;

    form.addEventListener("submit", async function (e) {
        e.preventDefault();
        
        // UI Loading State
        buttonText.style.display = "none";
        buttonSpinner.style.display = "inline-block";
        submitButton.disabled = true;
        errorMessage.style.display = "none";
        successMessage.style.display = "none";

        const newPassword = document.getElementById("newPassword").value;
        const confirmPassword = document.getElementById("confirmPassword").value;

        if (newPassword !== confirmPassword) {
            errorMessage.textContent = "Passwords don't match.";
            errorMessage.style.display = "block";
            buttonText.style.display = "inline-block";
            buttonSpinner.style.display = "none";
            submitButton.disabled = false;
            return;
        }

        try {
            const response = await fetch("https://localhost:7020/api/auth/reset-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email: email,
                    token: token,
                    newPassword: newPassword
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Failed to reset password.");
            }

            // Success
            successMessage.textContent = "Your password has been reset successfully! Redirecting to login...";
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
            submitButton.disabled = false;
        }
    });
});