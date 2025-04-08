

// ✅ TimeSpan Helper Function (NEW - add this right after constants)
function createTimeSpan(hours, minutes, seconds) {
    return {
        ticks: (hours * 3600 + minutes * 60 + seconds) * 10000000,
        days: 0,
        hours: hours,
        milliseconds: 0,
        minutes: minutes,
        seconds: seconds,
        totalDays: hours / 24 + minutes / 1440 + seconds / 86400,
        totalHours: hours + minutes / 60 + seconds / 3600,
        totalMilliseconds: (hours * 3600 + minutes * 60 + seconds) * 1000,
        totalMinutes: hours * 60 + minutes + seconds / 60,
        totalSeconds: hours * 3600 + minutes * 60 + seconds
    };
}



document.addEventListener("DOMContentLoaded", function () {
    checkAdminAuth();
    loadDashboard();
});

// ✅ API Base URL
const API_BASE_URL = "https://localhost:7020/api/Admin";

// ✅ Get Auth Headers
function getAuthHeaders() {
    const token = localStorage.getItem("authToken");
    return {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
    };
}

// ✅ Check if User is Admin Before Loading
function checkAdminAuth() {
    const token = localStorage.getItem("authToken");
    if (!token) {
        console.warn("❌ No auth token found. Redirecting to login...");
        window.location.href = "login.html";
        return;
    }

    try {
        const decodedToken = JSON.parse(atob(token.split(".")[1])); // Decode JWT payload
        const userRole = decodedToken["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"];
        
        if (userRole !== "Admin") {
            alert("❌ Unauthorized! Only Admins can access this page.");
            window.location.href = "index.html"; // Redirect if not an admin
        }
    } catch (error) {
        console.error("❌ Error decoding token:", error);
        window.location.href = "login.html"; // Redirect if token is invalid
    }
}

// ✅ Load Dashboard Analytics Data
async function loadDashboard() {
    document.getElementById("dashboard-title").innerText = "Dashboard Overview";
    document.getElementById("admin-content").innerHTML = "";

    try {
        const response = await fetch(`${API_BASE_URL}/analytics`, { headers: getAuthHeaders() });

        if (!response.ok) {
            if (response.status === 401) {
                alert("❌ Unauthorized! Please log in again.");
                window.location.href = "login.html";
                return;
            }
            throw new Error(`HTTP Error ${response.status}`);
        }

        const data = await response.json();
        document.getElementById("total-users").textContent = data.totalUsers;
        document.getElementById("active-memberships").textContent = data.activeMemberships;
        document.getElementById("total-bookings").textContent = data.totalBookings;
        document.getElementById("revenue").textContent = `$${data.revenue}`;
    } catch (error) {
        console.error("❌ Error loading dashboard data:", error);
        document.getElementById("admin-content").innerHTML = "<p class='text-danger'>Error loading dashboard data.</p>";
    }
}

// ✅ Load Users
async function loadUsers() {
    document.getElementById("dashboard-title").innerText = "User Management";
    const content = document.getElementById("admin-content");
    content.innerHTML = "<h4>Loading users...</h4>";

    try {
        const response = await fetch(`${API_BASE_URL}/users`, { headers: getAuthHeaders() });

        if (!response.ok) {
            if (response.status === 401) {
                alert("❌ Unauthorized! Please log in again.");
                window.location.href = "login.html";
                return;
            }
            throw new Error(`HTTP Error ${response.status}`);
        }

        const users = await response.json();
        content.innerHTML = `
            <div class="table-responsive">
                <table class="table table-striped table-hover">
                    <thead>
                        <tr>
                            <th><i class="fas fa-user me-2"></i>Name</th>
                            <th><i class="fas fa-envelope me-2"></i>Email</th>
                            <th><i class="fas fa-cog me-2"></i>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${users.map(user => `
                            <tr>
                                <td>${user.fullName}</td>
                                <td>${user.email}</td>
                                <td>
                                    <button class="btn btn-sm btn-warning me-2" onclick="promoteUser('${user.id}')">
                                        <i class="fas fa-level-up-alt"></i> Promote
                                    </button>
                                    <button class="btn btn-sm btn-danger" onclick="deleteUser('${user.id}')">
                                        <i class="fas fa-trash"></i> Delete
                                    </button>
                                </td>
                            </tr>`).join('')}
                    </tbody>
                </table>
            </div>`;
    } catch (error) {
        console.error("❌ Error loading users:", error);
        content.innerHTML = "<div class='alert alert-danger'>Error loading users.</div>";
    }
}

// ✅ Promote User to Admin
async function promoteUser(userId) {
    if (!confirm("Are you sure you want to promote this user to Admin?")) return;

    try {
        const response = await fetch(`${API_BASE_URL}/promote/${userId}`, {
            method: "POST",
            headers: getAuthHeaders()
        });

        if (!response.ok) {
            if (response.status === 401) {
                alert("❌ Unauthorized! Please log in again.");
                window.location.href = "login.html";
                return;
            }
            throw new Error(`HTTP Error ${response.status}`);
        }

        alert("✅ User promoted successfully!");
        loadUsers();
    } catch (error) {
        console.error("❌ Error promoting user:", error);
        alert("Error promoting user.");
    }
}

// ✅ Delete User
async function deleteUser(userId) {
    if (!confirm("Are you sure you want to delete this user?")) return;

    try {
        const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
            method: "DELETE",
            headers: getAuthHeaders()
        });

        if (!response.ok) {
            if (response.status === 401) {
                alert("❌ Unauthorized! Please log in again.");
                window.location.href = "login.html";
                return;
            }
            throw new Error(`HTTP Error ${response.status}`);
        }

        alert("✅ User deleted successfully!");
        loadUsers();
    } catch (error) {
        console.error("❌ Error deleting user:", error);
        alert("Error deleting user.");
    }
}



// ✅ Load Memberships (Updated with CRUD functionality)
async function loadMemberships() {
    document.getElementById("dashboard-title").innerText = "Membership Management";
    const content = document.getElementById("admin-content");
    content.innerHTML = "<h4>Loading memberships...</h4>";

    try {
        const response = await fetch("https://localhost:7020/api/Membership", { 
            headers: getAuthHeaders() 
        });

        if (response.status === 401) {
            alert("❌ Unauthorized! Please log in again.");
            window.location.href = "login.html";
            return;
        }

        if (!response.ok) throw new Error(`HTTP Error ${response.status}`);

        const memberships = await response.json();
        
        content.innerHTML = `
            <button class="btn btn-success mb-3" onclick="showMembershipModal()">
                <i class="fas fa-plus"></i> Add New Membership
            </button>
            <div class="table-responsive">
                <table class="table table-striped table-hover">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Price</th>
                            <th>Duration</th>
                            <th>Description</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${memberships.map(membership => `
                            <tr>
                                <td>${membership.name}</td>
                                <td>$${membership.price.toFixed(2)}</td>
                                <td>${membership.durationInDays} days</td>
                                <td>${membership.description || 'N/A'}</td>
                                <td>
                                    <button class="btn btn-sm btn-warning me-2" onclick="showMembershipModal('${membership.id}')">
                                        <i class="fas fa-edit"></i> Edit
                                    </button>
                                    <button class="btn btn-sm btn-danger" onclick="deleteMembership('${membership.id}')">
                                        <i class="fas fa-trash"></i> Delete
                                    </button>
                                </td>
                            </tr>`).join('')}
                    </tbody>
                </table>
            </div>
            
            <!-- Membership Modal -->
            <div class="modal fade" id="membershipModal" tabindex="-1" aria-hidden="true">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title" id="membershipModalTitle">Add New Membership</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div class="modal-body" id="membershipModalBody">
                            <!-- Form will be loaded here -->
                        </div>
                    </div>
                </div>
            </div>`;
    } catch (error) {
        console.error("❌ Error loading memberships:", error);
        content.innerHTML = "<div class='alert alert-danger'>Error loading memberships.</div>";
    }
}


