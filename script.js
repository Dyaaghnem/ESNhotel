
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.5.0/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, query, where } from "https://www.gstatic.com/firebasejs/11.5.0/firebase-firestore.js";


const firebaseConfig = {
  apiKey: "AIzaSyBEaAH2XSxDHpxkeMaKC0mr-l29xR44ehs",
  authDomain: "esnhotel-booking.firebaseapp.com",
  projectId: "esnhotel-booking",
  storageBucket: "esnhotel-booking.appspot.com",
  messagingSenderId: "893754161647",
  appId: "1:893754161647:web:52816d61dd4ef4e51a5e1a"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);


function loadEmailJS(apiKey) {
  return new Promise((resolve, reject) => {
    if (window.emailjs) {
      window.emailjs.init(apiKey);
      resolve();
    } else {
      const script = document.createElement('script');
      script.src = "https://cdn.emailjs.com/dist/email.min.js";
      script.onload = () => {
        if (window.emailjs) {
          window.emailjs.init(apiKey);
          resolve();
        } else {
          reject(new Error("EmailJS failed to load after script onload"));
        }
      };
      script.onerror = () => reject(new Error("Failed to load EmailJS script"));
      document.head.appendChild(script);
    }
  });
}


document.addEventListener('DOMContentLoaded', async () => {
  try {
    await loadEmailJS("iMRX0EZ_hCvjxc5HD");
  } catch (error) {
    console.error("Error loading EmailJS:", error);
    alert("EmailJS could not be loaded. Please try again later.");
    return;
  }

  const text = "Welcome to ESN Hotel";
  const typedText = document.getElementById("typed-text");
  let index = 0;
  let isDeleting = false;
  function typeEffect() {
    if (!typedText) return;
    typedText.textContent = text.substring(0, index);
    if (!isDeleting) {
      index++;
      if (index > text.length) {
        isDeleting = true;
        setTimeout(typeEffect, 1500);
        return;
      }
    } else {
      index--;
      if (index < 0) {
        isDeleting = false;
        setTimeout(typeEffect, 800);
        return;
      }
    }
    setTimeout(typeEffect, isDeleting ? 70 : 120);
  }
  typeEffect();

  const bookingForm = document.getElementById("search-form");
  if (bookingForm) {
    bookingForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const name = document.getElementById("name")?.value.trim();
      const email = document.getElementById("email")?.value.trim();
      const checkin = document.getElementById("checkin")?.value;
      const checkout = document.getElementById("checkout")?.value;
      const guests = document.getElementById("guests")?.value;
      const room = document.getElementById("room")?.value;

      if (!name || !email || !checkin || !checkout || !guests || !room) {
        alert("Please fill out all fields.");
        return;
      }
      if (new Date(checkin) >= new Date(checkout)) {
        alert("Check-out date must be after check-in.");
        return;
      }

      const bookingData = {
        name,
        email,
        checkin,
        checkout,
        guests,
        room,
        time: new Date().toLocaleString(),
        message: `Booking for ${room} from ${checkin} to ${checkout}`
      };

      try {
        await addDoc(collection(db, "bookings"), {
          ...bookingData,
          timestamp: new Date()
        });

        await window.emailjs.send("service_78g54ar", "template_6qjyhti", bookingData);

        const adminResponse = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            service_id: "service_mg14pnf",
            template_id: "template_p5qs3hw",
            user_id: "_fjO03n5N53XX_qz6",
            template_params: {
              ...bookingData,
              to_email: "horanedeyaa@gmail.com"
            }
          })
        });

        if (!adminResponse.ok) {
          throw new Error("Admin email sending failed");
        }

        alert(`✅ Booking confirmed! Email sent to ${email}`);
        bookingForm.reset();
        updateRoomAvailability(); 

      } catch (error) {
        console.error("Error during booking submission:", error);
        alert("❌ Booking failed. Try again.");
      }
    });
  }

  document.querySelectorAll(".book-now").forEach((button) => {
    button.addEventListener("click", (e) => {
      const roomCard = e.target.closest(".card");
      const roomName = roomCard?.querySelector("h3")?.textContent || "selected room";
      const roomSelect = document.getElementById("room");
      if (roomSelect) {
        roomSelect.value = roomName;
        roomSelect.dispatchEvent(new Event("change"));
        bookingForm.scrollIntoView({ behavior: "smooth" });
      }
      alert(`Preselected ${roomName} – fill the form to book.`);
    });
  });


  const totalRooms = {
    "Deluxe Room": 60,
    "Superior Room": 61,
    "Family Suite": 53,
    "Honeymoon Suite": 56
  };

  async function updateRoomAvailability() {
    try {
      const snapshot = await getDocs(collection(db, "bookings"));
      const bookedCounts = {
        "Deluxe Room": 0,
        "Superior Room": 0,
        "Family Suite": 0,
        "Honeymoon Suite": 0
      };

      snapshot.forEach(doc => {
        const data = doc.data();
        if (bookedCounts[data.room] !== undefined) {
          bookedCounts[data.room]++;
        }
      });

      document.querySelectorAll(".card").forEach(card => {
        const roomName = card.querySelector("h3")?.textContent;
        const infoDiv = document.createElement("div");
        infoDiv.className = "room-availability";

        const available = totalRooms[roomName] - bookedCounts[roomName];
        infoDiv.textContent = `${available} available`;

        if (available === 0) {
          infoDiv.classList.add("full");
        }

        const existing = card.querySelector(".room-availability");
        if (existing) existing.remove();
        card.querySelector(".card-content")?.appendChild(infoDiv);
      });

    } catch (err) {
      console.error("Error updating availability:", err);
    }
  }

  updateRoomAvailability();
});
