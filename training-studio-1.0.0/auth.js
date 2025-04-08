function checkAuthStatus() {
    const loggedIn = isLoggedIn();
    const user = getCurrentUser();
    const authLinks = document.querySelector('.auth-links');

    if (authLinks) {
        if (loggedIn) {
            authLinks.innerHTML = `
                <li class="nav-item dropdown">
                    <a class="nav-link dropdown-toggle" href="#" id="userDropdown" role="button" data-bs-toggle="dropdown" aria-expanded="false">
                        <i class="fas fa-user-circle"></i> ${user?.FullName || 'My Account'}
                    </a>
                    <ul class="dropdown-menu" aria-labelledby="userDropdown">
                        <li><a class="dropdown-item" href="profile.html">Profile</a></li>
                        <li><a class="dropdown-item" href="my-bookings.html">My Bookings</a></li>
                        <li><hr class="dropdown-divider"></li>
                        <li><a class="dropdown-item" href="#" onclick="logout()">Logout</a></li>
                    </ul>
                </li>
            `;
        } else {
            authLinks.innerHTML = `<li class="main-button"><a href="SignUp.html">Sign Up</a></li>`;
        }
    }
}