// Show modal for adding/editing membership
// Show modal for adding/editing membership
async function showMembershipModal(membershipId = null) {
    const modalTitle = document.getElementById("membershipModalTitle");
    const modalBody = document.getElementById("membershipModalBody");
    const modal = new bootstrap.Modal(document.getElementById('membershipModal'));
    
    if (membershipId) {
        // Edit mode
        modalTitle.textContent = "Edit Membership";
        try {
            const response = await fetch(`https://localhost:7020/api/Membership/${membershipId}`, {
                headers: getAuthHeaders()
            });

            // Check if response is OK and has content
            if (!response.ok) {
                throw new Error(`HTTP Error ${response.status}`);
            }

            // Check if response has content before parsing JSON
            const contentLength = response.headers.get('Content-Length');
            if (contentLength && parseInt(contentLength) === 0) {
                throw new Error("Empty response from server");
            }

            const text = await response.text();
            const membership = text ? JSON.parse(text) : null;
            
            if (!membership) {
                throw new Error("Invalid membership data received");
            }

            modalBody.innerHTML = getMembershipForm(membership);
        } catch (error) {
            console.error("Error loading membership:", error);
            modalBody.innerHTML = `
                <div class="alert alert-danger">
                    Error loading membership: ${error.message}
                    <button class="btn btn-sm btn-secondary mt-2" onclick="showMembershipModal()">
                        Try Again
                    </button>
                </div>`;
            modal.show();
            return;
        }
    } else {
        // Add mode
        modalTitle.textContent = "Add New Membership";
        modalBody.innerHTML = getMembershipForm();
    }
    
    modal.show();
}

// Return HTML form for membership
function getMembershipForm(membership = null) {
    return `
        <form id="membershipForm" onsubmit="handleMembershipFormSubmit(event)">
            <input type="hidden" id="membershipId" value="${membership?.id || ''}">
            <div class="mb-3">
                <label for="membershipName" class="form-label">Name</label>
                <input type="text" class="form-control" id="membershipName" 
                       value="${membership?.name || ''}" required>
            </div>
            <div class="mb-3">
                <label for="membershipPrice" class="form-label">Price ($)</label>
                <input type="number" step="0.01" class="form-control" id="membershipPrice" 
                       value="${membership?.price || ''}" required>
            </div>
            <div class="mb-3">
                <label for="membershipDuration" class="form-label">Duration (Days)</label>
                <input type="number" class="form-control" id="membershipDuration" 
                       value="${membership?.durationInDays || ''}" required>
            </div>
            <div class="mb-3">
                <label for="membershipDescription" class="form-label">Description</label>
                <textarea class="form-control" id="membershipDescription" rows="3">${membership?.description || ''}</textarea>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                <button type="submit" class="btn btn-primary">Save</button>
            </div>
        </form>`;
}


// Handle membership form submission
// Handle membership form submission
async function handleMembershipFormSubmit(event) {
    event.preventDefault();
    
    const membershipId = document.getElementById("membershipId").value;
    const isEdit = !!membershipId;
    
    const membershipData = {
        id: membershipId ? parseInt(membershipId) : 0,
        name: document.getElementById("membershipName").value,
        price: parseFloat(document.getElementById("membershipPrice").value),
        durationInDays: parseInt(document.getElementById("membershipDuration").value),
        description: document.getElementById("membershipDescription").value,
        startDate: new Date().toISOString() // Default to current date
    };

    // Validate input
    if (!membershipData.name || isNaN(membershipData.price) || isNaN(membershipData.durationInDays)) {
        alert("Please fill all required fields with valid values");
        return;
    }

    try {
        const url = isEdit 
            ? `https://localhost:7020/api/Membership/${membershipId}` 
            : 'https://localhost:7020/api/Membership';
            
        const method = isEdit ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
            method: method,
            headers: {
                ...getAuthHeaders(),
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(membershipData)
        });

        // Check if response is OK
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText || `HTTP Error ${response.status}`);
        }

        // Try to parse JSON only if there's content
        const result = await response.json().catch(() => ({}));

        // Close modal and refresh list
        bootstrap.Modal.getInstance(document.getElementById('membershipModal')).hide();
        loadMemberships();
        
        // Show success message
        alert(`Membership ${isEdit ? 'updated' : 'created'} successfully!`);
        
    } catch (error) {
        console.error("Error saving membership:", error);
        alert(`Error saving membership: ${error.message}`);
    }
}

