document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");
  const filterCategory = document.getElementById("filter-category");
  const filterSearch = document.getElementById("filter-search");
  const filterSort = document.getElementById("filter-sort");
  let allActivities = [];

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();
      allActivities = activities;
      renderActivities();
      populateCategoryFilter();
      populateActivitySelect();
    } catch (error) {
      activitiesList.innerHTML =
        "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
    // Render activities based on filters
    function renderActivities() {
      let filtered = [...allActivities];
      // Filter by category
      const selectedCategory = filterCategory.value;
      if (selectedCategory) {
        filtered = filtered.filter((a) => a.category === selectedCategory);
      }
      // Filter by search
      const searchText = filterSearch.value.trim().toLowerCase();
      if (searchText) {
        filtered = filtered.filter(
          (a) =>
            a.name.toLowerCase().includes(searchText) ||
            a.description.toLowerCase().includes(searchText)
        );
      }
      // Sort
      const sortBy = filterSort.value;
      filtered.sort((a, b) => {
        if (sortBy === "name") {
          return a.name.localeCompare(b.name);
        } else if (sortBy === "category") {
          return a.category.localeCompare(b.category);
        }
        return 0;
      });

      // Clear loading message
      activitiesList.innerHTML = "";

      filtered.forEach((details) => {
        const name = details.name;
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";
        const spotsLeft =
          details.max_participants - details.participants.length;
        const participantsHTML =
          details.participants && details.participants.length > 0
            ? `<div class="participants-section">
                <h5>Participants:</h5>
                <ul class="participants-list">
                  ${details.participants
                    .map(
                      (email) =>
                        `<li><span class="participant-email">${email}</span><button class="delete-btn" data-activity="${name}" data-email="${email}">❌</button></li>`
                    )
                    .join("")}
                </ul>
              </div>`
            : `<p><em>No participants yet</em></p>`;
        activityCard.innerHTML = `
            <h4>${name}</h4>
            <p>${details.description}</p>
            <p><strong>Schedule:</strong> ${details.schedule}</p>
            <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
            <div class="participants-container">
              ${participantsHTML}
            </div>
          `;
        activitiesList.appendChild(activityCard);
      });
      // Add event listeners to delete buttons
      document.querySelectorAll(".delete-btn").forEach((button) => {
        button.addEventListener("click", handleUnregister);
      });
    }

    // Populate category filter dropdown
    function populateCategoryFilter() {
      const categories = Array.from(
        new Set(allActivities.map((a) => a.category))
      );
      // Remove all except 'All'
      while (filterCategory.options.length > 1) {
        filterCategory.remove(1);
      }
      categories.forEach((cat) => {
        const option = document.createElement("option");
        option.value = cat;
        option.textContent = cat;
        filterCategory.appendChild(option);
      });
    }

    // Populate activity select dropdown for signup
    function populateActivitySelect() {
      // Remove all except default
      while (activitySelect.options.length > 1) {
        activitySelect.remove(1);
      }
      allActivities.forEach((details) => {
        const option = document.createElement("option");
        option.value = details.name;
        option.textContent = details.name;
        activitySelect.appendChild(option);
      });
    }

    // Add event listeners for filters
    filterCategory.addEventListener("change", renderActivities);
    filterSearch.addEventListener("input", renderActivities);
    filterSort.addEventListener("change", renderActivities);
  }

  // Handle unregister functionality
  async function handleUnregister(event) {
    const button = event.target;
    const activity = button.getAttribute("data-activity");
    const email = button.getAttribute("data-email");

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(
          activity
        )}/unregister?email=${encodeURIComponent(email)}`,
        {
          method: "DELETE",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";

        // Refresh activities list to show updated participants
        fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to unregister. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error unregistering:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(
          activity
        )}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();

        // Refresh activities list to show updated participants
        fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
