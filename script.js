// --- DOM Element References ---
const form = document.getElementById('add-test-form');
const testTypeInput = document.getElementById('test-type'); // Type Select
const testNameInput = document.getElementById('test-name'); // Test Name Select
const correctAnswersInput = document.getElementById('correct-answers');
const totalMarksInput = document.getElementById('total-marks');
const testListBody = document.getElementById('test-list-body');
const noTestsMessage = document.getElementById('no-tests-message');
const clearAllButton = document.getElementById('clear-all-button');
const testListTable = document.getElementById('test-list-table');
const typeFilterButtonsDiv = document.getElementById('type-filter-buttons');
const paginationControlsDiv = document.querySelector('.pagination-controls');
const prevPageButton = document.getElementById('prev-page');
const nextPageButton = document.getElementById('next-page');
const pageInfoSpan = document.getElementById('page-info');

// --- Application State ---
let allTests = [];
let filteredTests = [];
let uniqueTypes = new Set();
// No need for global uniqueNames set anymore for the form
let currentTypeFilter = 'All';
let currentPage = 1;
const itemsPerPage = 10;

// --- CSV Parsing Function (remains the same) ---
function parseCSV(csvText) {
    const lines = csvText.trim().split('\n');
    if (lines.length < 2) return [];
    const headers = lines[0].split(',').map(header => header.trim());
    const data = [];
    for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(val => val.trim().replace(/^"|"$/g, ''));
        if (values.length === headers.length) {
            const rowObject = {};
            headers.forEach((header, index) => { rowObject[header] = values[index]; });
            data.push(rowObject);
        } else { console.warn(`Skipping malformed CSV line ${i + 1}: ${lines[i]}`); }
    }
    return data;
}

// --- Data Handling Functions (remains the same) ---
function saveTests() { localStorage.setItem('tests', JSON.stringify(allTests)); }
function calculatePercentage(correct, totalMarks) {
    const numCorrect = parseFloat(correct); const numTotal = parseFloat(totalMarks);
    if (isNaN(numCorrect) || isNaN(numTotal) || numTotal === 0) return 0;
    return ((numCorrect / numTotal) * 100).toFixed(1);
}

// --- UI Update Functions ---

// **** CHANGED: Renamed and simplified to only populate Type dropdown ****
function populateTypeDropdown() {
    // uniqueTypes set is populated within renderTypeFilterButtons
    testTypeInput.innerHTML = '<option value="" disabled selected>-- Select Type --</option>'; // Reset
    const sortedTypes = Array.from(uniqueTypes).sort();
    sortedTypes.forEach(type => {
        const option = document.createElement('option');
        option.value = type; option.textContent = type;
        testTypeInput.appendChild(option);
    });
}
// **** END CHANGE ****

// **** NEW: Function to update Test Name options based on selected Type ****
function updateTestNameOptions(selectedType) {
    const testNameSelect = testNameInput; // Use the global reference
    testNameSelect.innerHTML = '<option value="" disabled selected>-- Select Test Name --</option>'; // Reset

    if (!selectedType) {
        testNameSelect.disabled = true; // Disable if no type selected
        return;
    }

    // Find tests matching the selected type
    const testsOfType = allTests.filter(test => test.type === selectedType);
    const namesOfType = new Set(testsOfType.map(test => test.name)); // Get unique names for this type

    if (namesOfType.size === 0) {
        testNameSelect.disabled = true; // Disable if type has no tests
         // Optional: Add a message option
         const noTestOption = document.createElement('option');
         noTestOption.value = "";
         noTestOption.textContent = "-- No tests found for this type --";
         noTestOption.disabled = true;
         testNameSelect.appendChild(noTestOption);
    } else {
        const sortedNames = Array.from(namesOfType).sort();
        sortedNames.forEach(name => {
            const option = document.createElement('option');
            option.value = name; option.textContent = name;
            testNameSelect.appendChild(option);
        });
        testNameSelect.disabled = false; // Enable the dropdown
    }
}
// **** END NEW ****

