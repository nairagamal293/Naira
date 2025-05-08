
// ✅ TimeSpan Helper Function (NEW - add this right after constants)
// Update the createTimeSpan function to match API expectations
function createTimeSpan(hours, minutes, seconds = 0) {
    // Return a string in the format "hh:mm:ss" that ASP.NET Core can parse
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
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
    cleanupCharts();
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
                                        <i class="fas fa-level-up-alt"></i> Edit
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



// ✅ Add Membership Modal (Placeholder)
function openMembershipModal() {
    alert("🛠 Add Membership Form will be here!");
}


// ✅ Load Classes
async function loadClasses() {
    document.getElementById("dashboard-title").innerText = "Class Management";
    const content = document.getElementById("admin-content");
    content.innerHTML = "<h4>Loading classes...</h4>";

    try {
        // Load classes and trainers in parallel
        const [classesResponse, trainersResponse] = await Promise.all([
            fetch("https://localhost:7020/api/Class", { 
                headers: getAuthHeaders() 
            }),
            fetch("https://localhost:7020/api/Trainer", { 
                headers: getAuthHeaders() 
            })
        ]);

        if (classesResponse.status === 401 || trainersResponse.status === 401) {
            alert("❌ Unauthorized! Please log in again.");
            window.location.href = "login.html";
            return;
        }

        if (!classesResponse.ok) throw new Error(`HTTP Error ${classesResponse.status}`);
        if (!trainersResponse.ok) throw new Error(`HTTP Error ${trainersResponse.status}`);

        const classes = await classesResponse.json();
        const trainers = await trainersResponse.json();
        
        content.innerHTML = `
            <button class="btn btn-success mb-3" onclick="showClassModal()">
                <i class="fas fa-plus"></i> Add New Class
            </button>
            <div class="table-responsive">
                <table class="table table-striped table-hover">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Description</th>
                            <th>Capacity</th>
                            <th>Duration</th>
                            <th>Price</th>
                            
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${classes.map(cls => `
                            <tr>
                                <td>${cls.name}</td>
                                <td>${cls.description || 'N/A'}</td>
                                <td>${cls.capacity}</td>
                                <td>${cls.durationInMinutes} mins</td>
                                <td>$${cls.price.toFixed(2)}</td>
                                
                                <td>
                                    <button class="btn btn-sm btn-warning me-2" onclick="showClassModal(${cls.id})">
                                        <i class="fas fa-edit"></i> Edit
                                    </button>
                                    <button class="btn btn-sm btn-danger" onclick="deleteClass(${cls.id})">
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
        content.innerHTML = "<div class='alert alert-danger'>Error loading classes.</div>";
    }
}

// Show modal for adding/editing class
async function showClassModal(classId = null) {
    const modalTitle = document.getElementById("classModalTitle");
    const modalBody = document.getElementById("classModalBody");
    const modal = new bootstrap.Modal(document.getElementById('classModal'));
    
    try {
        // Load trainers for dropdown
        const trainersResponse = await fetch("https://localhost:7020/api/Trainer", {
            headers: getAuthHeaders()
        });
        
        if (!trainersResponse.ok) throw new Error(`HTTP Error ${trainersResponse.status}`);
        const trainers = await trainersResponse.json();

        if (classId) {
            // Edit mode
            modalTitle.textContent = "Edit Class";
            const classResponse = await fetch(`https://localhost:7020/api/Class/${classId}`, {
                headers: getAuthHeaders()
            });
            
            if (!classResponse.ok) throw new Error(`HTTP Error ${classResponse.status}`);
            const classData = await classResponse.json();
            
            modalBody.innerHTML = getClassForm(classData, trainers);
        } else {
            // Add mode
            modalTitle.textContent = "Add New Class";
            modalBody.innerHTML = getClassForm(null, trainers);
        }
        
        modal.show();
    } catch (error) {
        console.error("Error:", error);
        modalBody.innerHTML = `<div class="alert alert-danger">Error: ${error.message}</div>`;
    }
}

// Return HTML form for class
// In your dashboard.js, update the getClassForm function:
function getClassForm(classData = null) {
    return `
        <form id="classForm" onsubmit="handleClassFormSubmit(event)">
            <input type="hidden" id="classId" value="${classData?.id || ''}">
            <div class="mb-3">
                <label for="className" class="form-label">Class Name *</label>
                <input type="text" class="form-control" id="className" 
                       value="${classData?.name || ''}" required minlength="3" maxlength="100">
            </div>
            <div class="mb-3">
                <label for="classDescription" class="form-label">Description</label>
                <textarea class="form-control" id="classDescription" rows="3">${classData?.description || ''}</textarea>
            </div>
            <div class="row">
                <div class="col-md-4 mb-3">
                    <label for="classCapacity" class="form-label">Capacity *</label>
                    <input type="number" class="form-control" id="classCapacity" 
                           value="${classData?.capacity || 10}" min="1" max="100" required>
                </div>
                <div class="col-md-4 mb-3">
                    <label for="classDuration" class="form-label">Duration (minutes) *</label>
                    <input type="number" class="form-control" id="classDuration" 
                           value="${classData?.durationInMinutes || 60}" min="1" max="480" required>
                </div>
                <div class="col-md-4 mb-3">
                    <label for="classPrice" class="form-label">Price ($) *</label>
                    <input type="number" step="0.01" class="form-control" id="classPrice" 
                           value="${classData?.price || 0}" min="0" max="1000" required>
                </div>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                <button type="submit" class="btn btn-primary">Save</button>
            </div>
        </form>`;
}

// Handle class form submission
async function handleClassFormSubmit(event) {
    event.preventDefault();
    
    const classId = document.getElementById("classId").value;
    const isEdit = !!classId;
    
    const classData = {
        name: document.getElementById("className").value,
        description: document.getElementById("classDescription").value,
        capacity: parseInt(document.getElementById("classCapacity").value),
        durationInMinutes: parseInt(document.getElementById("classDuration").value),
        price: parseFloat(document.getElementById("classPrice").value)
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
            throw new Error(errorData.title || errorData.message || 'Failed to save class');
        }

        // Close modal and refresh list
        bootstrap.Modal.getInstance(document.getElementById('classModal')).hide();
        loadClasses();
        showToast('Class saved successfully!', 'success');
    } catch (error) {
        console.error("Error saving class:", error);
        showToast(`Error saving class: ${error.message}`, 'danger');
    }
}


