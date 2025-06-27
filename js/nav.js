document.addEventListener('DOMContentLoaded', function() {
    
    /**
     * Mobile Menu Toggle (Original Script)
     */
    const navToggle = document.querySelector('.nav__toggle');
    const mobileNav = document.querySelector('.nav--mobile');
    
    if (navToggle && mobileNav) {
        navToggle.addEventListener('click', (e) => {
            // Stop this click from being caught by the document listener
            e.stopPropagation(); 
            mobileNav.classList.toggle('is-active');
            const isExpanded = mobileNav.classList.contains('is-active');
            navToggle.setAttribute('aria-expanded', isExpanded);
        });
    }

    /**
     * Set Current Year in Footer (Original Script)
     */
    const yearSpan = document.getElementById('current-year');
    if (yearSpan) {
        yearSpan.textContent = new Date().getFullYear();
    }

    /**
     * Scroll-triggered Fade-in Animation (Original Script)
     */
    const fadeInElements = document.querySelectorAll('.fade-in');
    
    if (fadeInElements.length > 0) {
        const observer = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-visible');
                    observer.unobserve(entry.target);
                }
            });
        }, { 
            threshold: 0.1
        });

        fadeInElements.forEach(el => {
            observer.observe(el);
        });
    }


    /**
     * NEW: Dropdown Menu Logic
     */
    const dropdownToggles = document.querySelectorAll('.dropdown-toggle');

    // Function to close all open dropdowns
    function closeAllDropdowns(exceptThisToggle = null) {
        document.querySelectorAll('.dropdown-menu.is-open').forEach(menu => {
           const toggle = menu.closest('.nav__item--dropdown').querySelector('.dropdown-toggle');
           // Only close if it's not the one we just clicked
           if (toggle !== exceptThisToggle) {
               menu.classList.remove('is-open');
               toggle.classList.remove('is-open');
               toggle.setAttribute('aria-expanded', 'false');
           }
        });
    }

    dropdownToggles.forEach(toggle => {
        toggle.addEventListener('click', (e) => {
            e.preventDefault(); // Prevent default button behavior
            e.stopPropagation(); // Stop the click from closing the menu immediately

            const dropdownItem = toggle.closest('.nav__item--dropdown');
            const dropdownMenu = dropdownItem.querySelector('.dropdown-menu');
            const isExpanded = toggle.getAttribute('aria-expanded') === 'true';

            // First, close any other dropdowns that might be open
            closeAllDropdowns(toggle);
            
            // Now, toggle the current one
            if (!isExpanded) {
                dropdownMenu.classList.add('is-open');
                toggle.classList.add('is--open');
                toggle.setAttribute('aria-expanded', 'true');
            } else {
                 dropdownMenu.classList.remove('is-open');
                 toggle.classList.remove('is-open');
                 toggle.setAttribute('aria-expanded', 'false');
            }
        });
    });

    // Global click listener to close menus when clicking outside
    document.addEventListener('click', function(e) {
        // Close dropdowns if the click is outside a dropdown item
        if (!e.target.closest('.nav__item--dropdown')) {
            closeAllDropdowns();
        }

        // Close mobile nav if the click is outside the nav toggle and the nav menu itself
        if (mobileNav && mobileNav.classList.contains('is-active')) {
           if (!e.target.closest('.nav--mobile') && !e.target.closest('.nav__toggle')) {
               mobileNav.classList.remove('is-active');
               navToggle.setAttribute('aria-expanded', 'false');
           }
        }
    });
    
    // Prevent clicks inside the mobile nav from closing it (unless it's a link)
    if(mobileNav) {
        mobileNav.addEventListener('click', function(e) {
            // Let dropdown toggles work, but stop other clicks from bubbling up to the document
            if (!e.target.closest('.dropdown-toggle')) {
                // e.stopPropagation();
            }
        });
    }

});
