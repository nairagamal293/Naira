// Update the DOMContentLoaded event listener
document.addEventListener("DOMContentLoaded", function () {
    // Initialize all functionality
    checkAuthStatus();
    loadMemberships();
    setupBookingForm();
    
    // Add click handler for any dynamically added booking buttons
    document.addEventListener('click', function(e) {
        const button = e.target.closest('.booking-btn') || e.target.closest('.join-btn');
        if (button) {
            e.preventDefault();
            if (auth.isLoggedIn()) {
                openBookingModal(button);
            } else {
                showSignupAlert();
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
                        <li><a class="dropdown-item" href="Userdashboard.html">My Dashboard</a></li>
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

function openBookingModal(buttonElement = null) {
    const bookingModal = new bootstrap.Modal(document.getElementById('bookingModal'));
    const bookingForm = document.getElementById("bookingForm");
    const userData = auth.currentUser();
    
    // Reset form
    bookingForm.reset();
    document.getElementById("bookingType").value = "Membership"; // Default to Membership
    document.getElementById("bookingItem").innerHTML = '<option value="">Select an item</option>';
    document.getElementById("totalPrice").textContent = "--";
    
    // Set user data
    if (userData) {
        document.getElementById("name").value = userData.fullName || userData.username || userData.name || "";
        document.getElementById("email").value = userData.email || "";
        document.getElementById("phone").value = userData.phone || "";
    }
    
    // If a button with membership data was clicked, pre-select that membership
    if (buttonElement && buttonElement.dataset.id) {
        // Load membership items
        loadBookingItems().then(() => {
            // Wait for items to load, then select the specific membership
            const bookingItemSelect = document.getElementById("bookingItem");
            bookingItemSelect.value = buttonElement.dataset.id;
            
            // Update the price display
            document.getElementById("totalPrice").textContent = buttonElement.dataset.price || "0";
        });
    } else {
        // Just load membership items normally
        loadBookingItems();
    }
    
    // Show modal
    bookingModal.show();
}



// ✅ Redirect Unauthenticated Users
function redirectToSignup() {
    window.location.href = `SignUp.html?redirect=${encodeURIComponent(window.location.href)}`;
    return false;
}

// ✅ Load Memberships
 // Update the loadMemberships function to work with the slider
 // In membership.js, update the loadMemberships function to include data attributes:
// Update the loadMemberships function to handle click events
async function loadMemberships() {
    const membershipSlider = document.querySelector(".membership-slider");
    if (!membershipSlider) return;
    
    try {
        const response = await fetch("https://localhost:7020/api/Membership");
        if (!response.ok) throw new Error("Failed to fetch memberships");
        
        const data = await response.json();
        if (!Array.isArray(data)) {
            throw new Error("Invalid data format received from API");
        }
        
        membershipSlider.innerHTML = data.length === 0 ? 
            "<p class='text-center'>No membership plans available at the moment.</p>" :
            data.map((membership, index) => `
                <div class="membership-card ${index === 1 ? 'featured' : ''}">
                    <h3>${membership.name || 'Membership'}</h3>
                    <div class="price">${membership.price || '0'} <span>SAR</span></div>
                    <p class="period">per ${membership.durationInDays || '30'} days</p>
                    <ul>
                        ${membership.description ? `<li>${membership.description}</li>` : ''}
                        <li>${membership.accessHours || '24/7'} access</li>
                        <li>${membership.trainerSessions || '0'} trainer sessions</li>
                        <li>${membership.classAccess ? '✔' : '✕'} Group classes</li>
                        <li>${membership.lockerAccess ? '✔' : '✕'} Locker access</li>
                    </ul>
                    <button class="btn-main join-btn" 
                            data-id="${membership.id}" 
                            data-name="${membership.name}"
                            data-price="${membership.price}"
                            data-duration="${membership.durationInDays}">
                        Join Now
                    </button>
                </div>
            `).join("");
            
        // Initialize slider navigation
        setupSliderNavigation();
        
        // Add click handlers to all join buttons
        document.querySelectorAll('.join-btn').forEach(button => {
            button.addEventListener('click', function(e) {
                e.preventDefault();
                if (!auth.isLoggedIn()) {
                    showSignupAlert();
                } else {
                    openBookingModal(this);
                }
            });
        });
    } catch (error) {
        console.error("Error loading memberships:", error);
        membershipSlider.innerHTML = `<p class="text-danger text-center">Error loading memberships. Please try again later.</p>`;
    }
}


function setupSliderNavigation() {
    const slider = document.querySelector('.membership-slider');
    const prevBtn = document.querySelector('.slider-prev');
    const nextBtn = document.querySelector('.slider-next');
    
    if (!slider || !prevBtn || !nextBtn) return;
    
    prevBtn.addEventListener('click', () => {
        slider.scrollBy({ left: -300, behavior: 'smooth' });
    });
    
    nextBtn.addEventListener('click', () => {
        slider.scrollBy({ left: 300, behavior: 'smooth' });
    });
}

// Move this outside setupBookingForm or make it accessible
async function loadBookingItems() {
    const bookingTypeSelect = document.getElementById("bookingType");
    const bookingItemSelect = document.getElementById("bookingItem");
    const type = bookingTypeSelect.value;
    if (!type) return;

    bookingItemSelect.disabled = true;
    bookingItemSelect.innerHTML = `<option value="">Loading ${type} options...</option>`;

    try {
        const response = await fetch(`https://localhost:7020/api/${type}`);
        if (!response.ok) throw new Error(`Failed to load ${type} options`);

        const data = await response.json();
        if (!Array.isArray(data)) throw new Error(`Invalid ${type} data format`);

        // Populate the select
        bookingItemSelect.innerHTML = `<option value="">Select ${type}</option>`;
        data.forEach(item => {
            const option = document.createElement("option");
            option.value = item.id;
            option.textContent = `${item.name || 'Item'} - ${item.price || '0'} SAR`;
            option.dataset.price = item.price || '0';
            bookingItemSelect.appendChild(option);
        });
    } catch (error) {
        console.error(`Error loading ${type} options:`, error);
        bookingItemSelect.innerHTML = `<option value="">Error loading options</option>`;
    } finally {
        bookingItemSelect.disabled = false;
    }
}
// ✅ Setup Booking Form
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

// Add this function to show the signup alert
function showSignupAlert() {
    const alertModal = document.getElementById('signupAlert');
    alertModal.classList.add('active');
    
    // Close button handler
    document.getElementById('cancelAlertBtn').addEventListener('click', function() {
        alertModal.classList.remove('active');
    }, { once: true });
    
    // Signup button handler
    document.getElementById('signupAlertBtn').addEventListener('click', function() {
        redirectToSignup();
    }, { once: true });
    
    // Close when clicking outside content
    alertModal.addEventListener('click', function(e) {
        if (e.target === this) {
            this.classList.remove('active');
        }
    });
    
    // Close with escape key
    document.addEventListener('keydown', function closeOnEscape(e) {
        if (e.key === 'Escape') {
            alertModal.classList.remove('active');
            document.removeEventListener('keydown', closeOnEscape);
        }
    }, { once: true });
}


