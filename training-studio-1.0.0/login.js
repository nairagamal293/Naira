document.addEventListener("DOMContentLoaded", function () {
    const loginForm = document.getElementById("login-form");
    const errorMessage = document.getElementById("error-message");
    const loginButton = document.getElementById("login-button");
    const loginText = document.getElementById("login-text");
    const loginSpinner = document.getElementById("login-spinner");

    loginForm.addEventListener("submit", async function (event) {
        event.preventDefault();
        
        // Show loading state
        loginText.style.display = "none";
        loginSpinner.style.display = "inline-block";
        loginButton.disabled = true;
        errorMessage.style.display = "none";

        const email = document.getElementById("email").value.trim();
        const password = document.getElementById("password").value;

        try {
            const response = await fetch("https://localhost:7020/api/auth/login", {
                method: "POST",
                headers: { 
                    "Content-Type": "application/json",
                    "Accept": "application/json"
                },
                body: JSON.stringify({ email, password }),
            });

            // First check if response is OK
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || "Login failed. Please try again.");
            }

            // Then parse the JSON
            const data = await response.json();
            
            if (!data.token) {
                throw new Error("Invalid response: Missing token");
            }

            // Store token & user data
            localStorage.setItem("authToken", data.token);
            localStorage.setItem("userData", JSON.stringify(data.user));

            // Redirect based on role
            const redirectUrl = data.user.role === "Admin" ? "Dashboard.html" : "index.html";
            window.location.href = redirectUrl;

        } catch (error) {
            console.error("Login error:", error);
            errorMessage.textContent = error.message || "Something went wrong. Please try again.";
            errorMessage.style.display = "block";
            
            // Reset loading state
            loginText.style.display = "inline-block";
            loginSpinner.style.display = "none";
            loginButton.disabled = false;
        }
    });

    document.getElementById("email").focus();
});