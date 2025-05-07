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

function openBookingModal(scheduleId = null) {
    const bookingModal = new bootstrap.Modal(document.getElementById('bookingModal'));
    const bookingForm = document.getElementById("bookingForm");
    const userData = auth.currentUser();
    
    // Reset form
    bookingForm.reset();
    document.getElementById("bookingType").innerHTML = `
        <option value="">Select Type</option>
        <option value="Membership">Membership</option>
        <option value="Schedule" selected>Class Schedule</option>
        <option value="OnlineSession">Online Session</option>
    `;
    document.getElementById("bookingItem").innerHTML = '<option value="">Select an item</option>';
    document.getElementById("totalPrice").textContent = "--";
    
    // Set user data
    if (userData) {
        document.getElementById("name").value = userData.fullName || userData.username || userData.name || "";
        document.getElementById("email").value = userData.email || "";
        document.getElementById("phone").value = userData.phone || "";
    }
    
    // If a specific schedule was clicked, preselect it
    if (scheduleId) {
        setTimeout(() => {
            document.getElementById("bookingType").value = "Schedule";
            loadBookingItems().then(() => {
                document.getElementById("bookingItem").value = scheduleId;
                updateBookingPrice();
            });
        }, 300);
    }
    
    // Show modal
    bookingModal.show();
}



// ✅ Redirect Unauthenticated Users
function redirectToSignup() {
    window.location.href = `SignUp.html?redirect=${encodeURIComponent(window.location.href)}`;
    return false;
}



