document.addEventListener("DOMContentLoaded", function () {
    // Initialize all functionality
    checkAuthStatus();
    setupBookingButtons(); // This will now handle all booking buttons
    loadMemberships();
    loadTrainers();
    loadClasses();
    loadSchedules();
    loadOnlineSessions();
    setupBookingForm();
    
    // Add click handler for any dynamically added booking buttons
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('booking-btn') || 
            e.target.classList.contains('join-btn') || 
            e.target.closest('.booking-btn') || 
            e.target.closest('.join-btn')) {
            e.preventDefault();
            if (auth.isLoggedIn()) {
                openBookingModal();
            } else {
                redirectToSignup();
            }
        }
    });
});

// ✅ Authentication State Management
const auth = {
    isLoggedIn: () => localStorage.getItem("authToken") !== null,
    currentUser: () => {
        try {
            return JSON.parse(localStorage.getItem("userData")) || null;
        } catch (e) {
            console.error("Error parsing user data:", e);
            return null;
        }
    },
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
                        <i class="fas fa-user-circle"></i> <span id="userName">${user?.fullName || user?.username || user?.name || 'My Account'}</span>
                    </a>
                    <ul class="dropdown-menu" aria-labelledby="userDropdown">
                        <li><a class="dropdown-item" href="profile.html">Profile</a></li>
                        <li><a class="dropdown-item" href="Userdashboard.html">My Bookings</a></li>
                        <li><hr class="dropdown-divider"></li>
                        <li><a class="dropdown-item" href="#" onclick="auth.logout()">Logout</a></li>
                    </ul>
                </li>
            `;

            // Initialize dropdown
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
    // Select all buttons that should trigger the booking modal
    const bookingButtons = document.querySelectorAll(".booking-btn, .join-btn, [class*='book-now'], [class*='join-now']");
    
    bookingButtons.forEach(button => {
        // Update button behavior based on auth status
        if (auth.isLoggedIn()) {
            button.classList.remove("disabled");
            button.onclick = (e) => {
                e.preventDefault();
                openBookingModal();
            };
        } else {
            button.classList.add("disabled");
            button.onclick = (e) => {
                e.preventDefault();
                redirectToSignup();
            };
        }
    });
}
function openBookingModal() {
    const bookingModal = new bootstrap.Modal(document.getElementById('bookingModal'));
    const bookingForm = document.getElementById("bookingForm");
    const userData = auth.currentUser();
    
    // Reset form
    bookingForm.reset();
    document.getElementById("bookingType").value = "";
    document.getElementById("bookingItem").innerHTML = '<option value="">Select an item</option>';
    document.getElementById("totalPrice").textContent = "--";
    
    // Set user data
    if (userData) {
        document.getElementById("name").value = userData.fullName || userData.username || userData.name || "";
        document.getElementById("email").value = userData.email || "";
        document.getElementById("phone").value = userData.phone || "";
    }
    
    // Show modal
    bookingModal.show();
}


// ✅ Redirect Unauthenticated Users
function redirectToSignup() {
    window.location.href = `SignUp.html?redirect=${encodeURIComponent(window.location.href)}`;
    return false;
}

// ✅ Setup Booking Form
// Modify the setupBookingForm function to work with the modal
function setupBookingForm() {
    const apiBase = "https://localhost:7020/api";
    const bookingForm = document.getElementById("bookingForm");
    const confirmBookingBtn = document.getElementById("confirmBookingBtn");
    const bookingModal = new bootstrap.Modal(document.getElementById('bookingModal'));
    
    if (!bookingForm) return;

    const userData = auth.currentUser();
    const nameInput = document.getElementById("name");
    const emailInput = document.getElementById("email");
    const phoneInput = document.getElementById("phone");
    const notesInput = document.getElementById("notes");
    const bookingTypeSelect = document.getElementById("bookingType");
    const bookingItemSelect = document.getElementById("bookingItem");
    const paymentMethodSelect = document.getElementById("paymentMethod");
    const totalPriceDisplay = document.getElementById("totalPrice");

    // Initialize form with user data
    if (userData) {
        nameInput.value = userData.fullName || userData.username || userData.name || "";
        emailInput.value = userData.email || "";
        phoneInput.value = userData.phone || "";
    }

    // Load items when booking type changes
    bookingTypeSelect.addEventListener("change", loadBookingItems);
    bookingItemSelect.addEventListener("change", updateBookingPrice);
    confirmBookingBtn.addEventListener("click", handleBookingSubmit);

    // Update all booking buttons to open the modal
    document.querySelectorAll(".booking-btn").forEach(button => {
        button.addEventListener("click", function(e) {
            e.preventDefault();
            
            if (!auth.isLoggedIn()) {
                redirectToSignup();
                return;
            }
            
            // Reset form
            bookingForm.reset();
            bookingTypeSelect.value = "";
            bookingItemSelect.innerHTML = '<option value="">Select an item</option>';
            totalPriceDisplay.textContent = "--";
            
            // Set default values again
            if (userData) {
                nameInput.value = userData.fullName || userData.username || userData.name || "";
                emailInput.value = userData.email || "";
                phoneInput.value = userData.phone || "";
            }
            
            // Show modal
            bookingModal.show();
        });
    });

    // Rest of the existing setupBookingForm logic remains the same...
    let bookingItemsCache = {
        Membership: [],
        Class: [],
        OnlineSession: []
    };

    async function loadBookingItems() {
        const type = bookingTypeSelect.value;
        if (!type) return;

        bookingItemSelect.disabled = true;
        bookingItemSelect.innerHTML = `<option value="">Loading ${type} options...</option>`;

        try {
            // Check cache first
            if (bookingItemsCache[type].length > 0) {
                populateBookingItems(type, bookingItemsCache[type]);
                return;
            }

            const response = await fetch(`${apiBase}/${type}`);
            if (!response.ok) throw new Error(`Failed to load ${type} options`);

            const data = await response.json();
            if (!Array.isArray(data)) throw new Error(`Invalid ${type} data format`);

            // Cache the results
            bookingItemsCache[type] = data;
            populateBookingItems(type, data);
        } catch (error) {
            console.error(`Error loading ${type} options:`, error);
            bookingItemSelect.innerHTML = `<option value="">Error loading options</option>`;
        } finally {
            bookingItemSelect.disabled = false;
        }
    }

    function populateBookingItems(type, items) {
        bookingItemSelect.innerHTML = `<option value="">Select ${type}</option>`;
        
        items.forEach(item => {
            const option = document.createElement("option");
            option.value = item.id;
            option.textContent = `${item.name || 'Item'} - ${item.price || '0'} SAR`;
            option.dataset.price = item.price || '0';
            bookingItemSelect.appendChild(option);
        });

        updateBookingPrice();
    }

    function updateBookingPrice() {
        const selectedOption = bookingItemSelect.selectedOptions[0];
        const price = selectedOption ? selectedOption.dataset.price || "0" : "0";
        totalPriceDisplay.textContent = price;
    }

    async function handleBookingSubmit(e) {
        e.preventDefault();

        if (!auth.isLoggedIn()) {
            alert("Please log in to make a booking");
            window.location.href = "SignUp.html";
            return;
        }

        const type = bookingTypeSelect.value;
        const itemId = bookingItemSelect.value;
        const selectedOption = bookingItemSelect.selectedOptions[0];
        const price = selectedOption?.dataset.price || "0";

        if (!itemId || itemId === "") {
            alert("Please select an item to book");
            return;
        }

        const bookingData = {
            userId: userData.id,
            bookingType: type,
            name: nameInput.value.trim(),
            email: emailInput.value.trim(),
            phone: phoneInput.value.trim(),
            notes: notesInput.value.trim(),
            paymentMethod: paymentMethodSelect.value,
            amountPaid: parseFloat(price),
            bookingDate: new Date().toISOString()
        };

        // Add type-specific reference
        if (type === "Membership") bookingData.membershipId = itemId;
        if (type === "Class") bookingData.classId = itemId;
        if (type === "OnlineSession") bookingData.onlineSessionId = itemId;

        try {
            const response = await fetch(`${apiBase}/Booking`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${localStorage.getItem("authToken")}`
                },
                body: JSON.stringify(bookingData)
            });

            if (response.ok) {
                const result = await response.json();
                alert("Booking confirmed successfully!");
                bookingModal.hide();
                bookingForm.reset();
                totalPriceDisplay.textContent = "--";
            } else {
                const error = await response.json().catch(() => ({ message: "Unknown error occurred" }));
                throw new Error(error.message || "Booking failed");
            }
        } catch (error) {
            console.error("Booking error:", error);
            alert(`Booking failed: ${error.message}`);
        }
    }
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
                        <p class="price">${membership.price || '0'} SAR / ${membership.durationInDays || '0'} days</p>
                        <ul><li>✔ ${membership.description || 'No description available'}</li></ul>
                        <button class="btn btn-success booking-btn">Book Now</button>
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
                    <div class="main-button scroll-to-section">
                    <a href="" class="main-button booking-btn">Become a Member</a>
                </div>
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
                        <button onclick="document.getElementById('booking').scrollIntoView({ behavior: 'smooth' });" 
                                class="btn-main booking-btn">
                            Book Session
                        </button>
                    </div>
                </div>`).join("");
    } catch (error) {
        console.error("Error loading online sessions:", error);
        sessionsContainer.innerHTML = `<p class="text-danger">Error loading online sessions. Please try again later.</p>`;
    }
}

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