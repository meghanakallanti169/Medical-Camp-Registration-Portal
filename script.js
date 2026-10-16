

"use strict";

// ==================================================
// REGISTRATION SECTION & NAVIGATION
// ==================================================

const registrationSection =
    document.getElementById("registration");

const registrationLink =
    document.getElementById("registrationLink");

const registrationTriggers =
    document.querySelectorAll(".registration-trigger");


// ==================================================
// SHOW REGISTRATION FORM
// ==================================================

function showRegistration() {
    if (!registrationSection) return;

    registrationSection.classList.add("show");

    setTimeout(function () {
        registrationSection.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });
    }, 50);
}


// ==================================================
// REGISTRATION NAVIGATION LINK
// ==================================================

if (registrationLink) {
    registrationLink.addEventListener("click", function (event) {
        event.preventDefault();
        showRegistration();
    });
}


// ==================================================
// CAMP REGISTRATION BUTTONS
// ==================================================

registrationTriggers.forEach(function (button) {
    button.addEventListener("click", function (event) {
        event.preventDefault();

        showRegistration();

        // Automatically select the camp whose button was clicked.
        const campCard = button.closest(".camp-card");
        const campSelect = document.getElementById("camp");

        if (campCard && campSelect) {
            const campHeading = campCard.querySelector("h3");

            if (campHeading) {
                const campName = campHeading.textContent.trim();

                const matchingOption = Array.from(
                    campSelect.options
                ).find(function (option) {
                    return option.text.trim() === campName;
                });

                if (matchingOption) {
                    campSelect.value = matchingOption.value;
                }
            }
        }
    });
});


// ==================================================
// REGISTRATION FORM ELEMENTS
// ==================================================

const registrationForm =
    document.getElementById("registrationForm");

const confirmationMessage =
    document.getElementById("confirmationMessage");


// ==================================================
// REGISTRATION FORM SUBMISSION
// CONNECT TO EXPRESS BACKEND + MONGODB
// ==================================================

if (registrationForm && confirmationMessage) {
    registrationForm.addEventListener("submit", async function (event) {
        event.preventDefault();

        // Clear the previous message.
        confirmationMessage.textContent = "";
        confirmationMessage.style.color = "";

        const name = document
            .getElementById("name")
            .value
            .trim();

        const age = document
            .getElementById("age")
            .value
            .trim();

        const contact = document
            .getElementById("contact")
            .value
            .trim();

        const campSelect = document.getElementById("camp");
        const camp = campSelect.value;

        // --------------------------------------------------
        // REQUIRED FIELD VALIDATION
        // --------------------------------------------------

        if (!name || !age || !contact || !camp) {
            showError("Please complete all required fields.");
            return;
        }

        // --------------------------------------------------
        // NAME VALIDATION
        // --------------------------------------------------

        if (name.length < 2) {
            showError("Please enter a valid full name.");
            return;
        }

        // --------------------------------------------------
        // AGE VALIDATION
        // --------------------------------------------------

        const numericAge = Number(age);

        if (
            !Number.isInteger(numericAge) ||
            numericAge < 1 ||
            numericAge > 120
        ) {
            showError(
                "Please enter a whole-number age between 1 and 120."
            );
            return;
        }

        // --------------------------------------------------
        // CONTACT VALIDATION
        // --------------------------------------------------

        if (!/^[0-9]{10}$/.test(contact)) {
            showError(
                "Please enter a valid 10-digit contact number."
            );
            return;
        }

        // --------------------------------------------------
        // CAMP VALIDATION
        // --------------------------------------------------

        const selectedOption =
            campSelect.options[campSelect.selectedIndex];

        if (!selectedOption || !selectedOption.value) {
            showError("Please select a medical camp.");
            return;
        }

        const selectedCamp = selectedOption.text.trim();

        // --------------------------------------------------
        // SUBMIT REGISTRATION TO BACKEND
        // --------------------------------------------------

        const submitButton = registrationForm.querySelector(
            'button[type="submit"]'
        );

        if (submitButton) {
            submitButton.disabled = true;
            submitButton.textContent = "Registering...";
        }

        try {
            const response = await fetch("/api/registrations", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    name: name,
                    age: numericAge,
                    contact: contact,
                    camp: camp
                })
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(
                    result.message || "Registration failed."
                );
            }

            // --------------------------------------------------
            // SUCCESS MESSAGE
            // Only shown after the backend confirms success.
            // --------------------------------------------------

            confirmationMessage.textContent =
                `Registration successful! ${name}, you have registered for ${selectedCamp}.`;

            confirmationMessage.style.color = "#087ea4";
            confirmationMessage.setAttribute("role", "status");
            confirmationMessage.setAttribute("aria-live", "polite");

            // Clear the form only after successful database saving.
            registrationForm.reset();

        } catch (error) {
            console.error("Registration error:", error);

            showError(
                error.message ||
                "Unable to connect to the server. Please try again."
            );
        } finally {
            if (submitButton) {
                submitButton.disabled = false;
                submitButton.textContent = "Register for Camp";
            }
        }
    });
}


// ==================================================
// DISPLAY ERROR MESSAGES
// ==================================================

function showError(message) {
    if (!confirmationMessage) return;

    confirmationMessage.textContent = message;
    confirmationMessage.style.color = "#c0392b";
    confirmationMessage.setAttribute("role", "alert");
    confirmationMessage.setAttribute("aria-live", "assertive");
}