// Delete class
async function deleteClass(classId) {
    if (!confirm("Are you sure you want to delete this class? This will also delete all related schedules.")) {
        return;
    }

    try {
        const response = await fetch(`https://localhost:7020/api/Class/${classId}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.title || errorData.message || 'Failed to delete class');
        }

        // Refresh the classes list
        loadClasses();
        showToast('Class deleted successfully!', 'success');
    } catch (error) {
        console.error("Error deleting class:", error);
        showToast(`Error deleting class: ${error.message}`, 'danger');
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
// ✅ Load Online Sessions
async function loadOnlineSessions() {
    document.getElementById("dashboard-title").innerText = "Online Sessions Management";
    const content = document.getElementById("admin-content");
    content.innerHTML = "<h4>Loading online sessions...</h4>";

    try {
        // Load sessions and trainers in parallel
        const [sessionsResponse, trainersResponse] = await Promise.all([
            fetch("https://localhost:7020/api/OnlineSession?includeBookings=true", { 
                headers: getAuthHeaders() 
            }),
            fetch("https://localhost:7020/api/Trainer", { 
                headers: getAuthHeaders() 
            })
        ]);

        if (sessionsResponse.status === 401 || trainersResponse.status === 401) {
            alert("❌ Unauthorized! Please log in again.");
            window.location.href = "login.html";
            return;
        }

        if (!sessionsResponse.ok) throw new Error(`HTTP Error ${sessionsResponse.status}`);
        if (!trainersResponse.ok) throw new Error(`HTTP Error ${trainersResponse.status}`);

        const sessions = await sessionsResponse.json();
        const trainers = await trainersResponse.json();
        
        content.innerHTML = `
            <button class="btn btn-success mb-3" onclick="showSessionModal()">
                <i class="fas fa-plus"></i> Add New Session
            </button>
            <div class="table-responsive">
                <table class="table table-striped table-hover">
                    <thead>
                        <tr>
                            <th>Title</th>
                            <th>Trainer</th>
                            <th>Type</th>
                            <th>Date & Time</th>
                            <th>Capacity</th>
                            <th>Booked</th>
                            <th>Price</th>
                            <th>Zoom Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                    ${sessions.map(session => `
                        <tr>
                            <td>${session.title || 'N/A'}</td>
                            <td>${session.trainerName|| 'N/A'}</td>  
                            <td>
                                <span class="badge ${getSessionTypeBadgeClass(session.sessionType)}">
                                    ${getSessionTypeName(session.sessionType)}
                                </span>
                            </td>
                            <td>${formatDateTime(session.sessionDateTime)}</td>
                            <td>${session.capacity}</td>
                            <td>${session.bookedCount || 0}</td>
                            <td>$${session.price?.toFixed(2) || '0.00'}</td>
                            <td>
                                <span class="badge ${session.zoomMeetingCreated ? 'bg-success' : 'bg-warning'}">
                                    ${session.zoomMeetingCreated ? 'Created' : 'Pending'}
                                </span>
                            </td>
                            <td>
                                    <div class="btn-group" role="group">
                                        <button class="btn btn-sm btn-warning me-2" onclick="showSessionModal(${session.id})">
                                            <i class="fas fa-edit"></i> Edit
                                        </button>
                                        <button class="btn btn-sm btn-danger" onclick="deleteSession(${session.id})">
                                            <i class="fas fa-trash"></i> Delete
                                        </button>
                                        ${!session.zoomMeetingCreated ? `
                                        <button class="btn btn-sm btn-info ms-2" onclick="generateZoomLink(${session.id})">
                                            <i class="fas fa-video"></i> Create Zoom
                                        </button>
                                        ` : ''}
                                    </div>
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

// Helper functions for session types
function getSessionTypeName(type) {
    switch(type) {
        case 0: return '1-on-1';
        case 1: return 'Group';
        case 2: return 'Small Group';
        default: return 'Unknown';
    }
}

function getSessionTypeBadgeClass(type) {
    switch(type) {
        case 0: return 'bg-primary';
        case 1: return 'bg-info text-dark';
        case 2: return 'bg-secondary';
        default: return 'bg-light text-dark';
    }
}

// Show modal for adding/editing session
async function showSessionModal(sessionId = null) {
    const modalTitle = document.getElementById("sessionModalTitle");
    const modalBody = document.getElementById("sessionModalBody");
    const modal = new bootstrap.Modal(document.getElementById('sessionModal'));
    
    try {
        // Load trainers for dropdown
        const trainersResponse = await fetch("https://localhost:7020/api/Trainer", {
            headers: getAuthHeaders()
        });
        
        if (!trainersResponse.ok) throw new Error(`HTTP Error ${trainersResponse.status}`);
        const trainers = await trainersResponse.json();

        if (sessionId) {
            // Edit mode
            modalTitle.textContent = "Edit Session";
            const sessionResponse = await fetch(`https://localhost:7020/api/OnlineSession/${sessionId}`, {
                headers: getAuthHeaders()
            });
            
            if (!sessionResponse.ok) throw new Error(`HTTP Error ${sessionResponse.status}`);
            const session = await sessionResponse.json();
            
            modalBody.innerHTML = getSessionForm(session, trainers);
        } else {
            // Add mode
            modalTitle.textContent = "Add New Session";
            modalBody.innerHTML = getSessionForm(null, trainers);
        }
        
        modal.show();
    } catch (error) {
        console.error("Error:", error);
        modalBody.innerHTML = `<div class="alert alert-danger">Error: ${error.message}</div>`;
    }
}


