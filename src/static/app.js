document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");
  const signupDialog = document.getElementById("signup-dialog");
  const signupActivity = document.getElementById("signup-activity");
  const signupFeedback = document.getElementById("signup-feedback");
  const emailInput = document.getElementById("email");
  let messageTimeout;

  function showMessage(message, type) {
    messageDiv.textContent = message;
    messageDiv.className = type;
    clearTimeout(messageTimeout);
    messageTimeout = setTimeout(() => {
      messageDiv.classList.add("hidden");
    }, 5000);
  }

  function openSignupDialog(activityName) {
    signupForm.reset();
    signupFeedback.textContent = "";
    signupFeedback.className = "hidden";
    signupActivity.textContent = activityName;
    signupForm.dataset.activity = activityName;
    signupDialog.showModal();
    emailInput.focus();
  }

  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
      }
      const activities = await response.json();
      activitiesList.replaceChildren();
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("article");
        activityCard.className = "activity-card";

        const title = document.createElement("h4");
        title.textContent = name;
        activityCard.appendChild(title);

        const description = document.createElement("p");
        description.textContent = details.description;
        activityCard.appendChild(description);

        const schedule = document.createElement("p");
        const scheduleLabel = document.createElement("strong");
        scheduleLabel.textContent = "Schedule: ";
        schedule.append(scheduleLabel, details.schedule);
        activityCard.appendChild(schedule);

        const spotsLeft = details.max_participants - details.participants.length;
        const availability = document.createElement("p");
        availability.className = "availability";
        const availabilityLabel = document.createElement("strong");
        availabilityLabel.textContent = "Availability: ";
        availability.append(availabilityLabel, `${spotsLeft} spots left`);
        activityCard.appendChild(availability);

        const participantsSection = document.createElement("div");
        participantsSection.className = "participants-section";
        const participantsTitle = document.createElement("h5");
        participantsTitle.textContent = "Participants";
        participantsSection.appendChild(participantsTitle);

        if (details.participants.length > 0) {
          const participantsList = document.createElement("ul");
          participantsList.className = "participants-list";
          details.participants.forEach((email) => {
            const participant = document.createElement("li");
            const participantEmail = document.createElement("span");
            participantEmail.className = "participant-email";
            participantEmail.textContent = email;

            const unregisterButton = document.createElement("button");
            unregisterButton.type = "button";
            unregisterButton.className = "unregister-btn";
            unregisterButton.textContent = "Unregister";
            unregisterButton.setAttribute(
              "aria-label",
              `Unregister ${email} from ${name}`
            );
            unregisterButton.dataset.activity = name;
            unregisterButton.dataset.email = email;
            unregisterButton.addEventListener("click", handleUnregister);

            participant.append(participantEmail, unregisterButton);
            participantsList.appendChild(participant);
          });
          participantsSection.appendChild(participantsList);
        } else {
          const emptyParticipants = document.createElement("p");
          emptyParticipants.className = "empty-participants";
          emptyParticipants.textContent = "No participants yet";
          participantsSection.appendChild(emptyParticipants);
        }
        activityCard.appendChild(participantsSection);

        const registerButton = document.createElement("button");
        registerButton.type = "button";
        registerButton.className = "register-btn";
        registerButton.textContent = "Register student";
        registerButton.setAttribute("aria-label", `Register student for ${name}`);
        registerButton.addEventListener("click", () => openSignupDialog(name));
        activityCard.appendChild(registerButton);

        activitiesList.appendChild(activityCard);
      });
    } catch (error) {
      activitiesList.textContent =
        "Failed to load activities. Please try again later.";
      console.error("Error fetching activities:", error);
    }
  }

  async function handleUnregister(event) {
    const button = event.currentTarget;
    const activity = button.dataset.activity;
    const email = button.dataset.email;

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
        showMessage(result.message, "success");
        fetchActivities();
      } else {
        showMessage(result.detail || "An error occurred", "error");
      }
    } catch (error) {
      showMessage("Failed to unregister. Please try again.", "error");
      console.error("Error unregistering:", error);
    }
  }

  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = emailInput.value;
    const activity = signupForm.dataset.activity;

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
        signupDialog.close();
        showMessage(result.message, "success");
        fetchActivities();
      } else {
        signupFeedback.textContent = result.detail || "An error occurred";
        signupFeedback.className = "error";
      }
    } catch (error) {
      signupFeedback.textContent = "Failed to sign up. Please try again.";
      signupFeedback.className = "error";
      console.error("Error signing up:", error);
    }
  });

  document.getElementById("cancel-signup").addEventListener("click", () => {
    signupDialog.close();
  });

  fetchActivities();
});
