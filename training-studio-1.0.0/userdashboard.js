document.addEventListener("DOMContentLoaded", function() {
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

// Load all dashboard data
async function loadDashboardData() {
    const user = auth.currentUser();
    if (!user) {
        window.location.href = 'SignUp.html';
        return;
    }

    // Set user info
    document.getElementById('userGreeting').textContent = user.fullName || user.username;
    document.getElementById('userFullName').textContent = user.fullName || user.username;
    document.getElementById('userEmail').textContent = user.email;
    
    // Load user bookings
    await loadUserBookings(user.id);
    
    // Load user payments
    await loadUserPayments(user.id);
    
    // Load membership info
    await loadMembershipInfo(user.id);
    
    // Load next session
    await loadNextSession(user.id);
}

// Load user bookings
async function loadUserBookings(userId) {
    try {
        const response = await fetch(`https://localhost:7020/api/Booking/my-bookings`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            }
        });
        
        if (!response.ok) throw new Error('Failed to load bookings');
        
        const bookings = await response.json();
        const upcomingBookings = bookings.filter(b => b.status !== 'Cancelled');
        
        // Update stats
        document.getElementById('activeBookingsCount').textContent = upcomingBookings.length;
        
        // Populate bookings table
        const bookingsTable = document.getElementById('upcomingBookings');
        bookingsTable.innerHTML = upcomingBookings.length > 0 ? 
            upcomingBookings.map(booking => `
                <tr>
                    <td>${new Date(booking.bookingDate).toLocaleDateString()}</td>
                    <td>${booking.class?.startTime || 'N/A'}</td>
                    <td>${booking.class?.name || booking.onlineSession?.title || 'N/A'}</td>
                    <td>${booking.class?.trainer?.name || booking.onlineSession?.trainer?.name || 'N/A'}</td>
                    <td><span class="badge ${getStatusBadgeClass(booking.status)}">${booking.status}</span></td>
                    <td>
                        ${booking.status === 'Confirmed' ? 
                            `<button class="btn btn-sm btn-outline-danger cancel-booking" data-id="${booking.id}">Cancel</button>` : 
                            booking.status === 'Pending' ? 
                            `<button class="btn btn-sm btn-outline-primary pay-now" data-id="${booking.id}">Pay Now</button>` : 
                            ''}
                    </td>
                </tr>
            `).join('') : 
            `<tr><td colspan="6" class="text-center">No upcoming bookings found</td></tr>`;
            
        // Add event listeners to buttons
        document.querySelectorAll('.cancel-booking').forEach(button => {
            button.addEventListener('click', handleCancelBooking);
        });
        
        document.querySelectorAll('.pay-now').forEach(button => {
            button.addEventListener('click', handlePayNow);
        });
        
    } catch (error) {
        console.error('Error loading bookings:', error);
        document.getElementById('upcomingBookings').innerHTML = 
            `<tr><td colspan="6" class="text-center text-danger">Error loading bookings</td></tr>`;
    }
}

// Load user payments
async function loadUserPayments(userId) {
    try {
        const response = await fetch(`https://localhost:7020/api/Payment`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            }
        });
        
        if (!response.ok) throw new Error('Failed to load payments');
        
        const payments = await response.json();
        const userPayments = payments.filter(p => p.booking?.userId === userId);
        
        // Calculate total spent this month
        const currentMonth = new Date().getMonth();
        const monthlyTotal = userPayments
            .filter(p => new Date(p.paymentDate).getMonth() === currentMonth && p.paymentStatus === 'Completed')
            .reduce((sum, p) => sum + p.amount, 0);
            
        document.getElementById('totalSpent').textContent = `$${monthlyTotal.toFixed(2)}`;
        
        // Populate payments table (last 5)
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

// Load membership info
async function loadMembershipInfo(userId) {
    try {
        // This endpoint might need to be created to get user's active membership
        const response = await fetch(`https://localhost:7020/api/User/${userId}/membership`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            }
        });
        
        if (!response.ok) throw new Error('Failed to load membership info');
        
        const membership = await response.json();
        
        if (membership) {
            document.getElementById('membershipStatus').textContent = membership.name;
            document.getElementById('membershipExpiry').textContent = 
                `Expires: ${new Date(membership.expiryDate).toLocaleDateString()}`;
        } else {
            document.getElementById('membershipStatus').textContent = 'No active membership';
            document.getElementById('membershipExpiry').textContent = '';
        }
        
    } catch (error) {
        console.error('Error loading membership info:', error);
        document.getElementById('membershipStatus').textContent = 'Error loading';
        document.getElementById('membershipExpiry').textContent = '';
    }
}

// Load next session
async function loadNextSession(userId) {
    try {
        const response = await fetch(`https://localhost:7020/api/Booking/next-session`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            }
        });
        
        if (!response.ok) throw new Error('Failed to load next session');
        
        const nextSession = await response.json();
        const nextSessionDiv = document.getElementById('nextSession');
        
        if (nextSession) {
            nextSessionDiv.innerHTML = `
                <h4>${nextSession.class?.name || nextSession.onlineSession?.title}</h4>
                <p><strong>Date:</strong> ${new Date(nextSession.bookingDate).toLocaleDateString()}</p>
                <p><strong>Time:</strong> ${nextSession.class?.startTime || 'N/A'}</p>
                <p><strong>Trainer:</strong> ${nextSession.class?.trainer?.name || nextSession.onlineSession?.trainer?.name}</p>
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
    // You can implement payment flow here or redirect to payment page
    window.location.href = `payment.html?bookingId=${bookingId}`;
}

// Reuse your existing auth system
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
    }
}