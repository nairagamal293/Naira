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

            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.message || "Login failed. Please try again.");
            }

            if (data.token && data.user) {
                // Decode the JWT token to get additional claims
                const tokenPayload = JSON.parse(atob(data.token.split('.')[1]));
                
                // Store token & user data in localStorage
                localStorage.setItem("authToken", data.token);
                localStorage.setItem("userData", JSON.stringify({
                    id: tokenPayload.nameid || tokenPayload.sub, // User ID from token
                    fullName: data.user.fullName || tokenPayload.name, // From both response and token
                    email: data.user.email,
                    role: data.user.role || tokenPayload.role || "User",
                    phone: tokenPayload.phone || "" // If phone is in token
                }));

                // Redirect based on role
                const redirectUrl = data.user.role === "Admin" ? "Dashboard.html" : "index.html";
                window.location.href = redirectUrl;
            } else {
                throw new Error("Invalid response from server");
            }
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

    // Auto-focus email field on page load
    document.getElementById("email").focus();
});