// Return HTML form for session
function getSessionForm(session = null, trainers = []) {
    const sessionDateTime = session?.sessionDateTime 
        ? new Date(session.sessionDateTime).toISOString().slice(0, 16) 
        : new Date().toISOString().slice(0, 16);
    
    return `
        <form id="sessionForm" onsubmit="handleSessionFormSubmit(event)">
            <input type="hidden" id="sessionId" value="${session?.id || ''}">
            <div class="row">
                <div class="col-md-6">
                    <div class="mb-3">
                        <label for="sessionTitle" class="form-label">Title *</label>
                        <input type="text" class="form-control" id="sessionTitle" 
                               value="${session?.title || ''}" required minlength="3">
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
                                <option value="${trainer.id}" 
                                    ${session?.trainerId === trainer.id ? 'selected' : ''}>
                                    ${trainer.name}
                                </option>
                            `).join('')}
                        </select>
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="mb-3">
                        <label for="sessionDateTime" class="form-label">Date & Time *</label>
                        <input type="datetime-local" class="form-control" id="sessionDateTime" 
                               value="${sessionDateTime}" required>
                    </div>
                    <div class="mb-3">
                        <label for="sessionType" class="form-label">Session Type *</label>
                        <select class="form-select" id="sessionType" required>
                            <option value="0" ${session?.sessionType === 0 ? 'selected' : ''}>One-on-One</option>
                            <option value="1" ${session?.sessionType === 1 ? 'selected' : ''}>Group Class</option>
                            <option value="2" ${session?.sessionType === 2 ? 'selected' : ''}>Small Group</option>
                        </select>
                    </div>
                    <div class="mb-3">
                        <label for="sessionCapacity" class="form-label">Capacity *</label>
                        <input type="number" class="form-control" id="sessionCapacity" 
                               value="${session?.capacity || 1}" min="1" max="50" required>
                        <small class="text-muted">For One-on-One sessions, capacity is always 1</small>
                    </div>
                    <div class="mb-3">
                        <label for="sessionPrice" class="form-label">Price ($) *</label>
                        <input type="number" step="0.01" min="0" class="form-control" id="sessionPrice" 
                               value="${session?.price || 0}" required>
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                <button type="submit" class="btn btn-primary">Save</button>
            </div>
        </form>
        <script>
            // Update capacity based on session type
            document.getElementById('sessionType').addEventListener('change', function() {
                const capacityField = document.getElementById('sessionCapacity');
                if (this.value === '0') {
                    capacityField.value = 1;
                    capacityField.readOnly = true;
                } else {
                    capacityField.readOnly = false;
                    if (this.value === '2') { // Small group
                        capacityField.min = 2;
                        capacityField.max = 6;
                    } else { // Group
                        capacityField.min = 5;
                        capacityField.max = 50;
                    }
                }
            });
            
            // Initialize capacity field based on current type
            const sessionType = document.getElementById('sessionType');
            if (sessionType) {
                sessionType.dispatchEvent(new Event('change'));
            }
        </script>`;
}

// Handle form submission
async function handleSessionFormSubmit(event) {
    event.preventDefault();
    
    const sessionId = document.getElementById("sessionId").value;
    const isEdit = !!sessionId;
    
    const sessionData = {
        title: document.getElementById("sessionTitle").value,
        description: document.getElementById("sessionDescription").value,
        trainerId: parseInt(document.getElementById("sessionTrainer").value),
        sessionDateTime: new Date(document.getElementById("sessionDateTime").value).toISOString(),
        sessionType: parseInt(document.getElementById("sessionType").value),
        capacity: parseInt(document.getElementById("sessionCapacity").value),
        price: parseFloat(document.getElementById("sessionPrice").value),
        zoomMeetingCreated: false // Will be set to true when Zoom link is generated
    };

    // Add this for updates
    if (isEdit) {
        sessionData.id = parseInt(sessionId);
    }

    console.log("Sending data:", sessionData); // Debug log

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
            const errorData = await response.json();
            console.error("Server error:", errorData); // More detailed error logging
            throw new Error(errorData.title || errorData.message || 'Failed to save session');
        }

        // Close modal and refresh list
        bootstrap.Modal.getInstance(document.getElementById('sessionModal')).hide();
        loadOnlineSessions();
        showToast('Session saved successfully!', 'success');
        
    } catch (error) {
        console.error("Error saving session:", error);
        showToast(`Error saving session: ${error.message}`, 'danger');
    }
}


// Generate Zoom meeting link
async function generateZoomLink(sessionId) {
    if (!confirm("Generate a Zoom meeting link for this session?")) return;
    
    try {
        const response = await fetch(`https://localhost:7020/api/OnlineSession/${sessionId}/generate-zoom`, {
            method: 'POST',
            headers: getAuthHeaders()
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.title || errorData.message || 'Failed to generate Zoom link');
        }

        loadOnlineSessions();
        showToast('Zoom meeting created successfully!', 'success');
    } catch (error) {
        console.error("Error generating Zoom link:", error);
        showToast(`Error generating Zoom link: ${error.message}`, 'danger');
    }
}

