document.addEventListener("DOMContentLoaded", function () {
    checkAuthStatus();
    loadDashboardData();
    
    // Payment method toggle
    const paymentMethod = document.getElementById('paymentMethod');
    if (paymentMethod) {
        paymentMethod.addEventListener('change', function() {
            document.getElementById('creditCardFields').style.display = 
                this.value === 'credit' ? 'block' : 'none';
            document.getElementById('alternativeMessage').style.display = 
                this.value === 'credit' ? 'none' : 'block';
            document.getElementById('selectedMethod').textContent = 
                this.options[this.selectedIndex].text;
        });
    }
});

async function loadDashboardData() {
    const user = auth.currentUser();
    if (!user) {
        window.location.href = 'SignUp.html';
        return;
    }

    document.getElementById('userGreeting').textContent = user.fullName || user.username;
    document.getElementById('userFullName').textContent = user.fullName || user.username;
    document.getElementById('userEmail').textContent = user.email;

    await loadMembershipInfo(user.id);
    await loadMembershipDetails(user.id);
    await loadUserBookings(user.id);
    await loadUserPayments(user.id);
    await loadNextSession(user.id);
}

async function loadUserBookings(userId) {
    try {
        const response = await fetch(`https://localhost:7020/api/Booking/user/${userId}`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` }
        });
        if (!response.ok) throw new Error('Failed to load bookings');
        const bookings = await response.json();
        const upcomingBookings = bookings.filter(b => b.status !== 'Cancelled');

        document.getElementById('activeBookingsCount').textContent = upcomingBookings.length;

        const bookingsTable = document.getElementById('upcomingBookings');
        bookingsTable.innerHTML = upcomingBookings.length > 0 ?
            upcomingBookings.map(booking => `
                <tr>
                    <td>${booking.membershipStartDate ? new Date(booking.membershipStartDate).toLocaleDateString() : 
                        new Date(booking.bookingDate).toLocaleDateString()}</td>
                    <td>${booking.membershipEndDate ? new Date(booking.membershipEndDate).toLocaleDateString() : 
                        'N/A'}</td>
                    <td>${booking.class?.startTime || booking.onlineSession?.startTime || 'N/A'}</td>
                    <td>
                        <strong>${booking.class?.name || booking.onlineSession?.title || 'N/A'}</strong>
                        ${booking.membership ? `<br><small class="text-muted">Membership: ${booking.membership.name}</small>` : ''}
                    </td>
                    <td>${booking.class?.trainer?.name || booking.onlineSession?.trainer?.name || 'N/A'}</td>
                    <td><span class="badge ${getStatusBadgeClass(booking.status)}">${booking.status}</span></td>
                    <td>
                        ${booking.status === 'Confirmed' ?
                            `<button class="btn btn-sm btn-outline-danger cancel-booking" data-id="${booking.id}">Cancel</button>` :
                            booking.status === 'Pending' ?
                            `<button class="btn btn-sm btn-outline-primary pay-now" data-id="${booking.id}">Pay Now</button>` : ''}
                    </td>
                </tr>
            `).join('') :
            `<tr><td colspan="7" class="text-center">No upcoming bookings found</td></tr>`;
    } catch (error) {
        console.error('Error loading bookings:', error);
        document.getElementById('upcomingBookings').innerHTML =
            `<tr><td colspan="7" class="text-center text-danger">Error loading bookings</td></tr>`;
    }
}

async function loadNextSession(userId) {
    try {
        const response = await fetch(`https://localhost:7020/api/Booking/next-session/${userId}`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` }
        });
        if (!response.ok) throw new Error('Failed to load next session');
        const nextSession = await response.json();
        const nextSessionDiv = document.getElementById('nextSession');

        if (nextSession) {
            nextSessionDiv.innerHTML = `
                <h4>${nextSession.class?.name || nextSession.onlineSession?.title || 'Next Session'}</h4>
                <p><strong>Date:</strong> ${new Date(nextSession.bookingDate).toLocaleDateString()}</p>
                <p><strong>Time:</strong> ${nextSession.class?.startTime || nextSession.onlineSession?.startTime || 'N/A'}</p>
                <p><strong>Trainer:</strong> ${nextSession.class?.trainer?.name || nextSession.onlineSession?.trainer?.name || 'N/A'}</p>
                <a href="#" class="btn btn-sm btn-warning">View Details</a>
            `;
        } else {
            nextSessionDiv.innerHTML = '<p class="text-muted">No upcoming sessions</p>';
        }
    } catch (error) {
        console.error('Error loading next session:', error);
        document.getElementById('nextSession').innerHTML = '<p class="text-danger">Error loading session</p>';
    }
}

