document.addEventListener("DOMContentLoaded", function () {
    checkAuthStatus();
    setupBookingButtons();
    loadMemberships();
    loadTrainers();
    loadClasses();
    loadSchedules();
    loadOnlineSessions();
});

// ✅ Authentication State Management
const auth = {
    isLoggedIn: () => localStorage.getItem("authToken") !== null,
    currentUser: () => JSON.parse(localStorage.getItem("userData")) || null,
    logout: () => {
        localStorage.removeItem("authToken");
        localStorage.removeItem("userData");
        window.location.href = "index.html";
    }
};

// ✅ Check Authentication Status & Update Navbar
function checkAuthStatus() {
    const authLinks = document.querySelector(".auth-links");
    const user = auth.currentUser();

    if (authLinks) {
        if (auth.isLoggedIn()) {
            authLinks.innerHTML = `
                <li class="nav-item dropdown">
                    <a class="nav-link dropdown-toggle" href="#" id="userDropdown" role="button" data-bs-toggle="dropdown" aria-expanded="false">
                        <i class="fas fa-user-circle"></i> <span id="userName">${user?.fullName || 'My Account'}</span>
                    </a>
                    <ul class="dropdown-menu" aria-labelledby="userDropdown">
                        <li><a class="dropdown-item" href="profile.html">Profile</a></li>
                        <li><a class="dropdown-item" href="my-bookings.html">My Bookings</a></li>
                        <li><hr class="dropdown-divider"></li>
                        <li><a class="dropdown-item" href="#" onclick="auth.logout()">Logout</a></li>
                    </ul>
                </li>
            `;

            // ✅ Ensure the dropdown is initialized
            setTimeout(() => {
                const dropdownElement = document.getElementById("userDropdown");
                if (dropdownElement) {
                    new bootstrap.Dropdown(dropdownElement);
                }
            }, 100);
        } else {
            authLinks.innerHTML = `<li class="main-button"><a href="SignUp.html">Sign Up</a></li>`;
        }
    }
}

// ✅ Manage Booking Buttons
function setupBookingButtons() {
    document.querySelectorAll(".booking-btn, .join-btn").forEach(button => {
        if (auth.isLoggedIn()) {
            button.classList.remove("disabled");
            button.onclick = null;
        } else {
            button.classList.add("disabled");
            button.onclick = redirectToSignup;
        }
    });
}

// ✅ Redirect Unauthenticated Users
function redirectToSignup() {
    window.location.href = `SignUp.html?redirect=${encodeURIComponent(window.location.href)}`;
    return false;
}

// ✅ Load Memberships
async function loadMemberships() {
    const membershipContainer = document.querySelector("#membership .row");
    if (!membershipContainer) return;
    
    try {
        const response = await fetch("https://localhost:7020/api/Membership");
        if (!response.ok) throw new Error("Failed to fetch memberships");
        
        const data = await response.json();
        if (!Array.isArray(data)) {
            throw new Error("Invalid data format received from API");
        }
        
        membershipContainer.innerHTML = data.length === 0 ? 
            "<p>No membership plans available.</p>" :
            data.map(membership => `
                <div class="col-lg-3 col-md-6">
                    <div class="membership-card">
                        <h3>${membership.name || 'Membership'}</h3>
                        <p class="price">$${membership.price || '0'} / ${membership.durationInDays || '0'} days</p>
                        <ul><li>✔ ${membership.description || 'No description available'}</li></ul>
                        <a href="booking.html" class="btn-main">Join Now</a>
                    </div>
                </div>`).join("");
    } catch (error) {
        console.error("Error loading memberships:", error);
        membershipContainer.innerHTML = `<p class="text-danger">Error loading memberships. Please try again later.</p>`;
    }
}

// ✅ Load Trainers
async function loadTrainers() {
    const trainersListContainer = document.querySelector("#trainers-list");
    if (!trainersListContainer) return;
    
    try {
        const response = await fetch("https://localhost:7020/api/Trainer");
        if (!response.ok) throw new Error("Failed to load trainers.");
        
        const trainers = await response.json();
        if (!Array.isArray(trainers)) {
            throw new Error("Invalid data format received from API");
        }
        
        trainersListContainer.innerHTML = trainers.map(trainer => `
            <div class="col-lg-4 col-md-6">
                <div class="trainer-item">
                    ${trainer.image ? `<img src="data:image/jpeg;base64,${trainer.image}" alt="${trainer.name}">` : ''}
                    <h4>${trainer.name || 'Trainer'}</h4>
                    <p>${trainer.description || "No description available."}</p>
                </div>
            </div>`).join("");
    } catch (error) {
        console.error("Error loading trainers:", error);
        trainersListContainer.innerHTML = `<p class="text-danger">Error loading trainers. Please try again later.</p>`;
    }
}

// ✅ Load Classes
async function loadClasses() {
    const container = document.getElementById("classes-container");
    if (!container) return;
    
    try {
        const response = await fetch("https://localhost:7020/api/Class");
        if (!response.ok) throw new Error("Failed to load classes.");
        
        const classes = await response.json();
        if (!Array.isArray(classes)) {
            throw new Error("Invalid data format received from API");
        }
        
        container.innerHTML = classes.map(cls => `
            <div class="col-lg-3 col-md-6">
                <div class="class-card">
                    <h4>${cls.name || 'Class'}</h4>
                    <p>${cls.description || 'No description available'}</p>
                    <p><strong>Trainer:</strong> ${cls.trainerName || "Unknown"}</p>
                  <button class="btn btn-primary" onclick="openBookingModal('Class', 1)">Join Class</button>
                </div>
            </div>`).join("");
    } catch (error) {
        console.error("Error loading classes:", error);
        container.innerHTML = `<p class="text-danger">Error loading classes. Please try again later.</p>`;
    }
}

