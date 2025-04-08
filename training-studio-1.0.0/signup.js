document.addEventListener("DOMContentLoaded", function () {
    document.querySelector("form").addEventListener("submit", async function (event) {
        event.preventDefault();

        const name = document.getElementById("name").value;
        const email = document.getElementById("email").value;
        const password = document.getElementById("password").value;

        const userData = { fullName: name, email: email, password: password };

        try {
            const response = await fetch("https://localhost:7020/api/auth/signup", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(userData),
            });

            if (response.ok) {
                alert("Signup successful! Redirecting to login...");
                window.location.href = "login.html"; // Redirect to login page
            } else {
                const errorData = await response.json();
                alert(errorData.message || "Signup failed!");
            }
        } catch (error) {
            console.error("Error:", error);
            alert("Something went wrong. Try again later.");
        }
    });
});