async function loadUserPayments(userId) {
    try {
        const response = await fetch(`https://localhost:7020/api/Payment`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` }
        });
        
        if (!response.ok) throw new Error('Failed to load payments');
        
        const payments = await response.json();
        const userPayments = payments.filter(p => p.booking?.userId === userId);
        
        const currentMonth = new Date().getMonth();
        const monthlyTotal = userPayments
            .filter(p => new Date(p.paymentDate).getMonth() === currentMonth && p.paymentStatus === 'Completed')
            .reduce((sum, p) => sum + p.amount, 0);
            
        document.getElementById('totalSpent').textContent = `$${monthlyTotal.toFixed(2)}`;
        
        const paymentsTable = document.getElementById('recentPayments');
        const recentPayments = userPayments.slice(0, 5);
        
        paymentsTable.innerHTML = recentPayments.length > 0 ? 
            recentPayments.map(payment => `
                <tr>
                    <td>${new Date(payment.paymentDate).toLocaleDateString()}</td>
                    <td>$${payment.amount.toFixed(2)}</td>
                    <td>${payment.booking?.class?.name || payment.booking?.onlineSession?.title || 'Payment'}</td>
                    <td><span class="badge ${getPaymentStatusBadgeClass(payment.paymentStatus)}">${payment.paymentStatus}</span></td>
                    <td>
                        <a href="#" class="btn btn-sm btn-outline-info">View</a>
                    </td>
                </tr>
            `).join('') : 
            `<tr><td colspan="5" class="text-center">No payment history found</td></tr>`;
            
    } catch (error) {
        console.error('Error loading payments:', error);
        document.getElementById('recentPayments').innerHTML = 
            `<tr><td colspan="5" class="text-center text-danger">Error loading payments</td></tr>`;
    }
}

// CORRECTED membership loading function
async function loadMembershipInfo(userId) {
    try {
        const response = await fetch(`https://localhost:7020/api/Membership/UserMembership/${userId}`, {
            headers: { 
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
                'accept': 'application/json'
            }
        });
        
        if (!response.ok) {
            const error = await response.text();
            throw new Error(`API Error ${response.status}: ${error}`);
        }
        
        const membership = await response.json();
        console.log("Membership data:", membership); // Debug log
        
        if (membership) {
            document.getElementById('membershipStatus').textContent = membership.membershipName;
            document.getElementById('membershipExpiry').textContent = 
                `Expires: ${new Date(membership.expiryDate).toLocaleDateString()}`;
        } else {
            document.getElementById('membershipStatus').textContent = 'No active membership';
            document.getElementById('membershipExpiry').textContent = '';
        }
    } catch (error) {
        console.error("Membership load failed:", error);
        document.getElementById('membershipStatus').textContent = 'Error loading';
        document.getElementById('membershipExpiry').textContent = '';
    }
}