// Render filter buttons (populates uniqueTypes)
function renderTypeFilterButtons() {
    typeFilterButtonsDiv.innerHTML = ''; uniqueTypes.clear();
    allTests.forEach(test => { if (test.type) uniqueTypes.add(test.type); });

    const allButton = document.createElement('button');
    allButton.textContent = 'All Types'; allButton.dataset.type = 'All';
    if (currentTypeFilter === 'All') allButton.classList.add('active-filter');
    typeFilterButtonsDiv.appendChild(allButton);

    const sortedTypes = Array.from(uniqueTypes).sort();
    sortedTypes.forEach(type => {
        const typeButton = document.createElement('button');
        typeButton.textContent = type; typeButton.dataset.type = type;
        if (currentTypeFilter === type) typeButton.classList.add('active-filter');
        typeFilterButtonsDiv.appendChild(typeButton);
    });
}

// Apply filter (remains the same)
function applyFilter() {
    if (currentTypeFilter === 'All') { filteredTests = [...allTests]; }
    else { filteredTests = allTests.filter(test => test.type === currentTypeFilter); }
    currentPage = 1;
}

// Update pagination UI (remains the same)
function updatePaginationUI() { /* ... */ }
function updatePaginationUI() {
    if (!filteredTests || filteredTests.length === 0) { paginationControlsDiv.style.display = 'none'; return; }
    paginationControlsDiv.style.display = 'block';
    const totalItems = filteredTests.length; const totalPages = Math.ceil(totalItems / itemsPerPage);
    if (currentPage < 1) currentPage = 1; if (currentPage > totalPages && totalPages > 0) currentPage = totalPages;
    pageInfoSpan.textContent = `Page ${currentPage} of ${totalPages || 1}`;
    prevPageButton.disabled = (currentPage <= 1); nextPageButton.disabled = (currentPage >= totalPages);
}


// Render table (remains the same)
function renderTable() { /* ... */ }
function renderTable() {
    testListBody.innerHTML = '';
    if (!filteredTests || filteredTests.length === 0) {
        noTestsMessage.style.display = 'block'; testListTable.style.display = 'none';
        clearAllButton.style.display = allTests.length > 0 ? 'block' : 'none';
    } else {
        noTestsMessage.style.display = 'none'; testListTable.style.display = 'table'; clearAllButton.style.display = 'block';
        const startIndex = (currentPage - 1) * itemsPerPage; const endIndex = startIndex + itemsPerPage;
        const testsToDisplay = filteredTests.slice(startIndex, endIndex);
        testsToDisplay.forEach((test) => {
            const originalIndex = allTests.findIndex(t => t === test); const row = document.createElement('tr');
            const name = test.name || 'N/A'; const type = test.type || 'N/A'; const correct = test.correct || 0;
            const totalMarks = test.totalMarks || 0; const percentage = calculatePercentage(correct, totalMarks);
            row.innerHTML = `<td>${name}</td><td>${type}</td><td>${correct}</td><td>${totalMarks}</td><td>${percentage}%</td><td><button class="delete-button" data-original-index="${originalIndex}">Delete</button></td>`;
            testListBody.appendChild(row);
        });
    }
    updatePaginationUI();
}


// --- Actions ---

// Add test (Reads values, validation remains mostly the same)
function addTest(event) {
    event.preventDefault();
    const type = testTypeInput.value; // Read selected type
    const name = testNameInput.value; // Read selected name
    const correct = parseInt(correctAnswersInput.value, 10);
    const totalMarks = parseInt(totalMarksInput.value, 10);

    // Validation: Ensure type and name are selected (not the placeholder value "")
    if (!type || !name || isNaN(correct) || isNaN(totalMarks)) {
        alert('Please select a Type, Test Name, and enter valid scores.');
        return;
    }
    // Other validations remain the same
     if (correct < 0 || totalMarks <= 0) { /* ... */ }
     if (correct > totalMarks) { /* ... */ }
     if (correct < 0 || totalMarks <= 0) {
         alert('Please enter valid numbers (Correct >= 0, Total Marks > 0).');
         return;
     }
     if (correct > totalMarks) {
         alert('Correct answers cannot be greater than total marks.');
         return;
     }


    const newTest = { name, type, correct, totalMarks };
    allTests.push(newTest);
    saveTests();

    // Update UI - need to repopulate type dropdown in case a delete removed the last of a type
    renderTypeFilterButtons();
    populateTypeDropdown(); // Repopulate type dropdown
    // Reset form - this will trigger the change event on type if needed, resetting Test Name
    form.reset();
    // Manually reset Test Name dropdown as reset() might not trigger change consistently
    updateTestNameOptions('');

    // Apply filter and render
    applyFilter();
    if (currentTypeFilter === 'All' || currentTypeFilter === newTest.type) {
         currentPage = Math.ceil(filteredTests.length / itemsPerPage);
    }
    renderTable();
}