// Delete membership
// Delete membership
async function deleteMembership(membershipId) {
    if (!confirm("Are you sure you want to delete this membership? This action cannot be undone.")) {
        return;
    }

    try {
        const response = await fetch(`https://localhost:7020/api/Membership/${membershipId}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText || `HTTP Error ${response.status}`);
        }

        // Refresh the memberships list
        loadMemberships();
        alert("Membership deleted successfully!");
    } catch (error) {
        console.error("Error deleting membership:", error);
        alert(`Error deleting membership: ${error.message}`);
    }
}

// ✅ Load Classes
async function loadClasses() {
    document.getElementById("dashboard-title").innerText = "Manage Classes";
    const content = document.getElementById("admin-content");
    content.innerHTML = "<h4>Loading classes...</h4>";

    try {
        const response = await fetch("https://localhost:7020/api/Class", { 
            headers: getAuthHeaders() 
        });

        if (response.status === 401) {
            alert("❌ Unauthorized! Please log in again.");
            window.location.href = "login.html";
            return;
        }

        if (!response.ok) throw new Error(`HTTP Error ${response.status}`);

        const classes = await response.json();
        
        content.innerHTML = `
            <button class="btn btn-success mb-3" onclick="showClassModal()">
                <i class="fas fa-plus"></i> Add New Class
            </button>
            <div class="table-responsive">
                <table class="table table-striped">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Description</th>
                            <th>Trainer</th>
                            <th>Schedule</th>
                            <th>Price</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${classes.map(cls => `
                            <tr>
                                <td>${cls.name || 'N/A'}</td>
                                <td>${cls.description || 'N/A'}</td>
                                <td>${cls.trainerName || 'N/A'}</td>
                                <td>${cls.daysOfWeek || 'N/A'}, ${cls.startTime} - ${cls.endTime}</td>
                                <td>$${cls.price || '0'}</td>
                                <td>
                                    <button class="btn btn-sm btn-warning me-2" onclick="showClassModal('${cls.id}')">
                                        <i class="fas fa-edit"></i> Edit
                                    </button>
                                    <button class="btn btn-sm btn-danger" onclick="deleteClass('${cls.id}')">
                                        <i class="fas fa-trash"></i> Delete
                                    </button>
                                </td>
                            </tr>`).join('')}
                    </tbody>
                </table>
            </div>
            <!-- Class Modal -->
            <div class="modal fade" id="classModal" tabindex="-1" aria-hidden="true">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title" id="classModalTitle">Add New Class</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div class="modal-body" id="classModalBody">
                            <!-- Form will be loaded here -->
                        </div>
                    </div>
                </div>
            </div>`;
    } catch (error) {
        console.error("❌ Error loading classes:", error);
        content.innerHTML = `<div class='alert alert-danger'>Error loading classes: ${error.message}</div>`;
    }
}



// Show modal for adding/editing class
// Show modal for adding/editing class
async function showClassModal(classId = null) {
    const modalTitle = document.getElementById("classModalTitle");
    const modalBody = document.getElementById("classModalBody");
    const modalElement = document.getElementById('classModal');
    
    // Fix accessibility issue
    modalElement.removeAttribute('aria-hidden');
    const modal = new bootstrap.Modal(modalElement);
    
    try {
        // First load trainers for the dropdown
        const [trainersResponse, classResponse] = await Promise.all([
            fetch("https://localhost:7020/api/Trainer", { headers: getAuthHeaders() }),
            classId ? fetch(`https://localhost:7020/api/Class/${classId}`, { headers: getAuthHeaders() }) : null
        ]);

        if (!trainersResponse.ok) {
            throw new Error("Failed to load trainers");
        }
        const trainers = await trainersResponse.json();

        if (classId) {
            // Edit mode
            modalTitle.textContent = "Edit Class";
            if (!classResponse || !classResponse.ok) {
                const errorText = await classResponse?.text() || 'Unknown error';
                throw new Error(`Failed to load class: ${errorText}`);
            }

            const cls = await classResponse.json();
            modalBody.innerHTML = getClassForm(cls, trainers);
        } else {
            // Add mode
            modalTitle.textContent = "Add New Class";
            modalBody.innerHTML = getClassForm(null, trainers);
        }
        
        modal.show();
    } catch (error) {
        console.error("Error:", error);
        modalBody.innerHTML = `
            <div class="alert alert-danger">
                <h5>Error loading class</h5>
                <p>${error.message}</p>
                <p>Please check:</p>
                <ul>
                    <li>Backend API is running</li>
                    <li>You have proper permissions</li>
                    <li>Class ID exists</li>
                </ul>
                <button class="btn btn-sm btn-secondary mt-2" onclick="showClassModal('${classId}')">
                    <i class="fas fa-sync-alt"></i> Try Again
                </button>
            </div>`;
        modal.show();
    }
}

function getClassForm(cls = null, trainers = []) {
    // Format time for input fields (HH:mm)
    const startTime = cls?.startTime ? cls.startTime.substring(0, 5) : '08:00';
    const endTime = cls?.endTime ? cls.endTime.substring(0, 5) : '09:00';
    
    return `
        <form id="classForm" onsubmit="handleClassFormSubmit(event)">
            <input type="hidden" id="classId" value="${cls?.id || ''}">
            <div class="mb-3">
                <label for="className" class="form-label">Class Name</label>
                <input type="text" class="form-control" id="className" value="${cls?.name || ''}" required>
            </div>
            <div class="mb-3">
                <label for="classDescription" class="form-label">Description</label>
                <textarea class="form-control" id="classDescription" rows="3">${cls?.description || ''}</textarea>
            </div>
            <div class="mb-3">
                <label for="classCapacity" class="form-label">Capacity</label>
                <input type="number" class="form-control" id="classCapacity" value="${cls?.capacity || 20}" required>
            </div>
            <div class="mb-3">
                <label for="classDays" class="form-label">Days of Week</label>
                <input type="text" class="form-control" id="classDays" value="${cls?.daysOfWeek || ''}" 
                       placeholder="e.g., Monday, Wednesday, Friday" required>
            </div>
            <div class="row mb-3">
                <div class="col">
                    <label for="classStartTime" class="form-label">Start Time</label>
                    <input type="time" class="form-control" id="classStartTime" value="${startTime}" required>
                </div>
                <div class="col">
                    <label for="classEndTime" class="form-label">End Time</label>
                    <input type="time" class="form-control" id="classEndTime" value="${endTime}" required>
                </div>
            </div>
            <div class="mb-3">
                <label for="classPrice" class="form-label">Price ($)</label>
                <input type="number" step="0.01" class="form-control" id="classPrice" value="${cls?.price || 0}" required>
            </div>
            <div class="mb-3">
                <label for="classTrainer" class="form-label">Trainer</label>
                <select class="form-select" id="classTrainer" required>
                    ${trainers.map(trainer => `
                        <option value="${trainer.id}" ${cls?.trainerId === trainer.id ? 'selected' : ''}>
                            ${trainer.name}
                        </option>
                    `).join('')}
                </select>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                <button type="submit" class="btn btn-primary">Save</button>
            </div>
        </form>`;
}


// Handle form submission
async function handleClassFormSubmit(event) {
    event.preventDefault();
    
    const classId = document.getElementById("classId").value;
    const isEdit = !!classId;
    
    // Get form values
    const classData = {
        name: document.getElementById("className").value,
        description: document.getElementById("classDescription").value,
        capacity: parseInt(document.getElementById("classCapacity").value),
        daysOfWeek: document.getElementById("classDays").value,
        startTime: document.getElementById("classStartTime").value + ":00",
        endTime: document.getElementById("classEndTime").value + ":00",
        price: parseFloat(document.getElementById("classPrice").value),
        trainerId: parseInt(document.getElementById("classTrainer").value),
        date: null
    };

    // For edit, we need to include the ID
    if (isEdit) {
        classData.id = parseInt(classId);
    }

    try {
        const url = isEdit 
            ? `https://localhost:7020/api/Class/${classId}` 
            : 'https://localhost:7020/api/Class';
            
        const method = isEdit ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
            method: method,
            headers: {
                ...getAuthHeaders(),
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(classData)
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error("API Error:", errorData);
            
            // Build a more detailed error message
            let errorMessage = `HTTP Error ${response.status}`;
            if (errorData.errors) {
                errorMessage += ": " + Object.entries(errorData.errors)
                    .map(([field, errors]) => `${field}: ${errors.join(', ')}`)
                    .join('; ');
            }
            
            throw new Error(errorMessage);
        }

        // Close modal and refresh list
        bootstrap.Modal.getInstance(document.getElementById('classModal')).hide();
        loadClasses();
        
    } catch (error) {
        console.error("Error saving class:", error);
        alert(`Error saving class: ${error.message}`);
    }
}




