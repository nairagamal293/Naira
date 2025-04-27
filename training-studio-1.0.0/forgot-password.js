form.addEventListener("submit", async function (e) {
    e.preventDefault();

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

        const data = await response.json(); // get ResetLink

        if (!response.ok) {
            throw new Error(data.message || "Failed to send reset link.");
        }

        successMessage.innerHTML = "If an account exists, a reset link has been sent to your email.<br><br><a href='" + data.resetLink + "' target='_blank'>Reset Password Here</a>";
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
