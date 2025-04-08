document.addEventListener("DOMContentLoaded", function () {
    checkAuthStatus();
    setupBookingButtons();
    loadMemberships();
    loadTrainers();
    loadClasses();
    loadSchedules();
    loadOnlineSessions();
    setupContactForm();

    // Booking form submit setup
    const bookingForm = document.getElementById("bookingForm");
    if (bookingForm) {
        bookingForm.addEventListener("submit", async function (e) {
            e.preventDefault();
            const user = auth.currentUser();
            const booking = {
                userId: user.id,
                fullName: user.fullName || user.username || "User",
                email: user.email,
                type: document.getElementById("bookingType").value,
                itemId: document.getElementById("bookingItemId").value,
                price: document.getElementById("bookingPrice").value,
                cardNumber: document.getElementById("cardNumber").value,
                cardName: document.getElementById("cardName").value,
                expiry: document.getElementById("expiryDate").value,
                cvv: document.getElementById("cvv").value,
            };

            try {
                const response = await fetch("https://localhost:7020/api/Booking", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(booking)
                });

                if (!response.ok) throw new Error("Booking failed.");

                alert("Booking and payment successful!");
                bootstrap.Modal.getInstance(document.getElementById("bookingModal")).hide();
            } catch (err) {
                alert("Booking failed. Try again.");
                console.error("Booking error:", err);
            }
        });
    }
});

// ✅ Auth system
const auth = {
    isLoggedIn: () => localStorage.getItem("authToken") !== null,
    currentUser: () => {
        const user = JSON.parse(localStorage.getItem("userData")) || null;
        if (user) {
            // Make sure we use the correct property name (FulName from your DB)
            user.fullName = user.FulName || user.fullName || user.username;
        }
        return user;
    },
    logout: () => {
        localStorage.removeItem("authToken");
        localStorage.removeItem("userData");
        window.location.href = "index.html";
    }
};

function checkAuthStatus() {
    const authLinks = document.querySelector(".auth-links");
    const user = auth.currentUser();

    if (authLinks) {
        if (auth.isLoggedIn()) {
            authLinks.innerHTML = `
                <li class="nav-item dropdown">
                    <a class="nav-link dropdown-toggle" href="#" id="userDropdown" role="button" data-bs-toggle="dropdown" aria-expanded="false">
                        <i class="fas fa-user-circle"></i> <span id="userName">${user?.fullName || user?.username || 'My Account'}</span>
                    </a>
                    <ul class="dropdown-menu">
                        <li><a class="dropdown-item" href="profile.html">Profile</a></li>
                        <li><a class="dropdown-item" href="my-bookings.html">My Bookings</a></li>
                        <li><hr class="dropdown-divider"></li>
                        <li><a class="dropdown-item" href="#" onclick="auth.logout()">Logout</a></li>
                    </ul>
                </li>`;
            setTimeout(() => {
                const dropdown = document.getElementById("userDropdown");
                if (dropdown) new bootstrap.Dropdown(dropdown);
            }, 100);
        } else {
            authLinks.innerHTML = `<li class="main-button"><a href="SignUp.html">Sign Up</a></li>`;
        }
    }
}

function setupBookingButtons() {
    document.querySelectorAll(".booking-btn, .join-btn").forEach(button => {
        button.removeEventListener("click", handleBookingClick);
        if (auth.isLoggedIn()) {
            button.classList.remove("disabled");
            button.addEventListener("click", handleBookingClick);
        } else {
            button.classList.add("disabled");
            button.addEventListener("click", redirectToSignup);
        }
    });
}

function redirectToSignup() {
    window.location.href = `SignUp.html?redirect=${encodeURIComponent(window.location.href)}`;
}

function handleBookingClick(e) {
    e.preventDefault();
    const button = e.currentTarget;
    const user = auth.currentUser();
    if (!user) return;

    const type = button.dataset.type;
    const card = button.closest(".class-card, .membership-card, .session-card");
    const itemName = card?.querySelector("h3,h4")?.innerText || "Item";
    const priceText = card?.querySelector(".price")?.innerText || "";
    const price = parseFloat(priceText.replace(/[^\d.]/g, '')) || 0;

    // Fill booking modal - use user.fullName which we set in currentUser()
    document.getElementById("bookingFullName").value = user.fullName || "User";
    document.getElementById("bookingEmail").value = user.email;
    document.getElementById("bookingType").value = type;
    document.getElementById("bookingItem").value = itemName;
    document.getElementById("bookingPrice").value = price;
    document.getElementById("bookingItemId").value = card?.dataset.id || "";

    new bootstrap.Modal(document.getElementById("bookingModal")).show();
}