// Return HTML form for class
/* function getClassForm(cls = null, trainers = []) {
    return `
        <form id="classForm" onsubmit="handleClassFormSubmit(event)">
            <input type="hidden" id="classId" value="${cls?.id || ''}">
            <div class="mb-3">
                <label for="className" class="form-label">Class Name</label>
                <input type="text" class="form-control" id="className" value="${cls?.name || ''}" required>
            </div>
            <div class="mb-3">
                <label for="classDescription" class="form-label">Description</label>
                <textarea class="form-control" id="classDescription" rows="3">${cls?.description || ''}</textarea>
            </div>
            <div class="mb-3">
                <label for="classCapacity" class="form-label">Capacity</label>
                <input type="number" class="form-control" id="classCapacity" value="${cls?.capacity || 20}" required>
            </div>
            <div class="mb-3">
                <label for="classDays" class="form-label">Days of Week</label>
                <input type="text" class="form-control" id="classDays" value="${cls?.daysOfWeek || ''}" 
                       placeholder="e.g., Monday, Wednesday, Friday" required>
            </div>
            <div class="row mb-3">
                <div class="col">
                    <label for="classStartTime" class="form-label">Start Time</label>
                    <input type="time" class="form-control" id="classStartTime" value="${cls?.startTime?.substring(0, 5) || '08:00'}" required>
                </div>
                <div class="col">
                    <label for="classEndTime" class="form-label">End Time</label>
                    <input type="time" class="form-control" id="classEndTime" value="${cls?.endTime?.substring(0, 5) || '09:00'}" required>
                </div>
            </div>
            <div class="mb-3">
                <label for="classPrice" class="form-label">Price ($)</label>
                <input type="number" step="0.01" class="form-control" id="classPrice" value="${cls?.price || 0}" required>
            </div>
            <div class="mb-3">
                <label for="classTrainer" class="form-label">Trainer</label>
                <select class="form-select" id="classTrainer" required>
                    ${trainers.map(trainer => `
                        <option value="${trainer.id}" ${cls?.trainerId === trainer.id ? 'selected' : ''}>
                            ${trainer.name}
                        </option>
                    `).join('')}
                </select>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                <button type="submit" class="btn btn-primary">Save</button>
            </div>
        </form>`;
}
 */

// Handle form submission
async function handleClassFormSubmit(event) {
    event.preventDefault();
    
    const classId = document.getElementById("classId").value;
    const isEdit = !!classId;
    
    // Parse time values properly
    const startTimeValue = document.getElementById("classStartTime").value;
    const endTimeValue = document.getElementById("classEndTime").value;
    
    // Convert time strings to format "HH:mm:ss"
    const startTime = `${startTimeValue}:00`;
    const endTime = `${endTimeValue}:00`;
    
    const classData = {
        id: classId ? parseInt(classId) : 0,
        name: document.getElementById("className").value,
        description: document.getElementById("classDescription").value,
        capacity: parseInt(document.getElementById("classCapacity").value),
        daysOfWeek: document.getElementById("classDays").value,
        startTime: startTime,
        endTime: endTime,
        price: parseFloat(document.getElementById("classPrice").value),
        trainerId: parseInt(document.getElementById("classTrainer").value),
        date: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };

    try {
        const url = isEdit 
            ? `https://localhost:7020/api/Class/${classId}` 
            : 'https://localhost:7020/api/Class';
            
        const method = isEdit ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
            method: method,
            headers: {
                ...getAuthHeaders(),
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(classData)
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error("API Error:", errorData);
            throw new Error(`HTTP Error ${response.status}: ${JSON.stringify(errorData)}`);
        }

        // Close modal and refresh list
        bootstrap.Modal.getInstance(document.getElementById('classModal')).hide();
        loadClasses();
        
    } catch (error) {
        console.error("Error saving class:", error);
        alert(`Error saving class: ${error.message}`);
    }
}



async function deleteClass(classId) {
    if (!confirm("Are you sure you want to delete this class? This action cannot be undone.")) {
        return;
    }

    try {
        const response = await fetch(`https://localhost:7020/api/Class/${classId}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });

        if (!response.ok) throw new Error(`HTTP Error ${response.status}`);

        // Refresh the classes list
        loadClasses();
        alert("Class deleted successfully!");
    } catch (error) {
        console.error("Error deleting class:", error);
        alert(`Error deleting class: ${error.message}`);
    }
}  




// ✅ Add Membership Modal (Placeholder)
function openMembershipModal() {
    alert("🛠 Add Membership Form will be here!");
}

// ✅ Add Class Modal (Placeholder)
function openClassModal() {
    alert("🛠 Add Class Form will be here!");
}

//////////
// ✅ Load Trainers
async function loadTrainers() {
    document.getElementById("dashboard-title").innerText = "Trainer Management";
    const content = document.getElementById("admin-content");
    content.innerHTML = "<h4>Loading trainers...</h4>";

    try {
        const response = await fetch("https://localhost:7020/api/Trainer", { 
            headers: getAuthHeaders() 
        });

        if (response.status === 401) {
            alert("❌ Unauthorized! Please log in again.");
            window.location.href = "login.html";
            return;
        }

        if (!response.ok) throw new Error(`HTTP Error ${response.status}`);

        const trainers = await response.json();
        
        content.innerHTML = `
            <button class="btn btn-success mb-3" onclick="showTrainerModal()">
                <i class="fas fa-plus"></i> Add New Trainer
            </button>
            <div class="table-responsive">
                <table class="table table-striped">
                    <thead>
                        <tr>
                            <th>Image</th>
                            <th>Name</th>
                            <th>Description</th>
                            <th>Social Media</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${trainers.map(trainer => `
                            <tr>
                                <td>
                                    ${trainer.image ? `<img src="data:image/jpeg;base64,${trainer.image}" class="trainer-thumbnail" alt="${trainer.name}">` : 'No Image'}
                                </td>
                                <td>${trainer.name || 'N/A'}</td>
                                <td>${trainer.description || 'N/A'}</td>
                                <td class="social-icons">
                                    ${trainer.snapchatUrl ? `<a href="${trainer.snapchatUrl}" target="_blank"><i class="fab fa-snapchat"></i></a>` : ''}
                                    ${trainer.instagramUrl ? `<a href="${trainer.instagramUrl}" target="_blank"><i class="fab fa-instagram"></i></a>` : ''}
                                    ${trainer.twitterUrl ? `<a href="${trainer.twitterUrl}" target="_blank"><i class="fab fa-twitter"></i></a>` : ''}
                                </td>
                                <td>
                                    <button class="btn btn-sm btn-warning me-2" onclick="showTrainerModal('${trainer.id}')">
                                        <i class="fas fa-edit"></i> Edit
                                    </button>
                                    <button class="btn btn-sm btn-danger" onclick="deleteTrainer('${trainer.id}')">
                                        <i class="fas fa-trash"></i> Delete
                                    </button>
                                </td>
                            </tr>`).join('')}
                    </tbody>
                </table>
            </div>
            <!-- Trainer Modal -->
            <div class="modal fade" id="trainerModal" tabindex="-1" aria-hidden="true">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title" id="trainerModalTitle">Add New Trainer</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div class="modal-body" id="trainerModalBody">
                            <!-- Form will be loaded here -->
                        </div>
                    </div>
                </div>
            </div>`;
    } catch (error) {
        console.error("❌ Error loading trainers:", error);
        content.innerHTML = `<div class='alert alert-danger'>Error loading trainers: ${error.message}</div>`;
    }
}

// Show modal for adding/editing trainer
async function showTrainerModal(trainerId = null) {
    const modalTitle = document.getElementById("trainerModalTitle");
    const modalBody = document.getElementById("trainerModalBody");
    const modal = new bootstrap.Modal(document.getElementById('trainerModal'));
    
    if (trainerId) {
        // Edit mode
        modalTitle.textContent = "Edit Trainer";
        try {
            const response = await fetch(`https://localhost:7020/api/Trainer/${trainerId}`, {
                headers: getAuthHeaders()
            });
            const trainer = await response.json();
            
            modalBody.innerHTML = getTrainerForm(trainer);
        } catch (error) {
            console.error("Error loading trainer:", error);
            modalBody.innerHTML = `<div class="alert alert-danger">Error loading trainer: ${error.message}</div>`;
        }
    } else {
        // Add mode
        modalTitle.textContent = "Add New Trainer";
        modalBody.innerHTML = getTrainerForm();
    }
    
    modal.show();
}

