document.addEventListener("DOMContentLoaded", () => {
    const header = document.querySelector('.site-header');
    const mobileMenuButton = document.querySelector('.site-header__mobile-menu-button');
    const mobileNav = document.createElement('div');
    mobileNav.classList.add('mobile-nav');

    // Create the mobile navigation content dynamically
    mobileNav.innerHTML = `
        <button class="mobile-nav__close-button" aria-label="Close navigation menu">
            <svg class="mobile-nav__close-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
        </button>
        <ul class="mobile-nav__list">
            <li class="mobile-nav__item"><a href="about.html" class="mobile-nav__link">About</a></li>
            <li class="mobile-nav__item"><a href="services.html" class="mobile-nav__link">Services</a></li>
            <li class="mobile-nav__item"><a href="work.html" class="mobile-nav__link">Work</a></li>
            <li class="mobile-nav__item"><a href="insights.html" class="mobile-nav__link">Insights</a></li>
            <li class="mobile-nav__item"><a href="contact.html" class="mobile-nav__link">Contact</a></li>
        </ul>
    `;
    document.body.appendChild(mobileNav);

    const mobileNavCloseButton = mobileNav.querySelector('.mobile-nav__close-button');

    // Toggle mobile navigation
    mobileMenuButton.addEventListener('click', () => {
        mobileNav.classList.add('is-open');
    });

    mobileNavCloseButton.addEventListener('click', () => {
        mobileNav.classList.remove('is-open');
    });

    // Sticky header functionality
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            header.classList.add('is-sticky');
        } else {
            header.classList.remove('is-sticky');
        }
    });
});