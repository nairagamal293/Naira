document.addEventListener("DOMContentLoaded", function () {
    const form = document.getElementById("forgot-password-form");
    const errorMessage = document.getElementById("error-message");
    const successMessage = document.getElementById("success-message");
    const submitButton = document.getElementById("submit-button");
    const buttonText = document.getElementById("button-text");
    const buttonSpinner = document.getElementById("button-spinner");

    form.addEventListener("submit", async function (e) {
        e.preventDefault();
        
        // UI Loading State
        buttonText.style.display = "none";
        buttonSpinner.style.display = "inline-block";
        submitButton.disabled = true;
        errorMessage.style.display = "none";
        successMessage.style.display = "none";

        const email = document.getElementById("email").value.trim();

        try {
            const response = await fetch("https://localhost:7020/api/auth/forgot-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email })
            });

            if (!response.ok) {
                throw new Error("Failed to send reset link.");
            }

            // Success
            successMessage.textContent = "If an account exists, a reset link has been sent to your email.";
            successMessage.style.display = "block";
        } catch (error) {
            errorMessage.textContent = error.message;
            errorMessage.style.display = "block";
        } finally {
            buttonText.style.display = "inline-block";
            buttonSpinner.style.display = "none";
            submitButton.disabled = false;
        }
    });
});