// Return HTML form for trainer
function getTrainerForm(trainer = null) {
    return `
        <form id="trainerForm" onsubmit="handleTrainerFormSubmit(event)" enctype="multipart/form-data">
            <input type="hidden" id="trainerId" value="${trainer?.id || ''}">
            <div class="row">
                <div class="col-md-6">
                    <div class="mb-3">
                        <label for="trainerName" class="form-label">Name</label>
                        <input type="text" class="form-control" id="trainerName" value="${trainer?.name || ''}" required>
                    </div>
                    <div class="mb-3">
                        <label for="trainerDescription" class="form-label">Description</label>
                        <textarea class="form-control" id="trainerDescription" rows="3">${trainer?.description || ''}</textarea>
                    </div>
                    <div class="mb-3">
                        <label for="trainerSnapchat" class="form-label">Snapchat URL</label>
                        <input type="url" class="form-control" id="trainerSnapchat" value="${trainer?.snapchatUrl || ''}">
                    </div>
                    <div class="mb-3">
                        <label for="trainerInstagram" class="form-label">Instagram URL</label>
                        <input type="url" class="form-control" id="trainerInstagram" value="${trainer?.instagramUrl || ''}">
                    </div>
                    <div class="mb-3">
                        <label for="trainerTwitter" class="form-label">Twitter URL</label>
                        <input type="url" class="form-control" id="trainerTwitter" value="${trainer?.twitterUrl || ''}">
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="mb-3">
                        <label for="trainerImage" class="form-label">Profile Image</label>
                        <input class="form-control" type="file" id="trainerImage" accept="image/*">
                        ${trainer?.image ? `
                            <div class="mt-2">
                                <img src="data:image/jpeg;base64,${trainer.image}" class="img-thumbnail" style="max-height: 200px;">
                                <p class="text-muted small mt-1">Current image</p>
                            </div>
                        ` : ''}
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                <button type="submit" class="btn btn-primary">Save</button>
            </div>
        </form>`;
}

// Handle form submission
async function handleTrainerFormSubmit(event) {
    event.preventDefault();
    
    const trainerId = document.getElementById("trainerId").value;
    const isEdit = !!trainerId;
    
    const formData = new FormData();
    formData.append('Name', document.getElementById("trainerName").value);
    formData.append('Description', document.getElementById("trainerDescription").value);
    formData.append('SnapchatUrl', document.getElementById("trainerSnapchat").value);
    formData.append('InstagramUrl', document.getElementById("trainerInstagram").value);
    formData.append('TwitterUrl', document.getElementById("trainerTwitter").value);
    
    const imageInput = document.getElementById("trainerImage");
    if (imageInput.files.length > 0) {
        formData.append('ImageFile', imageInput.files[0]);
    }

    try {
        const url = isEdit 
            ? `https://localhost:7020/api/Trainer/${trainerId}` 
            : 'https://localhost:7020/api/Trainer';
            
        const method = isEdit ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
            method: method,
            headers: {
                'Authorization': `Bearer ${localStorage.getItem("authToken")}`
                // Don't set Content-Type - the browser will set it with the correct boundary
            },
            body: formData
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error("API Error:", errorData);
            throw new Error(`HTTP Error ${response.status}: ${JSON.stringify(errorData)}`);
        }

        // Close modal and refresh list
        bootstrap.Modal.getInstance(document.getElementById('trainerModal')).hide();
        loadTrainers();
        
    } catch (error) {
        console.error("Error saving trainer:", error);
        alert(`Error saving trainer: ${error.message}`);
    }
}

// Delete trainer
async function deleteTrainer(trainerId) {
    if (!confirm("Are you sure you want to delete this trainer? This action cannot be undone.")) {
        return;
    }

    try {
        const response = await fetch(`https://localhost:7020/api/Trainer/${trainerId}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });

        if (!response.ok) throw new Error(`HTTP Error ${response.status}`);

        // Refresh the trainers list
        loadTrainers();
        alert("Trainer deleted successfully!");
    } catch (error) {
        console.error("Error deleting trainer:", error);
        alert(`Error deleting trainer: ${error.message}`);
    }
}

////

// ✅ Load Online Sessions
async function loadOnlineSessions() {
    document.getElementById("dashboard-title").innerText = "Online Sessions Management";
    const content = document.getElementById("admin-content");
    content.innerHTML = "<h4>Loading online sessions...</h4>";

    try {
        const response = await fetch("https://localhost:7020/api/OnlineSession", { 
            headers: getAuthHeaders() 
        });

        if (response.status === 401) {
            alert("❌ Unauthorized! Please log in again.");
            window.location.href = "login.html";
            return;
        }

        if (!response.ok) throw new Error(`HTTP Error ${response.status}`);

        const sessions = await response.json();
        
        content.innerHTML = `
            <button class="btn btn-success mb-3" onclick="showSessionModal()">
                <i class="fas fa-plus"></i> Add New Session
            </button>
            <div class="table-responsive">
                <table class="table table-striped">
                    <thead>
                        <tr>
                            <th>Title</th>
                            <th>Trainer</th>
                            <th>Date & Time</th>
                            <th>Price</th>
                            <th>Meeting Link</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${sessions.map(session => `
                            <tr>
                                <td>${session.title || 'N/A'}</td>
                                <td>${session.trainerName || 'N/A'}</td>
                                <td>${formatDateTime(session.sessionDateTime)}</td>
                                <td>$${session.price?.toFixed(2) || '0.00'}</td>
                                <td>
                                    <a href="${session.meetingLink}" target="_blank" class="btn btn-sm btn-info">
                                        <i class="fas fa-external-link-alt"></i> Join
                                    </a>
                                </td>
                                <td>
                                    <button class="btn btn-sm btn-warning me-2" onclick="showSessionModal(${session.id})">
                                        <i class="fas fa-edit"></i> Edit
                                    </button>
                                    <button class="btn btn-sm btn-danger" onclick="deleteSession(${session.id})">
                                        <i class="fas fa-trash"></i> Delete
                                    </button>
                                </td>
                            </tr>`).join('')}
                    </tbody>
                </table>
            </div>
            <!-- Session Modal -->
            <div class="modal fade" id="sessionModal" tabindex="-1" aria-hidden="true">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title" id="sessionModalTitle">Add New Session</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div class="modal-body" id="sessionModalBody">
                            <!-- Form will be loaded here -->
                        </div>
                    </div>
                </div>
            </div>`;
    } catch (error) {
        console.error("❌ Error loading online sessions:", error);
        content.innerHTML = `<div class='alert alert-danger'>Error loading online sessions: ${error.message}</div>`;
    }
}

// Format date and time for display
function formatDateTime(dateTimeString) {
    const date = new Date(dateTimeString);
    return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Show modal for adding/editing session
async function showSessionModal(sessionId = null) {
    const modalTitle = document.getElementById("sessionModalTitle");
    const modalBody = document.getElementById("sessionModalBody");
    const modal = new bootstrap.Modal(document.getElementById('sessionModal'));
    
    // First load trainers for the dropdown
    try {
        const trainersResponse = await fetch("https://localhost:7020/api/Trainer", {
            headers: getAuthHeaders()
        });
        const trainers = await trainersResponse.json();

        if (sessionId) {
            // Edit mode
            modalTitle.textContent = "Edit Session";
            try {
                const sessionResponse = await fetch(`https://localhost:7020/api/OnlineSession/${sessionId}`, {
                    headers: getAuthHeaders()
                });
                const session = await sessionResponse.json();
                
                modalBody.innerHTML = getSessionForm(session, trainers);
            } catch (error) {
                console.error("Error loading session:", error);
                modalBody.innerHTML = `<div class="alert alert-danger">Error loading session: ${error.message}</div>`;
            }
        } else {
            // Add mode
            modalTitle.textContent = "Add New Session";
            modalBody.innerHTML = getSessionForm(null, trainers);
        }
        
        modal.show();
    } catch (error) {
        console.error("Error loading trainers:", error);
        modalBody.innerHTML = `<div class="alert alert-danger">Error loading trainers: ${error.message}</div>`;
    }
}