// Delete session
async function deleteSession(sessionId) {
    if (!confirm("Are you sure you want to delete this session? This will also cancel all bookings.")) {
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

        loadOnlineSessions();
        showToast('Session deleted successfully!', 'success');
    } catch (error) {
        console.error("Error deleting session:", error);
        showToast(`Error deleting session: ${error.message}`, 'danger');
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

//
function loadBookings() {
    document.getElementById("new-booking-badge").style.display = "none";
    setActiveSidebar('Bookings');
    document.getElementById("dashboard-title").textContent = "Manage Bookings";

    document.getElementById("admin-content").innerHTML = `
        <div class="table-responsive">
            <table class="table table-bordered" id="bookingsTable">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>User</th>
                        <th>Type</th>
                        <th>Item</th>
                        <th>Status</th>
                        <th>Payment</th>
                        <th>Date</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody></tbody>
            </table>
        </div>
    `;

    fetchBookings();
}


// Helper function to format date
/* function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
} */



// ✅ Load Schedules
async function loadSchedules() {
    document.getElementById("dashboard-title").innerText = "Schedule Management";
    const content = document.getElementById("admin-content");
    content.innerHTML = "<h4>Loading schedules...</h4>";

    try {
        // Load schedules, classes, and trainers in parallel
        const [schedulesResponse, classesResponse, trainersResponse] = await Promise.all([
            fetch("https://localhost:7020/api/Schedule", { 
                headers: getAuthHeaders() 
            }),
            fetch("https://localhost:7020/api/Class", { 
                headers: getAuthHeaders() 
            }),
            fetch("https://localhost:7020/api/Trainer", { 
                headers: getAuthHeaders() 
            })
        ]);

        if (schedulesResponse.status === 401 || classesResponse.status === 401 || trainersResponse.status === 401) {
            alert("❌ Unauthorized! Please log in again.");
            window.location.href = "login.html";
            return;
        }

        if (!schedulesResponse.ok) throw new Error(`HTTP Error ${schedulesResponse.status}`);
        if (!classesResponse.ok) throw new Error(`HTTP Error ${classesResponse.status}`);
        if (!trainersResponse.ok) throw new Error(`HTTP Error ${trainersResponse.status}`);

        const schedules = await schedulesResponse.json();
        const classes = await classesResponse.json();
        const trainers = await trainersResponse.json();
        
        content.innerHTML = `
    <button class="btn btn-success mb-3" onclick="showScheduleModal()">
        <i class="fas fa-plus"></i> Add New Schedule
    </button>
    <div class="table-responsive">
        <table class="table table-striped table-hover">
            <thead>
                <tr>
                    <th>Date</th>
                    <th>Time</th>
                    <th>Class</th>
                    <th>Trainer</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                ${schedules.map(schedule => `
                    <tr>
                        <td>${formatDate(schedule.scheduleDate)}</td>
                        <td>${formatTime(schedule.startTime)} - ${formatTime(schedule.endTime)}</td>
                        <td>${schedule.className || 'N/A'}</td>
                        <td>${schedule.trainerName || 'N/A'}</td>
                        <td>
                            <button class="btn btn-sm btn-warning me-2" onclick="showScheduleModal(${schedule.id})">
                                <i class="fas fa-edit"></i> Edit
                            </button>
                            <button class="btn btn-sm btn-danger" onclick="deleteSchedule(${schedule.id})">
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
        <div class="modal-dialog">
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
        content.innerHTML = "<div class='alert alert-danger'>Error loading schedules.</div>";
    }
}

// Helper function to format time from TimeSpan
function formatTime(timeSpan) {
    if (!timeSpan) return '';
    
    // Handle string format from API (hh:mm:ss)
    if (typeof timeSpan === 'string') {
        const [hours, minutes] = timeSpan.split(':').map(Number);
        const ampm = hours >= 12 ? 'PM' : 'AM';
        const hours12 = hours % 12 || 12;
        return `${hours12}:${minutes.toString().padStart(2, '0')} ${ampm}`;
    }
    
    // Handle TimeSpan object from API
    if (timeSpan.hours !== undefined) {
        const hours = timeSpan.hours || 0;
        const minutes = timeSpan.minutes || 0;
        const ampm = hours >= 12 ? 'PM' : 'AM';
        const hours12 = hours % 12 || 12;
        return `${hours12}:${minutes.toString().padStart(2, '0')} ${ampm}`;
    }
    
    return '';
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


// Show modal for adding/editing schedule
async function showScheduleModal(scheduleId = null) {
    const modalTitle = document.getElementById("scheduleModalTitle");
    const modalBody = document.getElementById("scheduleModalBody");
    const modal = new bootstrap.Modal(document.getElementById('scheduleModal'));
    
    try {
        // Load both classes and trainers in parallel
        const [classesResponse, trainersResponse] = await Promise.all([
            fetch("https://localhost:7020/api/Class", { headers: getAuthHeaders() }),
            fetch("https://localhost:7020/api/Trainer", { headers: getAuthHeaders() })
        ]);
        
        const classes = await classesResponse.json();
        const trainers = await trainersResponse.json();

        if (scheduleId) {
            // Edit mode - load the specific schedule
            const scheduleResponse = await fetch(`https://localhost:7020/api/Schedule/${scheduleId}`, {
                headers: getAuthHeaders()
            });
            const scheduleData = await scheduleResponse.json();
            
            modalBody.innerHTML = getScheduleForm(scheduleData, classes, trainers);
        } else {
            // Add mode
            modalBody.innerHTML = getScheduleForm(null, classes, trainers);
        }
        
        modal.show();
    } catch (error) {
        console.error("Error:", error);
        modalBody.innerHTML = `<div class="alert alert-danger">Error: ${error.message}</div>`;
    }
}

// Return HTML form for schedule
// In your dashboard.js, update the getScheduleForm function:
function getScheduleForm(schedule = null, classes = [], trainers = []) {
    const scheduleDate = schedule?.scheduleDate 
        ? new Date(schedule.scheduleDate).toISOString().split('T')[0] 
        : new Date().toISOString().split('T')[0];
    
    const startTime = schedule?.startTime 
        ? convertTimeSpanToTimeInput(schedule.startTime)
        : '09:00';
        
    const endTime = schedule?.endTime 
        ? convertTimeSpanToTimeInput(schedule.endTime)
        : '10:00';

    return `
        <form id="scheduleForm" onsubmit="handleScheduleFormSubmit(event)">
            <input type="hidden" id="scheduleId" value="${schedule?.id || ''}">
            <div class="mb-3">
                <label for="scheduleClass" class="form-label">Class *</label>
                <select class="form-select" id="scheduleClass" required>
                    <option value="">-- Select Class --</option>
                    ${classes.map(cls => `
                        <option value="${cls.id}" ${schedule?.classId === cls.id ? 'selected' : ''}>
                            ${cls.name}
                        </option>
                    `).join('')}
                </select>
            </div>
            <div class="mb-3">
                <label for="scheduleTrainer" class="form-label">Trainer *</label>
                <select class="form-select" id="scheduleTrainer" required>
                    <option value="">-- Select Trainer --</option>
                    ${trainers.map(trainer => `
                        <option value="${trainer.id}" ${schedule?.trainerId === trainer.id ? 'selected' : ''}>
                            ${trainer.name}
                        </option>
                    `).join('')}
                </select>
            </div>
            <div class="mb-3">
                <label for="scheduleDate" class="form-label">Date *</label>
                <input type="date" class="form-control" id="scheduleDate" 
                       value="${scheduleDate}" required>
            </div>
            <div class="row">
                <div class="col-md-6 mb-3">
                    <label for="startTime" class="form-label">Start Time *</label>
                    <input type="time" class="form-control" id="startTime" 
                           value="${startTime}" required>
                </div>
                <div class="col-md-6 mb-3">
                    <label for="endTime" class="form-label">End Time *</label>
                    <input type="time" class="form-control" id="endTime" 
                           value="${endTime}" required>
                </div>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                <button type="submit" class="btn btn-primary">Save</button>
            </div>
        </form>`;
}

// Helper function to convert TimeSpan to time input format
function convertTimeSpanToTimeInput(timeSpan) {
    if (typeof timeSpan === 'string') {
        // Handle "hh:mm:ss" format
        const [hours, minutes] = timeSpan.split(':');
        return `${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}`;
    }
    // Handle TimeSpan object if needed
    const hours = timeSpan?.hours || 0;
    const minutes = timeSpan?.minutes || 0;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

async function handleScheduleFormSubmit(event) {
    event.preventDefault();
    
    const scheduleId = document.getElementById("scheduleId").value;
    const isEdit = !!scheduleId;
    
    // Parse time inputs
    const startTimeValue = document.getElementById("startTime").value;
    const endTimeValue = document.getElementById("endTime").value;
    
    const [startHours, startMinutes] = startTimeValue.split(':').map(Number);
    const [endHours, endMinutes] = endTimeValue.split(':').map(Number);
    
    // Create the schedule date object
    const scheduleDate = new Date(document.getElementById("scheduleDate").value);
    
    // Prepare the data object
    const scheduleData = {
        classId: parseInt(document.getElementById("scheduleClass").value),
        trainerId: parseInt(document.getElementById("scheduleTrainer").value),
        scheduleDate: scheduleDate.toISOString(),
        startTime: createTimeSpan(startHours, startMinutes),
        endTime: createTimeSpan(endHours, endMinutes)
    };

    // For updates, include the ID
    if (isEdit) {
        scheduleData.id = parseInt(scheduleId);
    }

    console.log("Sending data:", scheduleData);

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
            let errorMessage = 'Failed to save schedule';
            try {
                const errorData = await response.json();
                errorMessage = errorData.title || errorData.message || JSON.stringify(errorData);
                
                if (errorData.errors) {
                    errorMessage = Object.entries(errorData.errors)
                        .map(([field, errors]) => `${field}: ${errors.join(', ')}`)
                        .join('\n');
                }
            } catch (e) {
                const errorText = await response.text();
                errorMessage = errorText || errorMessage;
            }
            throw new Error(errorMessage);
        }

        // Close modal and refresh list
        bootstrap.Modal.getInstance(document.getElementById('scheduleModal')).hide();
        loadSchedules();
        showToast('Schedule saved successfully!', 'success');
    } catch (error) {
        console.error("Error details:", error);
        showToast(`Error saving schedule: ${error.message}`, 'danger');
    }
}

// Helper function to create TimeSpan string
function createTimeSpan(hours, minutes, seconds = 0) {
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}







// Delete schedule
async function deleteSchedule(scheduleId) {
    if (!confirm("Are you sure you want to delete this schedule? This action cannot be undone.")) {
        return;
    }

    try {
        const response = await fetch(`https://localhost:7020/api/Schedule/${scheduleId}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.title || errorData.message || 'Failed to delete schedule');
        }

        // Refresh the schedules list
        loadSchedules();
        showToast('Schedule deleted successfully!', 'success');
    } catch (error) {
        console.error("Error deleting schedule:", error);
        showToast(`Error deleting schedule: ${error.message}`, 'danger');
    }
}

 ////
// ✅ Load Reports
async function loadReports() {
    cleanupCharts();
    document.getElementById("dashboard-title").innerText = "Reports & Analytics";
    const content = document.getElementById("admin-content");
    
    // Set default date range (last 30 days)
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - 30);
    
    content.innerHTML = `
        <div class="report-filters">
            <h4><i class="fas fa-filter me-2"></i> Filter Reports</h4>
            <div class="row">
                <div class="col-md-5">
                    <label for="reportStartDate" class="form-label">Start Date</label>
                    <input type="date" class="form-control" id="reportStartDate" 
                           value="${startDate.toISOString().split('T')[0]}">
                </div>
                <div class="col-md-5">
                    <label for="reportEndDate" class="form-label">End Date</label>
                    <input type="date" class="form-control" id="reportEndDate" 
                           value="${endDate.toISOString().split('T')[0]}">
                </div>
                <div class="col-md-2 d-flex align-items-end">
                    <button class="btn btn-primary w-100" onclick="generateReports()">
                        <i class="fas fa-sync-alt me-2"></i> Generate
                    </button>
                </div>
            </div>
        </div>
        
        <div id="reportsContainer">
            <div class="text-center py-5">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Loading...</span>
                </div>
                <p class="mt-2">Loading reports...</p>
            </div>
        </div>
    `;
    
    // Load reports with default dates
    generateReports();
}

// ✅ Generate Reports with Selected Dates
async function generateReports() {
    const startDate = document.getElementById("reportStartDate").value;
    const endDate = document.getElementById("reportEndDate").value;
    
    try {
        // Load all reports in parallel
        const [financialReport, bookingReport, attendanceReport] = await Promise.all([
            fetchFinancialReport(startDate, endDate),
            fetchBookingReport(startDate, endDate),
            fetchAttendanceReport(startDate, endDate)
        ]);
        
        renderReports(financialReport, bookingReport, attendanceReport);
    } catch (error) {
        console.error("Error generating reports:", error);
        document.getElementById("reportsContainer").innerHTML = `
            <div class="alert alert-danger">
                <i class="fas fa-exclamation-triangle me-2"></i>
                Error loading reports: ${error.message}
            </div>
        `;
    }
}

// ✅ Cleanup existing charts before creating new ones
function cleanupCharts() {
    // Destroy any existing Chart.js instances to prevent memory leaks
    if (window.revenueChart) {
        window.revenueChart.destroy();
    }
    if (window.bookingTypeChart) {
        window.bookingTypeChart.destroy();
    }
    if (window.attendanceChart) {
        window.attendanceChart.destroy();
    }
}


// ✅ Fetch Financial Report
async function fetchFinancialReport(startDate, endDate) {
    const response = await fetch(`https://localhost:7020/api/Report/financial?startDate=${startDate}&endDate=${endDate}`, {
        headers: getAuthHeaders()
    });
    
    if (!response.ok) {
        throw new Error(`Failed to fetch financial report: ${response.status}`);
    }
    
    return await response.json();
}

// ✅ Fetch Booking Summary Report
async function fetchBookingReport(startDate, endDate) {
    const response = await fetch(`https://localhost:7020/api/Report/bookings/summary?startDate=${startDate}&endDate=${endDate}`, {
        headers: getAuthHeaders()
    });
    
    if (!response.ok) {
        throw new Error(`Failed to fetch booking report: ${response.status}`);
    }
    
    return await response.json();
}

// ✅ Fetch Attendance Summary Report
async function fetchAttendanceReport(startDate, endDate) {
    const response = await fetch(`https://localhost:7020/api/Report/attendance/summary?startDate=${startDate}&endDate=${endDate}`, {
        headers: getAuthHeaders()
    });
    
    if (!response.ok) {
        throw new Error(`Failed to fetch attendance report: ${response.status}`);
    }
    
    return await response.json();
}

// ✅ Render All Reports
function renderReports(financial, booking, attendance) {
    const container = document.getElementById("reportsContainer");
    
    container.innerHTML = `
        <div class="row">
            <!-- Financial Overview -->
            <div class="col-lg-6">
                <div class="report-section">
                    <h3><i class="fas fa-chart-line me-2"></i> Financial Overview</h3>
                    <div class="row">
                        <div class="col-md-6">
                            <div class="stat-card">
                                <h4>Total Revenue</h4>
                                <p>$${financial.totalRevenue.toLocaleString()}</p>
                            </div>
                        </div>
                        <div class="col-md-6">
                            <div class="stat-card">
                                <h4>Received Payments</h4>
                                <p>$${financial.receivedPayments.toLocaleString()}</p>
                            </div>
                        </div>
                        <div class="col-md-6">
                            <div class="stat-card">
                                <h4>Outstanding Payments</h4>
                                <p>$${financial.outstandingPayments.toLocaleString()}</p>
                            </div>
                        </div>
                    </div>
                    
                    <h4 class="mt-4">Revenue by Type</h4>
                    <div class="chart-container">
                        <canvas id="revenueChart"></canvas>
                    </div>
                </div>
            </div>
            
            <!-- Booking Summary -->
            <div class="col-lg-6">
                <div class="report-section">
                    <h3><i class="fas fa-calendar-check me-2"></i> Booking Summary</h3>
                    <div class="table-responsive">
                        <table class="table table-striped">
                            <thead>
                                <tr>
                                    <th>Booking Type</th>
                                    <th>Total</th>
                                    <th>Revenue</th>
                                    <th>Confirmed</th>
                                    <th>Cancelled</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${booking.map(item => `
                                    <tr>
                                        <td>${item.bookingType}</td>
                                        <td>${item.totalBookings}</td>
                                        <td>$${item.totalRevenue}</td>
                                        <td>${item.confirmed}</td>
                                        <td>${item.cancelled}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                    
                    <h4 class="mt-4">Bookings by Type</h4>
                    <div class="chart-container">
                        <canvas id="bookingTypeChart"></canvas>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Attendance Summary -->
        <div class="row mt-4">
            <div class="col-lg-12">
                <div class="report-section">
                    <h3><i class="fas fa-user-check me-2"></i> Attendance Summary</h3>
                    ${attendance.message ? `
                        <div class="alert alert-info">
                            ${attendance.message}
                        </div>
                    ` : ''}
                    
                    ${attendance.data ? `
                        <div class="row">
                            ${attendance.data.map(item => `
                                <div class="col-md-4">
                                    <div class="stat-card">
                                        <h4>${item.bookingType}</h4>
                                        <p>${item.attendanceRate}%</p>
                                        <small>${item.totalSessions} sessions</small>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                        
                        <h4 class="mt-4">Attendance Rates</h4>
                        <div class="chart-container">
                            <canvas id="attendanceChart"></canvas>
                        </div>
                    ` : `
                        <div class="alert alert-warning">
                            <i class="fas fa-info-circle me-2"></i>
                            Attendance tracking is not fully implemented
                        </div>
                    `}
                </div>
            </div>
        </div>
        
        <!-- Export Buttons -->
        <div class="export-buttons mt-4">
    <button class="btn btn-outline-primary me-2" onclick="exportAsPDF()">
        <i class="fas fa-file-pdf me-2"></i> Export as PDF
    </button>
    <button class="btn btn-outline-success" onclick="exportAsExcel()">
        <i class="fas fa-file-excel me-2"></i> Export as Excel
    </button>
</div>
    `;
    
    // Render charts
    renderCharts(financial, booking, attendance);
}


// ✅ Render Charts
function renderCharts(financial, booking, attendance) {
    // Revenue by Type Chart
    const revenueCtx = document.getElementById('revenueChart').getContext('2d');
    window.revenueChart = new Chart(revenueCtx, {
        type: 'doughnut',
        data: {
            labels: financial.revenueByType.map(item => item.type),
            datasets: [{
                data: financial.revenueByType.map(item => item.amount),
                backgroundColor: [
                    '#9c0d0d', // Primary color
                    '#d4a017', // Secondary color
                    '#343a40', // Dark color
                    '#6c757d', // Gray
                    '#28a745'  // Success color
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom'
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `$${context.raw.toLocaleString()}`;
                        }
                    }
                }
            }
        }
    });
    
    // Booking Type Chart
    const bookingCtx = document.getElementById('bookingTypeChart').getContext('2d');
    window.bookingTypeChart = new Chart(bookingCtx, {
        type: 'bar',
        data: {
            labels: booking.map(item => item.bookingType),
            datasets: [{
                label: 'Total Bookings',
                data: booking.map(item => item.totalBookings),
                backgroundColor: '#9c0d0d',
                borderColor: '#9c0d0d',
                borderWidth: 1
            }, {
                label: 'Confirmed',
                data: booking.map(item => item.confirmed),
                backgroundColor: '#28a745',
                borderColor: '#28a745',
                borderWidth: 1
            }, {
                label: 'Cancelled',
                data: booking.map(item => item.cancelled),
                backgroundColor: '#dc3545',
                borderColor: '#dc3545',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true
                }
            },
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
    
    // Attendance Chart (if data exists)
    if (attendance.data) {
        const attendanceCtx = document.getElementById('attendanceChart').getContext('2d');
        window.attendanceChart = new Chart(attendanceCtx, {
            type: 'radar',
            data: {
                labels: attendance.data.map(item => item.bookingType),
                datasets: [{
                    label: 'Attendance Rate (%)',
                    data: attendance.data.map(item => item.attendanceRate),
                    backgroundColor: 'rgba(156, 13, 13, 0.2)',
                    borderColor: '#9c0d0d',
                    borderWidth: 2,
                    pointBackgroundColor: '#9c0d0d',
                    pointBorderColor: '#fff',
                    pointHoverRadius: 5
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    r: {
                        angleLines: {
                            display: true
                        },
                        suggestedMin: 0,
                        suggestedMax: 100
                    }
                },
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    }
}

// ✅ Export as PDF
async function exportAsPDF() {
    try {
        // Show loading indicator
        const exportBtn = document.querySelector('.export-buttons .btn-outline-primary');
        const originalText = exportBtn.innerHTML;
        exportBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i> Generating PDF...';
        exportBtn.disabled = true;

        // Get the reports container
        const element = document.getElementById("reportsContainer");
        
        // Create a new jsPDF instance
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF('p', 'pt', 'a4');
        
        // Use html2canvas to capture the content
        const canvas = await html2canvas(element, {
            scale: 2, // Higher quality
            logging: false,
            useCORS: true,
            allowTaint: true
        });
        
        // Convert canvas to image and add to PDF
        const imgData = canvas.toDataURL('image/png');
        const imgWidth = pdf.internal.pageSize.getWidth() - 40; // Margin
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        
        pdf.addImage(imgData, 'PNG', 20, 20, imgWidth, imgHeight);
        
        // Add title and date
        const dateStr = new Date().toLocaleDateString();
        pdf.setFontSize(18);
        pdf.text('Elite Studio Reports', 40, 30);
        pdf.setFontSize(12);
        pdf.text(`Generated on: ${dateStr}`, 40, 50);
        
        // Save the PDF
        pdf.save(`elite-studio-reports-${dateStr.replace(/\//g, '-')}.pdf`);
        
    } catch (error) {
        console.error("Error generating PDF:", error);
        alert("Failed to generate PDF. Please try again.");
    } finally {
        // Restore button state
        const exportBtn = document.querySelector('.export-buttons .btn-outline-primary');
        exportBtn.innerHTML = '<i class="fas fa-file-pdf me-2"></i> Export as PDF';
        exportBtn.disabled = false;
    }
}


// ✅ Export as Excel
async function exportAsExcel() {
    try {
        // Show loading indicator
        const exportBtn = document.querySelector('.export-buttons .btn-outline-success');
        const originalText = exportBtn.innerHTML;
        exportBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i> Generating Excel...';
        exportBtn.disabled = true;

        // Get the current report data
        const startDate = document.getElementById("reportStartDate").value;
        const endDate = document.getElementById("reportEndDate").value;
        
        // Fetch all reports again to get fresh data
        const [financialReport, bookingReport, attendanceReport] = await Promise.all([
            fetchFinancialReport(startDate, endDate),
            fetchBookingReport(startDate, endDate),
            fetchAttendanceReport(startDate, endDate)
        ]);

        // Create a new workbook
        const wb = XLSX.utils.book_new();
        
        // 1. Financial Report Sheet
        const financialData = [
            ["Financial Report", `From ${startDate} to ${endDate}`],
            [],
            ["Metric", "Value"],
            ["Total Revenue", financialReport.totalRevenue],
            ["Received Payments", financialReport.receivedPayments],
            ["Outstanding Payments", financialReport.outstandingPayments],
            [],
            ["Revenue by Type", "Amount", "Count"]
        ];
        
        financialReport.revenueByType.forEach(item => {
            financialData.push([item.type, item.amount, item.count]);
        });
        
        XLSX.utils.book_append_sheet(
            wb,
            XLSX.utils.aoa_to_sheet(financialData),
            "Financial Report"
        );
        
        // 2. Booking Report Sheet
        const bookingData = [
            ["Booking Report", `From ${startDate} to ${endDate}`],
            [],
            ["Booking Type", "Total Bookings", "Total Revenue", "Pending", "Confirmed", "Cancelled"]
        ];
        
        bookingReport.forEach(item => {
            bookingData.push([
                item.bookingType,
                item.totalBookings,
                item.totalRevenue,
                item.pending,
                item.confirmed,
                item.cancelled
            ]);
        });
        
        XLSX.utils.book_append_sheet(
            wb,
            XLSX.utils.aoa_to_sheet(bookingData),
            "Booking Report"
        );
        
        // 3. Attendance Report Sheet (if available)
        if (attendanceReport.data) {
            const attendanceData = [
                ["Attendance Report", `From ${startDate} to ${endDate}`],
                [],
                ["Booking Type", "Total Sessions", "Attendance Rate (%)"]
            ];
            
            attendanceReport.data.forEach(item => {
                attendanceData.push([
                    item.bookingType,
                    item.totalSessions,
                    item.attendanceRate
                ]);
            });
            
            XLSX.utils.book_append_sheet(
                wb,
                XLSX.utils.aoa_to_sheet(attendanceData),
                "Attendance Report"
            );
        }
        
        // Generate Excel file and download
        const dateStr = new Date().toLocaleDateString().replace(/\//g, '-');
        XLSX.writeFile(wb, `elite-studio-reports-${dateStr}.xlsx`);
        
    } catch (error) {
        console.error("Error generating Excel:", error);
        alert("Failed to generate Excel file. Please try again.");
    } finally {
        // Restore button state
        const exportBtn = document.querySelector('.export-buttons .btn-outline-success');
        exportBtn.innerHTML = '<i class="fas fa-file-excel me-2"></i> Export as Excel';
        exportBtn.disabled = false;
    }
}


 /// 


// ✅ Logout Function
function logout() {
    localStorage.removeItem("authToken");
    localStorage.removeItem("userData");
    window.location.href = "login.html";
}




let lastBookingId = localStorage.getItem("lastBookingId");

// Polling function to check for new bookings
function checkNewBookings() {
    fetch("https://localhost:7020/api/Booking/filter")
        .then(res => res.json())
        .then(bookings => {
            if (!bookings || bookings.length === 0) return;

            const latest = bookings[0].id;

            // First time or if no local data
            if (!lastBookingId) {
                lastBookingId = latest;
                localStorage.setItem("lastBookingId", latest);
                return;
            }

            // Check if there's a new booking
            if (latest > lastBookingId) {
                lastBookingId = latest;
                localStorage.setItem("lastBookingId", latest);

                // 🔔 Show badge next to "Bookings" in sidebar
                const badge = document.getElementById("new-booking-badge");
                if (badge) {
                    badge.style.display = "inline-block";
                }

                // 🔔 Optional toast-like alert
                showBookingNotification();
            }
        })
        .catch(err => console.error("Booking check failed:", err));
}

// Call check every 30 seconds
setInterval(checkNewBookings, 30000);

// Show alert function
function showBookingNotification() {
    const notif = document.createElement("div");
    notif.className = "alert alert-info position-fixed top-0 end-0 m-3 shadow";
    notif.style.zIndex = 9999;
    notif.innerHTML = `
        <strong>New Booking!</strong> A new booking has been added.
        <button type="button" class="btn-close float-end" onclick="this.parentElement.remove()"></button>
    `;
    document.body.appendChild(notif);
    setTimeout(() => notif.remove(), 6000);
}


function fetchBookings() {
    fetch("https://localhost:7020/api/Booking/all")
        .then(res => res.json())
        .then(bookings => {
            const tbody = document.querySelector("#bookingsTable tbody");
            tbody.innerHTML = "";
            bookings.forEach(b => {
                // Determine the item name based on booking type
                let itemName = "-";
                
                if (b.bookingType === 1) { // Membership
                    itemName = b.membership?.name || "-";
                } 
                else if (b.bookingType === 2) { // Class
                    // Check both possible paths to class name
                    itemName = b.schedule?.class?.name || b.class?.name || "-";

                } 
                else if (b.bookingType === 3) { // Online Session
                    itemName = b.onlineSession?.title || "-";
                }

                // Format the booking type for display
                const bookingTypeText = getBookingTypeName(b.bookingType);

                tbody.innerHTML += `
                    <tr>
                        <td>${b.id}</td>
                        <td>${b.name}<br><small>${b.email}</small></td>
                        <td>${bookingTypeText}</td>
                        <td>${itemName}</td>
                        <td>${b.status}</td>
                        <td>${b.paymentStatus} (${b.paymentMethod || 'N/A'})</td>
                        <td>${new Date(b.bookingDate).toLocaleString()}</td>
                        <td>
                            <button class="btn btn-success btn-sm" onclick="confirmBooking(${b.id})">Confirm</button>
                            <button class="btn btn-warning btn-sm" onclick="cancelBooking(${b.id})">Cancel</button>
                            <button class="btn btn-danger btn-sm" onclick="deleteBooking(${b.id})">Delete</button>
                        </td>
                    </tr>
                `;
            });
        })
        .catch(err => console.error("Error fetching bookings:", err));
}

// Helper function to convert booking type number to name
function getBookingTypeName(type) {
    const types = {
        1: 'Membership',
        2: 'Class',
        3: 'Online Session'
    };
    return types[type] || 'Unknown';
}


function confirmBooking(id) {
    fetch(`https://localhost:7020/api/Booking/confirm/${id}`, {
        method: "POST"
    })
    .then(() => fetchBookings())
    .catch(err => alert("Failed to confirm booking"));
}

function cancelBooking(id) {
    fetch(`https://localhost:7020/api/Booking/cancel/${id}`, {
        method: "POST"
    })
    .then(() => fetchBookings())
    .catch(err => alert("Failed to cancel booking"));
}

function deleteBooking(id, event) {
    if (!confirm("Are you sure you want to permanently delete this booking?")) return;

    // Get the button that was clicked and show loading state
    const deleteBtn = event.target;
    const originalText = deleteBtn.innerHTML;
    deleteBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Deleting...';
    deleteBtn.disabled = true;

    fetch(`https://localhost:7020/api/Booking/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders()
    })
    .then(response => {
        if (response.status === 204) {
            // Successful deletion with no content (204)
            return Promise.resolve(null);
        }
        if (!response.ok) {
            // Try to parse error response if available
            return response.json().then(err => {
                throw new Error(err.message || 'Failed to delete booking');
            }).catch(() => {
                throw new Error(`HTTP error! status: ${response.status}`);
            });
        }
        return response.json();
    })
    .then(() => {
        showToast('Booking deleted successfully!', 'success');
        fetchBookings(); // Refresh the bookings list
    })
    .catch(err => {
        console.error("Delete booking error:", err);
        showToast(`Error: ${err.message}`, 'danger');
    })
    .finally(() => {
        // Restore button state in all cases (success or error)
        deleteBtn.innerHTML = originalText;
        deleteBtn.disabled = false;
    });
}



function setActiveSidebar(name) {
    document.querySelectorAll(".sidebar ul li a").forEach(link => {
        link.classList.remove("active");
        if (link.textContent.trim() === name) {
            link.classList.add("active");
        }
    });
}


