// --- DOM Element References ---
// **** REMOVED: Form element references ****
const testListBody = document.getElementById('test-list-body');
const noTestsMessage = document.getElementById('no-tests-message');
const clearAllButton = document.getElementById('clear-all-button');
const testListTable = document.getElementById('test-list-table');
const typeFilterButtonsDiv = document.getElementById('type-filter-buttons');
// **** REMOVED: Pagination element references ****

// --- Application State ---
let allTests = [];
let filteredTests = [];
let uniqueTypes = new Set();
let currentTypeFilter = 'All';
// **** REMOVED: currentPage, itemsPerPage, selectedRecordIndexForForm ****
let currentlyEditingIndex = null; // Track which record index is being edited inline
let currentlyEditingElement = null; // Track the input element being edited

// --- CSV Parsing Function (remains the same) ---
function parseCSV(csvText) { /* ... */ }
function parseCSV(csvText) {
    const lines = csvText.trim().split('\n'); if (lines.length < 2) return [];
    const headers = lines[0].split(',').map(header => header.trim()); const data = [];
    for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(val => val.trim().replace(/^"|"$/g, ''));
        if (values.length === headers.length) {
            const rowObject = {}; headers.forEach((header, index) => { rowObject[header] = values[index]; }); data.push(rowObject);
        } else { console.warn(`Skipping malformed CSV line ${i + 1}: ${lines[i]}`); }
    } return data;
}

// --- Data Handling Functions (remains the same) ---
function saveTests() { localStorage.setItem('tests', JSON.stringify(allTests)); }
function calculatePercentage(correct, totalMarks) { /* ... */ }
function calculatePercentage(correct, totalMarks) {
    const numCorrect = parseFloat(correct); const numTotal = parseFloat(totalMarks);
    if (isNaN(numCorrect) || isNaN(numTotal) || numTotal === 0) return 0;
    return ((numCorrect / numTotal) * 100).toFixed(1);
}


// --- UI Update Functions ---

// **** REMOVED: populateTypeDropdown, updateTestNameOptions ****

// Render filter buttons (populates uniqueTypes) - remains the same
function renderTypeFilterButtons() { /* ... */ }
function renderTypeFilterButtons() {
    typeFilterButtonsDiv.innerHTML = ''; uniqueTypes.clear();
    allTests.forEach(test => { if (test.type) uniqueTypes.add(test.type); });
    const allButton = document.createElement('button'); allButton.textContent = 'All Types'; allButton.dataset.type = 'All'; if (currentTypeFilter === 'All') allButton.classList.add('active-filter'); typeFilterButtonsDiv.appendChild(allButton);
    const sortedTypes = Array.from(uniqueTypes).sort();
    sortedTypes.forEach(type => {
        const typeButton = document.createElement('button'); typeButton.textContent = type; typeButton.dataset.type = type; if (currentTypeFilter === type) typeButton.classList.add('active-filter'); typeFilterButtonsDiv.appendChild(typeButton);
    });
}

// Apply filter - remains the same logic, but no pagination reset needed
function applyFilter() {
    if (currentTypeFilter === 'All') { filteredTests = [...allTests]; }
    else { filteredTests = allTests.filter(test => test.type === currentTypeFilter); }
    // No currentPage reset needed
}

// **** REMOVED: updatePaginationUI ****

// Render table (Major changes: no pagination, setup for inline editing)
function renderTable() {
    // If currently editing, save or cancel before re-rendering
    if (currentlyEditingIndex !== null) {
        saveOrCancelEdit(true); // Attempt to save existing edit before full render
    }
    testListBody.innerHTML = ''; // Clear table

    if (!filteredTests || filteredTests.length === 0) {
        noTestsMessage.style.display = 'block';
        testListTable.style.display = 'none';
        clearAllButton.style.display = allTests.length > 0 ? 'block' : 'none';
    } else {
        noTestsMessage.style.display = 'none';
        testListTable.style.display = 'table';
        clearAllButton.style.display = 'block';

        // **** CHANGED: Loop through ALL filtered tests, no slicing ****
        filteredTests.forEach((test) => {
            const originalIndex = allTests.findIndex(t => t === test); // Still need original index for updates/deletes
            const row = document.createElement('tr');

            const name = test.name || 'N/A';
            const type = test.type || 'N/A';
            const correct = test.correct !== undefined ? test.correct : 'N/A'; // Handle potential undefined
            const totalMarks = test.totalMarks !== undefined ? test.totalMarks : 'N/A'; // Handle potential undefined
            const percentage = calculatePercentage(correct, totalMarks);

            // **** CHANGED: Setup for Correct Answers cell inline editing ****
            row.innerHTML = `
                <td>${name}</td>
                <td>${type}</td>
                <td class="editable-correct" data-index="${originalIndex}">
                    <span>${correct}</span>
                </td>
                <td>${totalMarks}</td>
                <td>${percentage}%</td>
                <td><button class="delete-button" data-original-index="${originalIndex}">Delete</button></td>
            `;
            // **** END CHANGE ****
            testListBody.appendChild(row);
        });
    }
    // **** REMOVED: updatePaginationUI() call ****
}