// ✅ Load Schedules
async function loadSchedules() {
    const scheduleTable = document.querySelector(".schedule-table tbody");
    if (!scheduleTable) return;
    
    try {
        const response = await fetch("https://localhost:7020/api/Schedule");
        if (!response.ok) throw new Error("Failed to load schedules.");
        
        const schedules = await response.json();
        if (!Array.isArray(schedules)) {
            throw new Error("Invalid data format received from API");
        }
        
        scheduleTable.innerHTML = schedules.length === 0 ? 
            "<tr><td colspan='3'>No schedules available.</td></tr>" :
            schedules.map(schedule => `
                <tr>
                    <td>${schedule.className || 'Class'}</td>
                    <td>${schedule.startTime || ''} - ${schedule.endTime || ''}</td>
                    <td>${schedule.trainerName || 'Trainer'}</td>
                </tr>`).join("");
    } catch (error) {
        console.error("Error loading schedules:", error);
        scheduleTable.innerHTML = `<tr><td colspan="3" class="text-danger">Error loading schedules. Please try again later.</td></tr>`;
    }
}

// ✅ Load Online Sessions
async function loadOnlineSessions() {
    const sessionsContainer = document.querySelector("#online-sessions .row");
    if (!sessionsContainer) return;
    
    try {
        const response = await fetch("https://localhost:7020/api/OnlineSession");
        if (!response.ok) throw new Error("Failed to load online sessions.");
        
        const sessions = await response.json();
        if (!Array.isArray(sessions)) {
            throw new Error("Invalid data format received from API");
        }
        
        sessionsContainer.innerHTML = sessions.length === 0 ? 
            "<p>No online sessions available.</p>" :
            sessions.map(session => `
                <div class="col-lg-4 col-md-6">
                    <div class="session-card">
                        <h3>${session.title || 'Session'}</h3>
                        <p><strong>Trainer:</strong> ${session.trainerName || 'Unknown'}</p>
                        <p><strong>Date & Time:</strong> ${session.sessionDateTime ? new Date(session.sessionDateTime).toLocaleString() : 'Not specified'}</p>
                        <a href="booking.html" class="btn-main booking-btn">Book Session</a>
                    </div>
                </div>`).join("");
    } catch (error) {
        console.error("Error loading online sessions:", error);
        sessionsContainer.innerHTML = `<p class="text-danger">Error loading online sessions. Please try again later.</p>`;
    }
}


function openBookingModal(type, itemId, price) {
  const userData = JSON.parse(localStorage.getItem("userData"));
  if (!userData) {
    alert("Please sign in to book.");
    return;
  }

  // Fill hidden booking info
  document.getElementById("booking-type").value = type;
  document.getElementById("booking-item-id").value = itemId;
  document.getElementById("booking-amount").value = price;

  // Pre-fill user info
  document.getElementById("name").value = userData.name;
  document.getElementById("email").value = userData.email;
  document.getElementById("phone").value = userData.phone;

  // Open modal
  const modal = new bootstrap.Modal(document.getElementById("bookingModal"));
  modal.show();
}



function openBookingModal(type, id, price) {
    const userData = JSON.parse(localStorage.getItem("userData"));
  
    if (!userData) {
      alert("Please sign in to book.");
      return;
    }
  
    document.getElementById("bookingType").value = type;
    document.getElementById("itemId").value = id;
  
    document.getElementById("name").value = userData.name || "";
    document.getElementById("email").value = userData.email || "";
    document.getElementById("phone").value = userData.phone || "";
  
    const bookingModal = new bootstrap.Modal(document.getElementById("bookingModal"));
    bookingModal.show();
  }
  
  document.getElementById("bookingForm").addEventListener("submit", async function (e) {
    e.preventDefault();
  
    const userData = JSON.parse(localStorage.getItem("userData"));
    const form = e.target;
  
    const bookingType = form.bookingType.value;
    const itemId = form.itemId.value;
  
    const payload = {
      userId: userData.id,
      name: form.name.value,
      email: form.email.value,
      phone: form.phone.value,
      paymentMethod: form.paymentMethod.value,
      notes: form.notes.value,
      amountPaid: 100, // 🔁 Dynamically set based on the item later
      bookingType: bookingType,
    };
  
    if (bookingType === "Membership") payload.membershipId = parseInt(itemId);
    if (bookingType === "Class") payload.classId = parseInt(itemId);
    if (bookingType === "OnlineSession") payload.onlineSessionId = parseInt(itemId);
  
    try {
      const res = await fetch("/api/Booking", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
  
      if (!res.ok) {
        const error = await res.text();
        throw new Error(error);
      }
  
      alert("Booking successful!");
      bootstrap.Modal.getInstance(document.getElementById("bookingModal")).hide();
    } catch (err) {
      alert("Error: " + err.message);
    }
  });
  
// Contact Form Handling
document.addEventListener("DOMContentLoaded", function () {
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
            name: name,
            email: email,
            message: message,
            inquiryDate: new Date().toISOString()
        };

        try {
            const response = await fetch("https://localhost:7020/api/Contact", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(contactData)
            });

            if (!response.ok) {
                throw new Error("Failed to send message.");
            }

            contactForm.reset();
            document.getElementById("contact-success").style.display = "block";
            document.getElementById("contact-error").style.display = "none";

        } catch (error) {
            console.error("Error sending contact form:", error);
            document.getElementById("contact-error").innerText = "Failed to send message. Try again later.";
            document.getElementById("contact-error").style.display = "block";
            document.getElementById("contact-success").style.display = "none";
        }
    });
});