document.addEventListener('DOMContentLoaded', function() {
    
    /**
     * Mobile Menu Toggle
     */
    const navToggle = document.querySelector('.nav__toggle');
    const mobileNav = document.querySelector('.nav--mobile');
    
    if (navToggle && mobileNav) {
        navToggle.addEventListener('click', () => {
            mobileNav.classList.toggle('is-active');
            // Optional: Add ARIA attribute toggling for accessibility
            const isExpanded = mobileNav.classList.contains('is-active');
            navToggle.setAttribute('aria-expanded', isExpanded);
        });
    }

    /**
     * Set Current Year in Footer
     */
    const yearSpan = document.getElementById('current-year');
    if (yearSpan) {
        yearSpan.textContent = new Date().getFullYear();
    }

    /**
     * Scroll-triggered Fade-in Animation
     */
    const fadeInElements = document.querySelectorAll('.fade-in');
    
    if (fadeInElements.length > 0) {
        const observer = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                // If the element is in the viewport
                if (entry.isIntersecting) {
                    // Add the 'is-visible' class to trigger the animation
                    entry.target.classList.add('is-visible');
                    // Stop observing the element once it's visible
                    observer.unobserve(entry.target);
                }
            });
        }, { 
            threshold: 0.1 // Trigger when 10% of the element is visible
        });

        // Observe each element with the 'fade-in' class
        fadeInElements.forEach(el => {
            observer.observe(el);
        });
    }
});