// --- Inline Editing Functions ---

// Function to switch cell to edit mode
function startEditing(cell, index) {
    // If already editing another cell, save/cancel it first
    if (currentlyEditingIndex !== null && currentlyEditingIndex !== index) {
        saveOrCancelEdit(true); // Attempt save
    }
    // Prevent starting edit if already editing this cell
    if (currentlyEditingIndex === index) return;


    currentlyEditingIndex = index;
    currentlyEditingElement = cell; // Store the TD element

    const currentCorrectValue = allTests[index].correct;
    const totalMarks = allTests[index].totalMarks;

    // Replace span with input
    cell.innerHTML = `
        <input type="number" class="inline-edit-input"
               value="${currentCorrectValue}"
               min="0"
               max="${totalMarks}"
               data-original-value="${currentCorrectValue}" />
    `;

    const input = cell.querySelector('.inline-edit-input');
    input.focus();
    input.select(); // Select text for easy replacement

    // Add event listeners to the new input
    input.addEventListener('keydown', handleEditKeyDown);
    input.addEventListener('blur', handleEditBlur);
}

// Handle Enter/Escape keys during edit
function handleEditKeyDown(event) {
    if (event.key === 'Enter') {
        event.preventDefault(); // Prevent potential form submission
        saveOrCancelEdit(true); // Save on Enter
    } else if (event.key === 'Escape') {
        saveOrCancelEdit(false); // Cancel on Escape
    }
}

// Handle losing focus (blur) during edit - treat as save attempt
function handleEditBlur() {
    // Use setTimeout to allow other clicks (like delete) to register before blur saves/cancels
    setTimeout(() => {
       // Check if we are still in edit mode for this element before processing blur
       if (currentlyEditingElement && currentlyEditingElement.contains(document.activeElement)) {
           // If focus moved within the cell (e.g., to a button we might add later), don't process blur yet.
           return;
       }
       if (currentlyEditingIndex !== null) {
           saveOrCancelEdit(true); // Save on blur
       }
   }, 100); // Small delay
}


// Save or cancel the current inline edit
function saveOrCancelEdit(attemptSave) {
    if (currentlyEditingIndex === null || !currentlyEditingElement) return; // Not editing

    const input = currentlyEditingElement.querySelector('.inline-edit-input');
    const index = currentlyEditingIndex; // Index in allTests
    const originalValue = input.dataset.originalValue;
    let saved = false;

    if (attemptSave) {
        const newValueStr = input.value;
        const newValue = parseInt(newValueStr, 10);
        const totalMarks = allTests[index].totalMarks;

        // --- Validation ---
        if (isNaN(newValue) || newValue < 0 || newValue > totalMarks) {
             console.error("Invalid input value. Reverting.");
             // Optionally provide user feedback (e.g., flash border red)
             attemptSave = false; // Force cancel if validation fails
        } else {
            // --- Update Data ---
            console.log(`Updating index ${index} from ${allTests[index].correct} to ${newValue}`);
            allTests[index].correct = newValue;
            saveTests(); // Save updated data to Local Storage
            saved = true;
        }
    }

    // --- Revert UI ---
    // Replace input with span, using new value if saved, original if cancelled/invalid
    currentlyEditingElement.innerHTML = `<span>${saved ? allTests[index].correct : originalValue}</span>`;

     // If saved, recalculate and update percentage in the same row
     if(saved){
        const percentageCell = currentlyEditingElement.nextElementSibling.nextElementSibling; // Find percentage cell relative to correct cell
        if (percentageCell) {
             percentageCell.textContent = calculatePercentage(allTests[index].correct, allTests[index].totalMarks) + '%';
        }
     }


    // --- Reset editing state ---
    currentlyEditingIndex = null;
    currentlyEditingElement = null;

    // Optional: Re-render the whole table if simpler, but updating cell is faster
    // renderTable(); // Uncomment if updating just the cell is problematic
}


// --- Actions ---

// **** REMOVED: updateTest (formerly addTest) function ****