// CORRECTED membership details function
async function loadMembershipDetails(userId) {
    try {
        const response = await fetch(`https://localhost:7020/api/Membership/UserMembership/${userId}`, {
            headers: { 
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
                'accept': 'application/json'
            }
        });
        
        if (!response.ok) throw new Error('Failed to load membership details');
        
        const membership = await response.json();
        const tableBody = document.getElementById('membershipDetails');
        
        if (membership) {
            tableBody.innerHTML = `
                <tr>
                    <td>
                        <strong>${membership.membershipName}</strong>
                        <br><small class="text-muted">${membership.description}</small>
                    </td>
                    <td>${new Date(membership.startDate).toLocaleDateString()}</td>
                    <td>${new Date(membership.expiryDate).toLocaleDateString()}</td>
                    <td>
                        <span class="badge ${new Date(membership.expiryDate) > new Date() ? 'bg-success' : 'bg-secondary'}">
                            ${new Date(membership.expiryDate) > new Date() ? 'Active' : 'Expired'}
                        </span>
                    </td>
                    <td>
                        <button class="btn btn-sm btn-outline-info">Details</button>
                    </td>
                </tr>
            `;
        } else {
            tableBody.innerHTML = '<tr><td colspan="5" class="text-center">No membership found</td></tr>';
        }
    } catch (error) {
        console.error("Membership details failed:", error);
        document.getElementById('membershipDetails').innerHTML = 
            '<tr><td colspan="5" class="text-center text-danger">Error loading</td></tr>';
    }
}

// Helper functions
function getStatusBadgeClass(status) {
    switch(status.toLowerCase()) {
        case 'confirmed': return 'bg-success';
        case 'pending': return 'bg-warning text-dark';
        case 'cancelled': return 'bg-secondary';
        default: return 'bg-info';
    }
}

function getPaymentStatusBadgeClass(status) {
    switch(status.toLowerCase()) {
        case 'completed': return 'bg-success';
        case 'pending': return 'bg-warning text-dark';
        case 'failed': return 'bg-danger';
        default: return 'bg-info';
    }
}

async function handleCancelBooking(e) {
    const bookingId = e.target.dataset.id;
    if (!confirm('Are you sure you want to cancel this booking?')) return;
    
    try {
        const response = await fetch(`https://localhost:7020/api/Booking/${bookingId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            }
        });
        
        if (!response.ok) throw new Error('Failed to cancel booking');
        
        alert('Booking cancelled successfully');
        loadDashboardData(); // Refresh data
        
    } catch (error) {
        console.error('Error cancelling booking:', error);
        alert('Failed to cancel booking');
    }
}

async function handlePayNow(e) {
    const bookingId = e.target.dataset.id;
    window.location.href = `payment.html?bookingId=${bookingId}`;
}

// Auth system
const auth = {
    isLoggedIn: () => localStorage.getItem("authToken") !== null,
    currentUser: () => {
        const user = JSON.parse(localStorage.getItem("userData")) || null;
        if (user) {
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
    if (!auth.isLoggedIn()) {
        window.location.href = 'SignUp.html';
        return;
    }

    const authLinks = document.querySelector(".auth-links");
    const user = auth.currentUser();

    if (authLinks && user) {
        authLinks.innerHTML = `
            <li class="nav-item dropdown">
                <a class="nav-link dropdown-toggle" href="#" id="userDropdown" role="button" data-bs-toggle="dropdown" aria-expanded="false">
                    <i class="fas fa-user-circle"></i> <span id="userName">${user.fullName || user.username || 'My Account'}</span>
                </a>
                <ul class="dropdown-menu" aria-labelledby="userDropdown">
                    <li><a class="dropdown-item" href="profile.html">Profile</a></li>
                    <li><a class="dropdown-item" href="Userdashboard.html">My Dashboard</a></li>
                    <li><hr class="dropdown-divider"></li>
                    <li><a class="dropdown-item" href="#" onclick="auth.logout()">Logout</a></li>
                </ul>
            </li>
        `;

        setTimeout(() => {
            const dropdownElement = document.getElementById("userDropdown");
            if (dropdownElement) {
                new bootstrap.Dropdown(dropdownElement);
            }
        }, 100);
    }
}