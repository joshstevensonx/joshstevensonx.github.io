// js/script.js

document.addEventListener('DOMContentLoaded', function() {
    const hamburger = document.querySelector('.hamburger');
    const navLinks = document.querySelector('.nav-links');
    const links = document.querySelectorAll('.nav-links li a'); // Get all nav links

    if (hamburger && navLinks) {
        hamburger.addEventListener('click', () => {
            navLinks.classList.toggle('active'); // Toggle visibility of nav links

            // Hamburger Animation
            hamburger.classList.toggle('toggle');
        });
    }

    // Close navbar when a link is clicked (optional, good for SPAs or single-page feel)
    // For a multi-page site, this helps if the menu stays open after navigation.
    if (links && navLinks && hamburger) {
        links.forEach(link => {
            link.addEventListener('click', () => {
                if (navLinks.classList.contains('active')) {
                    navLinks.classList.remove('active');
                    hamburger.classList.remove('toggle'); // Reset hamburger animation
                }
            });
        });
    }

    // Set active class for current page link in navigation
    const currentPath = window.location.pathname.split("/").pop() || "index.html";
    const navAnchors = document.querySelectorAll('nav ul li a');

    navAnchors.forEach(link => {
        const linkPath = link.getAttribute('href').split("/").pop();
        if (linkPath === currentPath) {
            link.classList.add('active');
        }
    });

});

// Add styles for hamburger animation (optional, can be in style.css too)
// If you prefer to keep all CSS in .css files, move the .toggle styles to style.css
const styleSheet = document.createElement("style");
styleSheet.type = "text/css";
styleSheet.innerText = `
.hamburger.toggle .line1 {
    transform: rotate(-45deg) translate(-5px, 6px);
}
.hamburger.toggle .line2 {
    opacity: 0;
}
.hamburger.toggle .line3 {
    transform: rotate(45deg) translate(-5px, -6px);
}
`;
document.head.appendChild(styleSheet);