// Return HTML form for session
function getSessionForm(session = null, trainers = []) {
    const sessionDateTime = session?.sessionDateTime 
        ? new Date(session.sessionDateTime).toISOString().slice(0, 16) 
        : new Date().toISOString().slice(0, 16);
    
    return `
        <form id="sessionForm" onsubmit="handleSessionFormSubmit(event)" novalidate>
            <input type="hidden" id="sessionId" value="${session?.id || ''}">
            <div class="row">
                <div class="col-md-6">
                    <div class="mb-3">
                        <label for="sessionTitle" class="form-label">Title *</label>
                        <input type="text" class="form-control" id="sessionTitle" 
                               value="${session?.title || ''}" required minlength="3">
                        <div class="invalid-feedback">Please provide a title (at least 3 characters)</div>
                    </div>
                    <div class="mb-3">
                        <label for="sessionDescription" class="form-label">Description</label>
                        <textarea class="form-control" id="sessionDescription" rows="3">${session?.description || ''}</textarea>
                    </div>
                    <div class="mb-3">
            <label for="sessionTrainer" class="form-label">Trainer *</label>
            <select class="form-select" id="sessionTrainer" required>
                <option value="">-- Select Trainer --</option>
                ${trainers.map(trainer => `
                    <option value="${trainer.id}" ${session?.trainerId === trainer.id ? 'selected' : ''}>
                        ${trainer.name}
                    </option>
                `).join('')}
            </select>
            <div class="invalid-feedback">Please select a trainer</div>
        </div>
                </div>
                <div class="col-md-6">
                    <div class="mb-3">
                        <label for="sessionDateTime" class="form-label">Date & Time *</label>
                        <input type="datetime-local" class="form-control" id="sessionDateTime" 
                               value="${sessionDateTime}" required>
                        <div class="invalid-feedback">Please select a valid date and time</div>
                    </div>
                    <div class="mb-3">
                        <label for="sessionPrice" class="form-label">Price ($) *</label>
                        <input type="number" step="0.01" min="0" class="form-control" id="sessionPrice" 
                               value="${session?.price || 0}" required>
                        <div class="invalid-feedback">Please enter a valid price</div>
                    </div>
                    <div class="mb-3">
                        <label for="sessionLink" class="form-label">Meeting Link *</label>
                        <input type="url" class="form-control" id="sessionLink" 
                               value="${session?.meetingLink || ''}" required>
                        <div class="invalid-feedback">Please enter a valid URL</div>
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                <button type="submit" class="btn btn-primary">Save</button>
            </div>
        </form>
        <script>
            // Client-side form validation
            document.getElementById('sessionForm').addEventListener('submit', function(event) {
                const form = event.target;
                if (!form.checkValidity()) {
                    event.preventDefault();
                    event.stopPropagation();
                }
                form.classList.add('was-validated');
            });
        </script>`;
}


// Handle form submission
async function handleSessionFormSubmit(event) {
    event.preventDefault();
    
    const sessionId = document.getElementById("sessionId").value;
    const isEdit = !!sessionId;
    
    // Prepare the session data object
    const sessionData = {
        ...(isEdit && { id: parseInt(sessionId) }),
        title: document.getElementById("sessionTitle").value,
        description: document.getElementById("sessionDescription").value,
        trainerId: parseInt(document.getElementById("sessionTrainer").value),
        sessionDateTime: new Date(document.getElementById("sessionDateTime").value).toISOString(),
        price: parseFloat(document.getElementById("sessionPrice").value),
        meetingLink: document.getElementById("sessionLink").value
    };

    try {
        const url = isEdit 
            ? `https://localhost:7020/api/OnlineSession/${sessionId}` 
            : 'https://localhost:7020/api/OnlineSession';
            
        const method = isEdit ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
            method: method,
            headers: {
                ...getAuthHeaders(),
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(sessionData)
        });

        if (!response.ok) {
            const errorResponse = await response.json();
            console.error("Validation errors:", errorResponse);
            
            let errorMessage = "Validation failed:";
            if (errorResponse.errors) {
                for (const [field, errors] of Object.entries(errorResponse.errors)) {
                    errorMessage += `\n${field}: ${errors.join(', ')}`;
                }
            } else {
                errorMessage = errorResponse.title || errorResponse.message || 'Failed to save session';
            }
            
            throw new Error(errorMessage);
        }

        // Close modal and refresh list
        bootstrap.Modal.getInstance(document.getElementById('sessionModal')).hide();
        await loadOnlineSessions();
        showToast('Session saved successfully!', 'success');
        
    } catch (error) {
        console.error("Error saving session:", error);
        showToast(`Error saving session: ${error.message}`, 'danger');
        
        // Highlight invalid fields
        if (error.message.includes("Trainer")) {
            const trainerField = document.getElementById("sessionTrainer");
            trainerField.classList.add('is-invalid');
            trainerField.nextElementSibling.textContent = "Please select a valid trainer";
        }
    }
}