// Delete test (Update calls)
function deleteTest(originalIndex) {
    if (originalIndex < 0 || originalIndex >= allTests.length) return;
    if (confirm(`Are you sure you want to delete the test "${allTests[originalIndex].name}"?`)) {
        allTests.splice(originalIndex, 1);
        saveTests();
        renderTypeFilterButtons(); // Update filters
        populateTypeDropdown(); // Update form type dropdown
        updateTestNameOptions(testTypeInput.value); // Update test name options based on current type selection
        applyFilter();
        renderTable();
    }
}

// Clear all tests (Update calls)
function clearAllTests() {
     if (confirm('Are you sure you want to delete ALL recorded tests? This cannot be undone.')) {
         allTests = []; filteredTests = []; uniqueTypes.clear();
         currentTypeFilter = 'All';
         localStorage.removeItem('tests');
         renderTypeFilterButtons();
         populateTypeDropdown(); // Clear form type dropdown
         updateTestNameOptions(''); // Clear and disable test name dropdown
         renderTable();
     }
}

// --- Pagination Navigation (remains the same) ---
function goToPrevPage() { if (currentPage > 1) { currentPage--; renderTable(); } }
function goToNextPage() { const totalPages = Math.ceil(filteredTests.length / itemsPerPage); if (currentPage < totalPages) { currentPage++; renderTable(); } }


// --- Event Listeners ---
form.addEventListener('submit', addTest);

// **** NEW: Listener for Type dropdown change ****
testTypeInput.addEventListener('change', (event) => {
    const selectedType = event.target.value;
    updateTestNameOptions(selectedType); // Update the dependent dropdown
});
// **** END NEW ****

// Listener for filter button clicks (remains the same)
typeFilterButtonsDiv.addEventListener('click', (event) => { /* ... */ });
typeFilterButtonsDiv.addEventListener('click', (event) => {
    if (event.target.tagName === 'BUTTON') {
        const selectedType = event.target.dataset.type;
        if (selectedType) {
            currentTypeFilter = selectedType; renderTypeFilterButtons(); applyFilter(); renderTable();
        }
    }
});


// Listener for delete buttons (remains the same)
testListBody.addEventListener('click', (event) => { /* ... */ });
testListBody.addEventListener('click', (event) => {
    if (event.target.classList.contains('delete-button')) {
        const originalIndexToDelete = parseInt(event.target.getAttribute('data-original-index'), 10);
        if (!isNaN(originalIndexToDelete)) { deleteTest(originalIndexToDelete); }
    }
});


clearAllButton.addEventListener('click', clearAllTests);
prevPageButton.addEventListener('click', goToPrevPage);
nextPageButton.addEventListener('click', goToNextPage);


// --- Initial Data Loading ---
async function loadInitialData() {
    try {
        // Fetch and parse CSV (same as before)
        const response = await fetch('./Licence Preparation DB.csv');
        if (!response.ok) throw new Error(`CSV not found (${response.status})`);
        const csvText = await response.text();
        const parsedData = parseCSV(csvText);
        allTests = parsedData.map(csvRow => ({
             name: csvRow['Test'] || 'Unnamed Test', type: csvRow['Type'] || 'Unknown',
             correct: parseInt(csvRow['Correct'], 10) || 0, totalMarks: parseInt(csvRow['Total Marks'], 10) || 0
        }));
        console.log(`Loaded ${allTests.length} tests from CSV.`);
    } catch (error) {
        // Fallback to Local Storage (same as before)
        console.warn('Could not load data from CSV:', error.message); console.log('Attempting to load from Local Storage...');
        const storedTests = localStorage.getItem('tests'); allTests = storedTests ? JSON.parse(storedTests) : [];
        console.log(`Loaded ${allTests.length} tests from Local Storage.`);
    } finally {
        renderTypeFilterButtons(); // Render filter buttons (populates uniqueTypes)
        // **** CHANGED: Populate only Type dropdown initially ****
        populateTypeDropdown(); // Populate the form Type dropdown
        // **** CHANGED: Set initial state for Test Name dropdown ****
        updateTestNameOptions(''); // Clear and disable Test Name dropdown initially
        applyFilter(); // Apply the initial 'All' filter for the table display
        renderTable(); // Render the table
    }
}

// --- Start the App ---
loadInitialData(); // Load data and initialize the UI