// js/contact.js

document.addEventListener('DOMContentLoaded', function() {
    const contactForm = document.getElementById('contactForm');
    const formStatusMessage = document.getElementById('form-status-message');

    if (contactForm) {
        contactForm.addEventListener('submit', function(event) {
            event.preventDefault(); // Prevent actual form submission

            // Clear previous status messages and errors
            clearAllErrors();
            if (formStatusMessage) formStatusMessage.textContent = '';
            if (formStatusMessage) formStatusMessage.className = '';


            let isValid = true;

            // --- Basic Validation ---
            // Name
            const nameField = document.getElementById('name');
            if (!validateRequired(nameField)) {
                isValid = false;
            }

            // Email
            const emailField = document.getElementById('email');
            if (!validateRequired(emailField)) {
                isValid = false;
            } else if (!validateEmailFormat(emailField)) {
                isValid = false;
            }

            // Subject
            const subjectField = document.getElementById('subject');
            if (!validateRequired(subjectField)) {
                isValid = false;
            }

            // Message
            const messageField = document.getElementById('message');
            if (!validateRequired(messageField)) {
                isValid = false;
            }
            // --- End Basic Validation ---


            if (isValid) {
                // Simulate form submission (since there's no backend)
                console.log('Form is valid. Simulating submission...');
                console.log({
                    name: nameField.value,
                    email: emailField.value,
                    subject: subjectField.value,
                    message: messageField.value
                });

                if (formStatusMessage) {
                    formStatusMessage.textContent = 'Thank you! Your message has been "sent" (simulated).';
                    formStatusMessage.classList.add('success');
                }
                contactForm.reset(); // Clear the form fields

                // Remove success message after a few seconds
                setTimeout(() => {
                    if (formStatusMessage) formStatusMessage.textContent = '';
                    if (formStatusMessage) formStatusMessage.className = '';
                }, 5000);

            } else {
                console.log('Form has validation errors.');
                if (formStatusMessage) {
                    formStatusMessage.textContent = 'Please correct the errors in the form.';
                    formStatusMessage.classList.add('error');
                }
            }
        });
    }

    function validateRequired(field) {
        const errorField = field.parentElement.querySelector('.form-error-message');
        if (field.value.trim() === '') {
            field.classList.add('input-error'); // Optional: add class to field itself
            if (errorField) errorField.textContent = `${field.previousElementSibling.textContent} is required.`;
            return false;
        }
        field.classList.remove('input-error');
        if (errorField) errorField.textContent = '';
        return true;
    }

    function validateEmailFormat(field) {
        const errorField = field.parentElement.querySelector('.form-error-message');
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(field.value.trim())) {
            field.classList.add('input-error');
            if (errorField) errorField.textContent = 'Please enter a valid email address.';
            return false;
        }
        field.classList.remove('input-error');
        if (errorField) errorField.textContent = '';
        return true;
    }

    function clearAllErrors() {
        const errorMessages = document.querySelectorAll('.form-error-message');
        errorMessages.forEach(msg => msg.textContent = '');
        const inputErrors = document.querySelectorAll('.input-error');
        inputErrors.forEach(input => input.classList.remove('input-error'));
    }

    // Log to confirm script is loaded
    console.log("Contact page specific JavaScript loaded.");
});