// Delete session
async function deleteSession(sessionId) {
    if (!confirm("Are you sure you want to delete this session? This action cannot be undone.")) {
        return;
    }

    try {
        const response = await fetch(`https://localhost:7020/api/OnlineSession/${sessionId}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.title || errorData.message || 'Failed to delete session');
        }

        // Refresh the sessions list
        await loadOnlineSessions();
        showToast('Session deleted successfully!', 'success');
    } catch (error) {
        console.error("Error deleting session:", error);
        showToast(`Error deleting session: ${error.message}`, 'danger');
    }
}

// Helper function for toast notifications
function showToast(message, type = 'info') {
    const toastContainer = document.getElementById('toast-container') || document.createElement('div');
    toastContainer.id = 'toast-container';
    toastContainer.style.position = 'fixed';
    toastContainer.style.top = '20px';
    toastContainer.style.right = '20px';
    toastContainer.style.zIndex = '9999';
    document.body.appendChild(toastContainer);

    const toast = document.createElement('div');
    toast.className = `toast show align-items-center text-white bg-${type} border-0`;
    toast.role = 'alert';
    toast.innerHTML = `
        <div class="d-flex">
            <div class="toast-body">${message}</div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
        </div>
    `;
    toastContainer.appendChild(toast);

    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}


// ✅ Load Contact Inquiries
async function loadContactInquiries() {
    document.getElementById("dashboard-title").innerText = "Contact Inquiries";
    const content = document.getElementById("admin-content");
    content.innerHTML = "<h4>Loading inquiries...</h4>";

    try {
        const response = await fetch("https://localhost:7020/api/Contact", { 
            headers: getAuthHeaders() 
        });

        if (response.status === 401) {
            alert("❌ Unauthorized! Please log in again.");
            window.location.href = "login.html";
            return;
        }

        if (!response.ok) throw new Error(`HTTP Error ${response.status}`);

        const inquiries = await response.json();
        
        content.innerHTML = `
            <div class="card mb-4">
                <div class="card-header bg-primary text-white">
                    <i class="fas fa-envelope me-2"></i> Customer Inquiries
                </div>
                <div class="card-body p-0">
                    <div class="table-responsive">
                        <table class="table table-hover mb-0">
                            <thead class="bg-light">
                                <tr>
                                    <th>Date</th>
                                    <th>Name</th>
                                    <th>Email</th>
                                    <th>Message</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${inquiries.map(inquiry => `
                                    <tr>
                                        <td>${formatDate(inquiry.inquiryDate)}</td>
                                        <td>${inquiry.name}</td>
                                        <td><a href="mailto:${inquiry.email}">${inquiry.email}</a></td>
                                        <td class="inquiry-message">${truncateText(inquiry.message, 50)}</td>
                                        <td>
                                            <button class="btn btn-sm btn-info me-2" onclick="viewInquiryDetails(${inquiry.id})">
                                                <i class="fas fa-eye"></i> View
                                            </button>
                                            <button class="btn btn-sm btn-danger" onclick="deleteInquiry(${inquiry.id})">
                                                <i class="fas fa-trash"></i> Delete
                                            </button>
                                        </td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
            
            <!-- Inquiry Details Modal -->
            <div class="modal fade" id="inquiryModal" tabindex="-1" aria-hidden="true">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header bg-primary text-white">
                            <h5 class="modal-title" id="inquiryModalTitle">Inquiry Details</h5>
                            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div class="modal-body" id="inquiryModalBody">
                            <!-- Details will be loaded here -->
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                            <button type="button" class="btn btn-primary" id="replyToInquiryBtn">
                                <i class="fas fa-reply me-1"></i> Reply via Email
                            </button>
                        </div>
                    </div>
                </div>
            </div>`;
    } catch (error) {
        console.error("❌ Error loading inquiries:", error);
        content.innerHTML = `<div class='alert alert-danger'>Error loading inquiries: ${error.message}</div>`;
    }
}

// View full inquiry details
async function viewInquiryDetails(inquiryId) {
    try {
        const response = await fetch(`https://localhost:7020/api/Contact/${inquiryId}`, {
            headers: getAuthHeaders()
        });
        const inquiry = await response.json();

        const modal = new bootstrap.Modal(document.getElementById('inquiryModal'));
        document.getElementById('inquiryModalTitle').textContent = `Inquiry from ${inquiry.name}`;
        document.getElementById('inquiryModalBody').innerHTML = `
            <div class="row mb-3">
                <div class="col-md-6">
                    <h6><i class="fas fa-user me-2"></i> Contact Information</h6>
                    <ul class="list-unstyled">
                        <li><strong>Name:</strong> ${inquiry.name}</li>
                        <li><strong>Email:</strong> <a href="mailto:${inquiry.email}">${inquiry.email}</a></li>
                        <li><strong>Date:</strong> ${formatDateTime(inquiry.inquiryDate)}</li>
                    </ul>
                </div>
                <div class="col-md-6">
                    <h6><i class="fas fa-info-circle me-2"></i> Inquiry Details</h6>
                    <div class="card">
                        <div class="card-body">
                            <p class="card-text">${inquiry.message.replace(/\n/g, '<br>')}</p>
                        </div>
                    </div>
                </div>
            </div>
            <div class="response-section mt-4">
                <h6><i class="fas fa-reply me-2"></i> Response</h6>
                <textarea class="form-control" id="responseText" rows="4" placeholder="Type your response here..."></textarea>
            </div>`;

        // Set up reply button
        document.getElementById('replyToInquiryBtn').onclick = () => {
            const responseText = document.getElementById('responseText').value;
            if (responseText.trim()) {
                sendEmailResponse(inquiry.email, `Re: Your inquiry to Elite Studio`, responseText);
            } else {
                alert('Please enter a response message');
            }
        };

        modal.show();
    } catch (error) {
        console.error("Error loading inquiry details:", error);
        alert(`Error loading inquiry: ${error.message}`);
    }
}

// Delete inquiry
async function deleteInquiry(inquiryId) {
    if (!confirm("Are you sure you want to delete this inquiry?")) return;

    try {
        const response = await fetch(`https://localhost:7020/api/Contact/${inquiryId}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });

        if (!response.ok) throw new Error(`HTTP Error ${response.status}`);

        loadContactInquiries();
        alert("Inquiry deleted successfully!");
    } catch (error) {
        console.error("Error deleting inquiry:", error);
        alert(`Error deleting inquiry: ${error.message}`);
    }
}

// Helper function to send email response
function sendEmailResponse(to, subject, body) {
    const mailtoLink = `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailtoLink;
}

// Helper function to format date
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

// Helper function to format date and time
function formatDateTime(dateString) {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Helper function to truncate text
function truncateText(text, maxLength) {
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
}


// ✅ Load Schedules
async function loadSchedules() {
    document.getElementById("dashboard-title").innerText = "Class Schedules";
    const content = document.getElementById("admin-content");
    content.innerHTML = "<h4>Loading schedules...</h4>";

    try {
        const response = await fetch("https://localhost:7020/api/Schedule", { 
            headers: getAuthHeaders() 
        });

        if (response.status === 401) {
            alert("❌ Unauthorized! Please log in again.");
            window.location.href = "login.html";
            return;
        }

        if (!response.ok) throw new Error(`HTTP Error ${response.status}`);

        const schedules = await response.json();
        
        content.innerHTML = `
            <div class="row mb-3">
                <div class="col-md-6">
                    <button class="btn btn-success" onclick="showScheduleModal()">
                        <i class="fas fa-plus"></i> Add New Schedule
                    </button>
                </div>
                <div class="col-md-6">
                    <div class="input-group">
                        <input type="date" id="scheduleFilterDate" class="form-control">
                        <button class="btn btn-primary" onclick="filterSchedules()">
                            <i class="fas fa-filter"></i> Filter
                        </button>
                        <button class="btn btn-secondary" onclick="clearScheduleFilter()">
                            <i class="fas fa-times"></i> Clear
                        </button>
                    </div>
                </div>
            </div>
            <div class="table-responsive">
                <table class="table table-striped">
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Time</th>
                            <th>Class</th>
                            <th>Trainer</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody id="schedulesTableBody">
                        ${schedules.map(schedule => `
                            <tr>
                                <td>${formatDate(schedule.scheduleDate)}</td>
                                <td>${schedule.startTime} - ${schedule.endTime}</td>
                                <td>${schedule.className || 'N/A'}</td>
                                <td>${schedule.trainerName || 'N/A'}</td>
                                <td>
                                    <button class="btn btn-sm btn-warning me-2" onclick="showScheduleModal('${schedule.id}')">
                                        <i class="fas fa-edit"></i> Edit
                                    </button>
                                    <button class="btn btn-sm btn-danger" onclick="deleteSchedule('${schedule.id}')">
                                        <i class="fas fa-trash"></i> Delete
                                    </button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
            
            <!-- Schedule Modal -->
            <div class="modal fade" id="scheduleModal" tabindex="-1" aria-hidden="true">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title" id="scheduleModalTitle">Add New Schedule</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div class="modal-body" id="scheduleModalBody">
                            <!-- Form will be loaded here -->
                        </div>
                    </div>
                </div>
            </div>`;
    } catch (error) {
        console.error("❌ Error loading schedules:", error);
        content.innerHTML = `<div class='alert alert-danger'>Error loading schedules: ${error.message}</div>`;
    }
}

// Show modal for adding/editing schedule
async function showScheduleModal(scheduleId = null) {
    const modalTitle = document.getElementById("scheduleModalTitle");
    const modalBody = document.getElementById("scheduleModalBody");
    const modal = new bootstrap.Modal(document.getElementById('scheduleModal'));
    
    try {
        // Load classes for dropdown
        const classesResponse = await fetch("https://localhost:7020/api/Class", {
            headers: getAuthHeaders()
        });
        const classes = await classesResponse.json();

        if (scheduleId) {
            // Edit mode
            modalTitle.textContent = "Edit Schedule";
            const scheduleResponse = await fetch(`https://localhost:7020/api/Schedule/${scheduleId}`, {
                headers: getAuthHeaders()
            });
            const schedule = await scheduleResponse.json();
            
            modalBody.innerHTML = getScheduleForm(schedule, classes);
        } else {
            // Add mode
            modalTitle.textContent = "Add New Schedule";
            modalBody.innerHTML = getScheduleForm(null, classes);
        }
        
        modal.show();
    } catch (error) {
        console.error("Error:", error);
        modalBody.innerHTML = `<div class="alert alert-danger">Error: ${error.message}</div>`;
    }
}

// Return HTML form for schedule
function getScheduleForm(schedule = null, classes = []) {
    const scheduleDate = schedule?.scheduleDate 
        ? new Date(schedule.scheduleDate).toISOString().split('T')[0] 
        : new Date().toISOString().split('T')[0];
    
    const startTime = schedule?.startTime 
        ? schedule.startTime.substring(0, 5) 
        : '08:00';
        
    const endTime = schedule?.endTime 
        ? schedule.endTime.substring(0, 5) 
        : '09:00';

    return `
        <form id="scheduleForm" onsubmit="handleScheduleFormSubmit(event)">
            <input type="hidden" id="scheduleId" value="${schedule?.id || ''}">
            <div class="row">
                <div class="col-md-6">
                    <div class="mb-3">
                        <label for="scheduleClass" class="form-label">Class</label>
                        <select class="form-select" id="scheduleClass" required>
                            ${classes.map(cls => `
                                <option value="${cls.id}" ${schedule?.classId === cls.id ? 'selected' : ''}>
                                    ${cls.name} (${cls.trainerName})
                                </option>
                            `).join('')}
                        </select>
                    </div>
                    <div class="mb-3">
                        <label for="scheduleDate" class="form-label">Date</label>
                        <input type="date" class="form-control" id="scheduleDate" 
                               value="${scheduleDate}" required>
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="mb-3">
                        <label for="scheduleStartTime" class="form-label">Start Time</label>
                        <input type="time" class="form-control" id="scheduleStartTime" 
                               value="${startTime}" required>
                    </div>
                    <div class="mb-3">
                        <label for="scheduleEndTime" class="form-label">End Time</label>
                        <input type="time" class="form-control" id="scheduleEndTime" 
                               value="${endTime}" required>
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                <button type="submit" class="btn btn-primary">Save</button>
            </div>
        </form>`;
}

// Handle form submission
async function handleScheduleFormSubmit(event) {
    event.preventDefault();
    
    const scheduleId = document.getElementById("scheduleId").value;
    const isEdit = !!scheduleId;
    
    const scheduleData = {
        id: scheduleId ? parseInt(scheduleId) : 0,
        classId: parseInt(document.getElementById("scheduleClass").value),
        scheduleDate: document.getElementById("scheduleDate").value,
        startTime: document.getElementById("scheduleStartTime").value + ":00",
        endTime: document.getElementById("scheduleEndTime").value + ":00"
    };

    try {
        const url = isEdit 
            ? `https://localhost:7020/api/Schedule/${scheduleId}` 
            : 'https://localhost:7020/api/Schedule';
            
        const method = isEdit ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
            method: method,
            headers: {
                ...getAuthHeaders(),
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(scheduleData)
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error("API Error:", errorData);
            throw new Error(`HTTP Error ${response.status}: ${JSON.stringify(errorData)}`);
        }

        // Close modal and refresh list
        bootstrap.Modal.getInstance(document.getElementById('scheduleModal')).hide();
        loadSchedules();
        
    } catch (error) {
        console.error("Error saving schedule:", error);
        alert(`Error saving schedule: ${error.message}`);
    }
}

// Delete schedule
async function deleteSchedule(scheduleId) {
    if (!confirm("Are you sure you want to delete this schedule?")) return;

    try {
        const response = await fetch(`https://localhost:7020/api/Schedule/${scheduleId}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });

        if (!response.ok) throw new Error(`HTTP Error ${response.status}`);

        loadSchedules();
        alert("Schedule deleted successfully!");
    } catch (error) {
        console.error("Error deleting schedule:", error);
        alert(`Error deleting schedule: ${error.message}`);
    }
}

// Filter schedules by date
async function filterSchedules() {
    const dateFilter = document.getElementById("scheduleFilterDate").value;
    if (!dateFilter) return;

    try {
        const response = await fetch(`https://localhost:7020/api/Schedule?date=${dateFilter}`, {
            headers: getAuthHeaders()
        });
        const schedules = await response.json();
        
        document.getElementById("schedulesTableBody").innerHTML = 
            schedules.map(schedule => `
                <tr>
                    <td>${formatDate(schedule.scheduleDate)}</td>
                    <td>${schedule.startTime} - ${schedule.endTime}</td>
                    <td>${schedule.className || 'N/A'}</td>
                    <td>${schedule.trainerName || 'N/A'}</td>
                    <td>
                        <button class="btn btn-sm btn-warning me-2" onclick="showScheduleModal('${schedule.id}')">
                            <i class="fas fa-edit"></i> Edit
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="deleteSchedule('${schedule.id}')">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                    </td>
                </tr>
            `).join('');
    } catch (error) {
        console.error("Error filtering schedules:", error);
        alert(`Error filtering schedules: ${error.message}`);
    }
}

// Clear schedule filter
function clearScheduleFilter() {
    document.getElementById("scheduleFilterDate").value = '';
    loadSchedules();
}

// Helper function to format date
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}


// ✅ Logout Function
function logout() {
    localStorage.removeItem("authToken");
    localStorage.removeItem("userData");
    window.location.href = "login.html";
}
