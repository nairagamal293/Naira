document.addEventListener("DOMContentLoaded", function () {
    document.querySelector("#login-form").addEventListener("submit", async function (event) {
        event.preventDefault();

        const email = document.getElementById("email").value;
        const password = document.getElementById("password").value;
        const errorMessage = document.getElementById("error-message");

        try {
            const response = await fetch("https://localhost:7020/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();
            console.log("API Response:", data); // ✅ Debugging

            if (response.ok && data.token) {
                // ✅ Decode JWT Token (Check payload structure)
                const tokenPayload = JSON.parse(atob(data.token.split(".")[1]));  
                console.log("Token Payload:", tokenPayload); // ✅ Log payload

                const userRole = tokenPayload["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"] || "User"; 

                // Store token & user data in localStorage
                localStorage.setItem("authToken", data.token);
                localStorage.setItem("userData", JSON.stringify({
                    name: tokenPayload["unique_name"] || "User",
                    email: email,
                    role: userRole
                }));

                alert(`Login successful! Role: ${userRole}`);

                // ✅ Redirect based on role
                if (userRole === "Admin") {
                    window.location.href = "Dashboard.html";
                } else {
                    window.location.href = "index.html";
                }
            } else {
                errorMessage.textContent = "Invalid email or password.";
                errorMessage.style.display = "block";
            }
        } catch (error) {
            console.error("Error:", error);
            errorMessage.textContent = "Something went wrong. Try again later.";
            errorMessage.style.display = "block";
        }
    });
});