// ✅ Content Loaders
async function loadMemberships() {
    const container = document.querySelector("#membership .row");
    try {
        const res = await fetch("https://localhost:7020/api/Membership");
        const data = await res.json();
        container.innerHTML = data.length === 0 ? "<p>No memberships available.</p>" :
            data.map(m => `
                <div class="col-lg-4 col-md-6">
                    <div class="membership-card" data-id="${m.id}">
                        <h3>${m.name}</h3>
                        <p class="price">$${m.price} / ${m.durationInDays} days</p>
                        <ul><li>✔ ${m.description}</li></ul>
                        <button class="btn-main booking-btn" data-type="membership">Join Now</button>
                    </div>
                </div>`).join("");
        setupBookingButtons();
    } catch (err) {
        console.error("Error loading memberships:", err);
    }
}

async function loadTrainers() {
    const container = document.querySelector("#trainers-list");
    try {
        const res = await fetch("https://localhost:7020/api/Trainer");
        const data = await res.json();
        container.innerHTML = data.map(t => `
            <div class="col-lg-4 col-md-6">
                <div class="trainer-item">
                    <img src="data:image/jpeg;base64,${t.image}" alt="${t.name}">
                    <h4>${t.name}</h4>
                    <p>${t.description || "No description available."}</p>
                </div>
            </div>`).join("");
    } catch (err) {
        console.error("Error loading trainers:", err);
    }
}

async function loadClasses() {
    const container = document.getElementById("classes-container");
    try {
        const res = await fetch("https://localhost:7020/api/Class");
        const data = await res.json();
        container.innerHTML = data.map(c => `
            <div class="col-lg-3 col-md-6">
                <div class="class-card" data-id="${c.id}">
                    <h4>${c.name}</h4>
                    <p>${c.description}</p>
                    <p><strong>Trainer:</strong> ${c.trainerName || "Unknown"}</p>
                    <button class="btn-main booking-btn" data-type="class">Join Class</button>
                </div>
            </div>`).join("");
        setupBookingButtons();
    } catch (err) {
        console.error("Error loading classes:", err);
    }
}

async function loadSchedules() {
    try {
        const res = await fetch("https://localhost:7020/api/Schedule");
        const data = await res.json();
        const table = document.querySelector(".schedule-table tbody");
        table.innerHTML = data.length === 0 ? "<tr><td colspan='3'>No schedules available.</td></tr>" :
            data.map(s => `
                <tr>
                    <td>${s.className}</td>
                    <td>${s.startTime} - ${s.endTime}</td>
                    <td>${s.trainerName}</td>
                </tr>`).join("");
    } catch (err) {
        console.error("Error loading schedules:", err);
    }
}

async function loadOnlineSessions() {
    const container = document.querySelector("#online-sessions .row");
    try {
        const res = await fetch("https://localhost:7020/api/OnlineSession");
        const data = await res.json();
        container.innerHTML = data.map(session => `
            <div class="col-lg-4 col-md-6">
                <div class="session-card" data-id="${session.id}">
                    <h3>${session.title}</h3>
                    <p><strong>Trainer:</strong> ${session.trainerName}</p>
                    <p><strong>Date & Time:</strong> ${new Date(session.sessionDateTime).toLocaleString()}</p>
                    <button class="btn-main booking-btn" data-type="online">Book Session</button>
                </div>
            </div>`).join("");
        setupBookingButtons();
    } catch (err) {
        console.error("Error loading sessions:", err);
    }
}

// ✅ Contact Form
function setupContactForm() {
    const contactForm = document.getElementById("contact-form");
    if (!contactForm) return;

    contactForm.addEventListener("submit", async function (event) {
        event.preventDefault();
        const name = document.getElementById("contact-name").value.trim();
        const email = document.getElementById("contact-email").value.trim();
        const message = document.getElementById("contact-message").value.trim();

        if (!name || !email || !message) {
            document.getElementById("contact-error").innerText = "All fields are required!";
            document.getElementById("contact-error").style.display = "block";
            return;
        }

        const contactData = {
            name, email, message,
            inquiryDate: new Date().toISOString()
        };

        try {
            const response = await fetch("https://localhost:7020/api/Contact", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(contactData)
            });

            if (!response.ok) throw new Error("Failed to send message.");

            contactForm.reset();
            document.getElementById("contact-success").style.display = "block";
            document.getElementById("contact-error").style.display = "none";

        } catch (err) {
            document.getElementById("contact-error").innerText = "Failed to send message. Try again later.";
            document.getElementById("contact-error").style.display = "block";
        }
    });
}
