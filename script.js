document.addEventListener('DOMContentLoaded', function() {
    
    // Select all "More Info" buttons
    const toggles = document.querySelectorAll('.toggle-trigger');

    toggles.forEach(trigger => {
        trigger.addEventListener('click', function(e) {
            e.preventDefault();

            // 1. Find the parent row
            const parentRow = this.closest('.casino-row');
            
            // 2. Find the associated detail panel (it's the next sibling in DOM)
            // We use parentNode to go up to casino-item, then find .casino-detail-panel
            const detailPanel = parentRow.nextElementSibling;
            
            // 3. Toggle Visibility
            const icon = this.querySelector('i');
            
            if (detailPanel.style.display === "none" || detailPanel.style.display === "") {
                detailPanel.style.display = "block";
                this.innerHTML = `Close Info <i class="fa-solid fa-chevron-up"></i>`;
                parentRow.style.backgroundColor = "#252930"; // Keep row highlighted
            } else {
                detailPanel.style.display = "none";
                this.innerHTML = `More Info <i class="fa-solid fa-chevron-down"></i>`;
                parentRow.style.backgroundColor = ""; // Reset row color
            }
        });
    });

});