// Delete test (remains mostly the same, ensure editing is cancelled)
function deleteTest(originalIndex) {
    if (originalIndex < 0 || originalIndex >= allTests.length) return;

    // If deleting the row currently being edited, cancel the edit first
    if(currentlyEditingIndex === originalIndex){
        saveOrCancelEdit(false); // Cancel edit
    }

    if (confirm(`Are you sure you want to delete the test "${allTests[originalIndex].name}"?`)) {
        allTests.splice(originalIndex, 1);
        saveTests();
        // Re-filter and re-render
        renderTypeFilterButtons(); // Update filters (type might disappear)
        applyFilter();
        renderTable();
    }
}

// Clear all tests (remains mostly the same, ensure editing is cancelled)
function clearAllTests() {
     if (confirm('Are you sure you want to delete ALL recorded tests? This cannot be undone.')) {
         // Cancel any ongoing edit
         saveOrCancelEdit(false);

         allTests = []; filteredTests = []; uniqueTypes.clear();
         currentTypeFilter = 'All';
         localStorage.removeItem('tests');
         renderTypeFilterButtons();
         // No form dropdowns to clear
         renderTable(); // Re-render empty state
     }
}

// **** REMOVED: goToPrevPage, goToNextPage functions ****

// --- Event Listeners ---

// **** REMOVED: Form submit listener ****
// **** REMOVED: testTypeInput change listener ****
// **** REMOVED: testNameInput change listener ****


// **** UPDATED: testListBody click listener for edit AND delete ****
testListBody.addEventListener('click', (event) => {
    const target = event.target;

    // --- Handle Delete Button Click ---
    if (target.classList.contains('delete-button')) {
        const originalIndexToDelete = parseInt(target.getAttribute('data-original-index'), 10);
        if (!isNaN(originalIndexToDelete)) {
            deleteTest(originalIndexToDelete);
        }
        return; // Stop further processing if delete was clicked
    }

    // --- Handle Click on Editable Cell (or span within it) ---
    const editableCell = target.closest('.editable-correct'); // Find parent TD if span was clicked
    if (editableCell) {
         const indexToEdit = parseInt(editableCell.dataset.index, 10);
         if (!isNaN(indexToEdit)) {
             startEditing(editableCell, indexToEdit);
         }
    }
    // If click elsewhere inside the table body, and currently editing, trigger save/cancel via blur
    else if (currentlyEditingIndex !== null){
         const inputElement = currentlyEditingElement?.querySelector('.inline-edit-input');
         if (inputElement && document.activeElement === inputElement) {
              inputElement.blur(); // Trigger blur/save if editing and clicked elsewhere
         } else if (currentlyEditingIndex !== null) {
              // Failsafe if somehow blur wasn't triggered but state is still editing
              saveOrCancelEdit(true);
         }
    }
});
// **** END UPDATE ****


// Listener for filter button clicks (remains the same)
typeFilterButtonsDiv.addEventListener('click', (event) => { /* ... */ });
typeFilterButtonsDiv.addEventListener('click', (event) => { if (event.target.tagName === 'BUTTON') { const selectedType = event.target.dataset.type; if (selectedType) { currentTypeFilter = selectedType; renderTypeFilterButtons(); applyFilter(); renderTable(); } } });


clearAllButton.addEventListener('click', clearAllTests);
// **** REMOVED: Pagination button listeners ****

// --- Initial Data Loading (remains mostly the same) ---
async function loadInitialData() { /* ... */ }
async function loadInitialData() {
    try {
        const response = await fetch('./Licence Preparation DB.csv'); if (!response.ok) throw new Error(`CSV not found (${response.status})`); const csvText = await response.text(); const parsedData = parseCSV(csvText);
        allTests = parsedData.map(csvRow => ({ name: csvRow['Test'] || 'Unnamed Test', type: csvRow['Type'] || 'Unknown', correct: parseInt(csvRow['Correct'], 10) || 0, totalMarks: parseInt(csvRow['Total Marks'], 10) || 0 }));
        console.log(`Loaded ${allTests.length} tests from CSV.`);
    } catch (error) {
        console.warn('Could not load data from CSV:', error.message); console.log('Attempting to load from Local Storage...'); const storedTests = localStorage.getItem('tests'); allTests = storedTests ? JSON.parse(storedTests) : []; console.log(`Loaded ${allTests.length} tests from Local Storage.`);
    } finally {
        currentlyEditingIndex = null; // Ensure no edit state initially
        currentlyEditingElement = null;
        renderTypeFilterButtons();
        // **** REMOVED: Calls related to form dropdowns ****
        applyFilter();
        renderTable();
    }
}


// --- Start the App ---
loadInitialData(); // Load data and initialize the UI