function showScheduleDetails(option) {
    const detailsContainer = document.getElementById('scheduleDetails');
    if (!detailsContainer) {
        // Create details container if it doesn't exist
        const container = document.createElement('div');
        container.id = 'scheduleDetails';
        container.className = 'schedule-details';
        bookingItemSelect.parentNode.insertBefore(container, bookingItemSelect.nextSibling);
    }

    document.getElementById('scheduleDetails').innerHTML = `
        <div class="schedule-detail-card">
            <h4>${option.dataset.className}</h4>
            <p><strong>Trainer:</strong> ${option.dataset.trainerName}</p>
            <p><strong>Date:</strong> ${option.dataset.scheduleDate}</p>
            <p><strong>Time:</strong> ${option.dataset.startTime} - ${option.dataset.endTime}</p>
            <p><strong>Available Spots:</strong> ${option.dataset.availableSpots}</p>
            <p>${option.dataset.description}</p>
        </div>
    `;
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
            if (type === "Schedule") {
                // Step 1: First load all available classes
                const classesResponse = await fetch(`${apiBase}/Class`);
                if (!classesResponse.ok) throw new Error("Failed to fetch classes");
                
                const classes = await classesResponse.json();
                
                // Populate classes dropdown
                bookingItemSelect.innerHTML = `
                    <option value="">Select a Class</option>
                    ${classes.map(cls => `
                        <option value="${cls.id}" 
                                data-name="${cls.name}" 
                                data-description="${cls.description}">
                            ${cls.name} - ${cls.description || ''}
                        </option>
                    `).join('')}
                `;
                
                // When class is selected, load available schedules for that class
                bookingItemSelect.addEventListener('change', async function() {
                    const classId = this.value;
                    if (!classId) return;
                    
                    // Clear any existing time slot select
                    const existingTimeSlotSelect = document.getElementById('timeSlotSelect');
                    if (existingTimeSlotSelect) existingTimeSlotSelect.remove();
                    
                    // Create loading message
                    const timeSlotSelect = document.createElement('select');
                    timeSlotSelect.id = 'timeSlotSelect';
                    timeSlotSelect.className = 'form-control mt-3';
                    timeSlotSelect.innerHTML = '<option value="">Loading available time slots...</option>';
                    bookingItemSelect.parentNode.appendChild(timeSlotSelect);
                    
                    try {
                        // Load schedules for this specific class
                        const schedulesResponse = await fetch(`${apiBase}/Schedule/available?classId=${classId}`);
                        if (!schedulesResponse.ok) throw new Error("Failed to fetch schedules");
                        
                        const schedules = await schedulesResponse.json();
                        
                        // Populate time slots
                        timeSlotSelect.innerHTML = `
                            <option value="">Select a Time Slot</option>
                            ${schedules.map(schedule => `
                                <option value="${schedule.id}"
                                        data-trainer-id="${schedule.trainerId}"
                                        data-trainer-name="${schedule.trainerName}"
                                        data-date="${schedule.scheduleDate}"
                                        data-start="${schedule.startTime}"
                                        data-end="${schedule.endTime}"
                                        data-price="${schedule.price}">
                                    ${new Date(schedule.scheduleDate).toLocaleDateString()} - 
                                    ${schedule.startTime} to ${schedule.endTime} with 
                                    ${schedule.trainerName} (${schedule.price} SAR)
                                </option>
                            `).join('')}
                        `;
                        
                        // Update price when time slot is selected
                        timeSlotSelect.addEventListener('change', function() {
                            const selectedOption = this.options[this.selectedIndex];
                            if (selectedOption && selectedOption.value) {
                                totalPriceDisplay.textContent = selectedOption.dataset.price || '0';
                            } else {
                                totalPriceDisplay.textContent = '--';
                            }
                        });
                        
                    } catch (error) {
                        console.error("Error loading schedules:", error);
                        timeSlotSelect.innerHTML = '<option value="">Error loading time slots</option>';
                    }
                });
            } else {
                // Original handling for other types (Membership, OnlineSession)
                let endpoint, transformFn;
                
                if (type === "Membership") {
                    endpoint = "Membership";
                    transformFn = item => ({
                        id: item.id,
                        name: item.name,
                        price: item.price
                    });
                } else if (type === "OnlineSession") {
                    endpoint = "OnlineSession";
                    transformFn = item => ({
                        id: item.id,
                        name: item.title,
                        price: item.price
                    });
                }
                
                const response = await fetch(`${apiBase}/${endpoint}`);
                if (!response.ok) throw new Error(`Failed to load ${type} options`);
                
                const data = await response.json();
                populateBookingItems(type, data.map(transformFn));
            }
        } catch (error) {
            console.error(`Error loading ${type} options:`, error);
            bookingItemSelect.innerHTML = `<option value="">Error loading options</option>`;
        } finally {
            bookingItemSelect.disabled = false;
        }
    }

    

    function formatScheduleTime(schedule) {
        if (!schedule.ScheduleDate || !schedule.StartTime || !schedule.EndTime) return '';
        
        const date = new Date(schedule.ScheduleDate);
        const options = { weekday: 'short', month: 'short', day: 'numeric' };
        const dateStr = date.toLocaleDateString('en-US', options);
        
        return `${dateStr} ${schedule.StartTime}-${schedule.EndTime}`;
    }


    function populateBookingItems(type, items) {
        bookingItemSelect.innerHTML = `<option value="">Select ${type}</option>`;
        
        items.forEach(item => {
            const option = document.createElement("option");
            option.value = item.id;
            
            if (type === "Schedule") {
                // Handle cases where properties might be undefined
                const className = item.className || 'Class';
                const trainerName = item.trainerName || 'Trainer';
                const startTime = item.startTime || '--:--';
                const endTime = item.endTime || '--:--';
                
                option.textContent = `${className} with ${trainerName} (${startTime}-${endTime})`;
                option.dataset.price = item.price || '0';
                option.dataset.description = item.description || 'No description available';
                option.dataset.scheduleDate = item.scheduleDate || '';
                option.dataset.startTime = startTime;
                option.dataset.endTime = endTime;
                option.dataset.className = className;
                option.dataset.trainerName = trainerName;
                option.dataset.availableSpots = item.availableSpots || 0;
            } else {
                option.textContent = `${item.name} - ${item.price || '0'} SAR`;
                option.dataset.price = item.price || '0';
            }
            
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
    const userData = auth.currentUser();
    const name = document.getElementById("name").value.trim();
    const email = document.getElementById("email").value.trim();
    const phone = document.getElementById("phone").value.trim();
    const notes = document.getElementById("notes").value.trim();
    const paymentMethod = document.getElementById("paymentMethod").value;

    // Validate required fields
    if (!name || !email || !phone || !paymentMethod) {
        alert("Please fill in all required fields");
        return;
    }

    let itemId, price;

    // Handle different booking types
    if (type === "Schedule") {
        const timeSlotSelect = document.getElementById('timeSlotSelect');
        if (!timeSlotSelect || !timeSlotSelect.value) {
            alert("Please select a time slot");
            return;
        }
        itemId = timeSlotSelect.value;
        const selectedOption = timeSlotSelect.options[timeSlotSelect.selectedIndex];
        price = selectedOption?.dataset.price || "0";
    } else {
        // For Membership and OnlineSession
        if (!bookingItemSelect.value) {
            alert(`Please select a ${type.toLowerCase()}`);
            return;
        }
        itemId = bookingItemSelect.value;
        const selectedOption = bookingItemSelect.options[bookingItemSelect.selectedIndex];
        price = selectedOption?.dataset.price || "0";
    }

    // Prepare booking data
    const bookingData = {
        userId: userData.id,
        bookingType: type === "Membership" ? 1 : type === "Schedule" ? 2 : 3,
        name: name,
        email: email,
        phone: phone,
        notes: notes,
        paymentMethod: paymentMethod,
        amountPaid: parseFloat(price),
        status: "Pending",
        paymentStatus: "Unpaid"
    };

    // Add type-specific reference
    if (type === "Membership") {
        bookingData.membershipId = parseInt(itemId);
    } 
    else if (type === "Schedule") {
        bookingData.scheduleId = parseInt(itemId);
        
        // Add schedule details to notes (optional)
        const timeSlotSelect = document.getElementById('timeSlotSelect');
        const selectedOption = timeSlotSelect.options[timeSlotSelect.selectedIndex];
        if (selectedOption) {
            bookingData.notes = (notes ? notes + "\n\n" : "") +
                `Schedule Details:\n` +
                `- Class: ${selectedOption.parentElement?.querySelector('option[value="' + bookingItemSelect.value + '"]')?.textContent}\n` +
                `- Time: ${selectedOption.dataset.start} to ${selectedOption.dataset.end}\n` +
                `- Date: ${new Date(selectedOption.dataset.date).toLocaleDateString()}\n` +
                `- Trainer: ${selectedOption.dataset.trainerName}`;
        }
    } 
    else if (type === "OnlineSession") {
        bookingData.onlineSessionId = parseInt(itemId);
    }

    try {
        const response = await fetch(`${apiBase}/Booking`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${localStorage.getItem("authToken")}`
            },
            body: JSON.stringify(bookingData)
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({ message: "Unknown error occurred" }));
            throw new Error(error.message || "Booking failed with status " + response.status);
        }

        const result = await response.json();
        
        // Show success message
        alert(`Booking confirmed successfully!\nReference: ${result.id}`);
        
        // Close the modal
        const bookingModal = bootstrap.Modal.getInstance(document.getElementById('bookingModal'));
        bookingModal.hide();
        
        // Reset form
        bookingForm.reset();
        document.getElementById("totalPrice").textContent = "--";
        
        // Remove any time slot select if exists
        const timeSlotSelect = document.getElementById('timeSlotSelect');
        if (timeSlotSelect) timeSlotSelect.remove();
        
        // Refresh schedules to update availability
        if (type === "Schedule") {
            loadSchedules();
        }

    } catch (error) {
        console.error("Booking error:", error);
        alert(`Booking failed: ${error.message}\nPlease try again or contact support.`);
        
        // For schedule booking errors, reload the time slots
        if (type === "Schedule") {
            const classId = bookingItemSelect.value;
            if (classId) {
                const timeSlotSelect = document.getElementById('timeSlotSelect');
                if (timeSlotSelect) {
                    timeSlotSelect.innerHTML = '<option value="">Loading available time slots...</option>';
                    // You might want to reload the time slots here
                }
            }
        }
    }
}}




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
                        <button class="btn-main booking-btn">Book Now</button>
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





// ✅ Load Schedules with Filtering
async function loadSchedules() {
    try {
        const response = await fetch("https://localhost:7020/api/Schedule");
        if (!response.ok) throw new Error("Failed to load schedules.");
        
        const schedules = await response.json();
        console.log("API Response:", schedules); // Debug log
        
        if (!Array.isArray(schedules)) {
            throw new Error("Invalid data format received from API");
        }

        if (schedules.length === 0) {
            showEmptySchedule();
            return;
        }

        // Add day of week to each schedule based on scheduleDate
        const schedulesWithDays = schedules.map(schedule => {
            if (!schedule.scheduleDate) {
                console.warn("Schedule missing scheduleDate:", schedule);
                return schedule;
            }
            
            try {
                const date = new Date(schedule.scheduleDate);
                if (isNaN(date.getTime())) {
                    console.error("Invalid date:", schedule.scheduleDate);
                    return schedule;
                }
                
                const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
                const day = days[date.getDay()];
                
                return {
                    ...schedule,
                    day: day
                };
            } catch (e) {
                console.error("Error processing date:", e);
                return schedule;
            }
        });

        console.log("Processed schedules:", schedulesWithDays); // Debug log

        // Store schedules globally for filtering
        window.allSchedules = schedulesWithDays;

        // Render all schedules initially (shows Monday by default)
        renderSchedules('monday');

        // Set up day filter buttons
        setupDayFilters();

    } catch (error) {
        console.error("Error loading schedules:", error);
        showEmptySchedule("Error loading schedule. Please try again later.");
    }
}

function renderSchedules(day) {
    const container = document.querySelector('.schedule-items-container');
    if (!container) return;

    const filteredSchedules = window.allSchedules.filter(schedule => 
        schedule.day?.toLowerCase() === day.toLowerCase()
    );

    if (filteredSchedules.length === 0) {
        container.innerHTML = `
            <div class="schedule-empty">
                <i class="far fa-calendar-times"></i>
                <h4>No classes scheduled for ${capitalizeFirstLetter(day)}</h4>
                <p>Check back later for updates</p>
            </div>
        `;
        return;
    }

    container.innerHTML = filteredSchedules.map(schedule => {
        // Format the date to be more readable
        const scheduleDate = new Date(schedule.scheduleDate);
        const formattedDate = scheduleDate.toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric'
        });

        return `
        <div class="schedule-card" data-day="${schedule.day.toLowerCase()}">
            <div class="schedule-card-header">
                <span class="schedule-date">${formattedDate}</span>
                <span class="schedule-time">${schedule.startTime || '09:00'} - ${schedule.endTime || '10:00'}</span>
                <span class="schedule-badge">${schedule.difficulty || 'All Levels'}</span>
            </div>
            <div class="schedule-card-body">
                <h4 class="schedule-class-name">${schedule.className || 'Fitness Class'}</h4>
                <div class="schedule-trainer">
                    <i class="fas fa-user-tie"></i>
                    <span>${schedule.trainerName || 'Professional Trainer'}</span>
                </div>
                <div class="schedule-description">
                    <p>${schedule.description || 'Join us for a great workout!'}</p>
                </div>
                <div class="schedule-capacity">
                    <span class="schedule-slots">
                        <i class="fas fa-users"></i>
                        ${schedule.availableSlots !== undefined ? `${schedule.availableSlots} slots available` : 'Open enrollment'}
                    </span>
                    <button class="schedule-book-btn booking-btn ${auth.isLoggedIn() ? '' : 'disabled'}" 
                            data-schedule-id="${schedule.id}"
                            onclick="openBookingModal(${schedule.id})">
                        Book Now
                    </button>
                </div>
            </div>
        </div>
        `;
    }).join("");
}

function setupDayFilters() {
    const dayButtons = document.querySelectorAll('.day-filter');
    
    dayButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Remove active class from all buttons
            dayButtons.forEach(btn => btn.classList.remove('active'));
            
            // Add active class to clicked button
            this.classList.add('active');
            
            // Get the day from data attribute
            const day = this.getAttribute('data-day');
            
            // Render schedules for this day
            renderSchedules(day);
        });
    });
}

function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

function showEmptySchedule(message = "No schedule available at the moment.") {
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    days.forEach(day => {
        const tabContent = document.getElementById(day);
        if (tabContent) {
            tabContent.innerHTML = `
                <div class="schedule-empty">
                    <i class="fas fa-exclamation-circle"></i>
                    <h4>${message}</h4>
                    <button onclick="loadSchedules()" class="btn btn-primary mt-3">
                        <i class="fas fa-sync-alt"></i> Try Again
                    </button>
                </div>
            `;
        }
    });
}

// Initialize schedule tabs
document.addEventListener("DOMContentLoaded", function() {
    const scheduleTabs = document.getElementById('scheduleTabs');
    if (scheduleTabs) {
        scheduleTabs.addEventListener('shown.bs.tab', function (event) {
            // You could add lazy loading here if needed
        });
    }
});

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