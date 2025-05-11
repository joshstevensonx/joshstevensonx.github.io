// js/projects.js

document.addEventListener('DOMContentLoaded', function() {
    const filterButtons = document.querySelectorAll('.filter-buttons .filter-btn');
    const projectCards = document.querySelectorAll('.projects-grid .project-card');

    if (filterButtons.length > 0 && projectCards.length > 0) {
        filterButtons.forEach(button => {
            button.addEventListener('click', function() {
                // Manage active state for buttons
                filterButtons.forEach(btn => btn.classList.remove('active'));
                this.classList.add('active');

                const filterValue = this.getAttribute('data-filter');

                projectCards.forEach(card => {
                    const cardCategory = card.getAttribute('data-category');
                    if (filterValue === 'all' || cardCategory === filterValue) {
                        card.classList.remove('hide');
                        // card.style.display = 'block'; // Or 'flex' if your card uses it
                    } else {
                        card.classList.add('hide');
                        // card.style.display = 'none';
                    }
                });
            });
        });
    }

    // Log to confirm script is loaded (optional)
    console.log("Projects page specific JavaScript loaded.");
});