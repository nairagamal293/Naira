// booking.js

const userData = JSON.parse(localStorage.getItem("userData"));
const apiBase = "https://localhost:7020/api";

document.addEventListener("DOMContentLoaded", () => {
  if (!userData) {
    document.getElementById("bookingForm").innerHTML = "<p>Please log in to book.</p>";
    return;
  }

  const bookingTypeSelect = document.getElementById("bookingType");
  const bookingItemSelect = document.getElementById("bookingItem");

  bookingTypeSelect.addEventListener("change", async () => {
    const type = parseInt(bookingTypeSelect.value);
    bookingItemSelect.innerHTML = "<option>Loading...</option>";
    let endpoint = "";

    switch (type) {
      case 1: endpoint = "/Membership"; break;
      case 2: endpoint = "/Class"; break;
      case 3: endpoint = "/OnlineSession"; break;
    }

    const res = await fetch(apiBase + endpoint);
    const data = await res.json();

    bookingItemSelect.innerHTML = "<option value=''>Select Option</option>";
    data.forEach(item => {
      const name = item.name || item.title;
      bookingItemSelect.innerHTML += `<option value="${item.id}">${name}</option>`;
    });
  });

  document.getElementById("bookingForm").addEventListener("submit", async (e) => {
    e.preventDefault();

    const form = e.target;
    const type = parseInt(form.bookingType.value);

    const payload = {
      userId: userData.id,
      name: form.name.value,
      email: form.email.value,
      phone: form.phone.value,
      notes: form.notes.value,
      paymentMethod: form.paymentMethod.value,
      amountPaid: 0,
      bookingType: type
    };

    if (type === 1) payload.membershipId = form.bookingItem.value;
    if (type === 2) payload.classId = form.bookingItem.value;
    if (type === 3) payload.onlineSessionId = form.bookingItem.value;

    const res = await fetch(`${apiBase}/Booking`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const result = await res.json();
    document.getElementById("bookingMessage").innerText =
      res.ok ? "Booking successful!" : `Booking failed: ${result}`;
  });
});
