// --- DOM Element References ---
const form = document.getElementById('add-test-form');
const testTypeInput = document.getElementById('test-type');
const testNameInput = document.getElementById('test-name');
const correctAnswersInput = document.getElementById('correct-answers'); // Correct Answers input
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
let currentTypeFilter = 'All';
let currentPage = 1;
const itemsPerPage = 10;
// **** NEW: State variable to track the index of the record selected in the form ****
let selectedRecordIndexForForm = null;
// **** END NEW ****

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

// Populate Type dropdown
function populateTypeDropdown() { /* ... */ }
function populateTypeDropdown() {
    testTypeInput.innerHTML = '<option value="" disabled selected>-- Select Type --</option>';
    const sortedTypes = Array.from(uniqueTypes).sort();
    sortedTypes.forEach(type => {
        const option = document.createElement('option'); option.value = type; option.textContent = type; testTypeInput.appendChild(option);
    });
}

// Update Test Name options based on selected Type
function updateTestNameOptions(selectedType) {
    const testNameSelect = testNameInput;
    testNameSelect.innerHTML = '<option value="" disabled selected>-- Select Test Name --</option>';
    totalMarksInput.value = '';
    correctAnswersInput.value = ''; // **** ADDED: Clear correct answers when type changes ****
    selectedRecordIndexForForm = null; // **** ADDED: Reset selected index ****

    if (!selectedType) { testNameSelect.disabled = true; return; }
    const testsOfType = allTests.filter(test => test.type === selectedType);
    const namesOfType = new Set(testsOfType.map(test => test.name));
    if (namesOfType.size === 0) {
        testNameSelect.disabled = true;
        const noTestOption = document.createElement('option'); noTestOption.value = ""; noTestOption.textContent = "-- No tests found for this type --"; noTestOption.disabled = true; testNameSelect.appendChild(noTestOption);
    } else {
        const sortedNames = Array.from(namesOfType).sort();
        sortedNames.forEach(name => {
            const option = document.createElement('option'); option.value = name; option.textContent = name; testNameSelect.appendChild(option);
        });
        testNameSelect.disabled = false;
    }
}

// Render filter buttons (populates uniqueTypes)
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

// Apply filter
function applyFilter() { /* ... */ }
function applyFilter() { if (currentTypeFilter === 'All') { filteredTests = [...allTests]; } else { filteredTests = allTests.filter(test => test.type === currentTypeFilter); } currentPage = 1; }

// Update pagination UI
function updatePaginationUI() { /* ... */ }
function updatePaginationUI() { if (!filteredTests || filteredTests.length === 0) { paginationControlsDiv.style.display = 'none'; return; } paginationControlsDiv.style.display = 'block'; const totalItems = filteredTests.length; const totalPages = Math.ceil(totalItems / itemsPerPage); if (currentPage < 1) currentPage = 1; if (currentPage > totalPages && totalPages > 0) currentPage = totalPages; pageInfoSpan.textContent = `Page ${currentPage} of ${totalPages || 1}`; prevPageButton.disabled = (currentPage <= 1); nextPageButton.disabled = (currentPage >= totalPages); }

// Render table
function renderTable() { /* ... */ }
function renderTable() {
    testListBody.innerHTML = '';
    if (!filteredTests || filteredTests.length === 0) {
        noTestsMessage.style.display = 'block'; testListTable.style.display = 'none'; clearAllButton.style.display = allTests.length > 0 ? 'block' : 'none';
    } else {
        noTestsMessage.style.display = 'none'; testListTable.style.display = 'table'; clearAllButton.style.display = 'block';
        const startIndex = (currentPage - 1) * itemsPerPage; const endIndex = startIndex + itemsPerPage;
        const testsToDisplay = filteredTests.slice(startIndex, endIndex);
        testsToDisplay.forEach((test) => {
            const originalIndex = allTests.findIndex(t => t === test); const row = document.createElement('tr');
            const name = test.name || 'N/A'; const type = test.type || 'N/A'; const correct = test.correct || 0; const totalMarks = test.totalMarks || 0; const percentage = calculatePercentage(correct, totalMarks);
            // **** Maybe add highlighting/indication if this row matches selectedRecordIndexForForm ****
            row.innerHTML = `<td>${name}</td><td>${type}</td><td>${correct}</td><td>${totalMarks}</td><td>${percentage}%</td><td><button class="delete-button" data-original-index="${originalIndex}">Delete</button></td>`;
            testListBody.appendChild(row);
        });
    }
    updatePaginationUI();
}

// --- Actions ---

// **** CHANGED: Renamed function and logic to UPDATE instead of ADD ****
function updateTest(event) {
    event.preventDefault();

    // Check if a record was actually selected via the form dropdowns
    if (selectedRecordIndexForForm === null || selectedRecordIndexForForm < 0 || selectedRecordIndexForForm >= allTests.length) {
        alert("Please select a valid Type and Test Name first.");
        return;
    }

    const recordToUpdate = allTests[selectedRecordIndexForForm];
    const newCorrectValue = parseInt(correctAnswersInput.value, 10);
    const totalMarks = parseInt(totalMarksInput.value, 10); // Already populated and readonly

    // Validate the new correct value
    if (isNaN(newCorrectValue)) {
        alert('Please enter a valid number for Correct Answers.');
        return;
    }
     if (newCorrectValue < 0 || totalMarks <= 0) {
         alert('Correct Answers cannot be negative.');
         return;
     }
     if (newCorrectValue > totalMarks) {
         alert('Correct answers cannot be greater than total marks.');
         return;
     }

    // --- Update the existing record ---
    console.log(`Updating record at index ${selectedRecordIndexForForm}:`, recordToUpdate);
    recordToUpdate.correct = newCorrectValue;
    console.log(`Record updated to:`, recordToUpdate);
    // --- Do NOT push a new record ---

    saveTests(); // Save the modified allTests array

    // Reset UI
    form.reset(); // Resets selects and inputs
    updateTestNameOptions(''); // Clear and disable test name select, clears total marks/correct answers
    selectedRecordIndexForForm = null; // Reset the selected index tracker

    // Apply filter and re-render the potentially updated table
    applyFilter();
    renderTable(); // Re-render the table to show the update
}
// **** END CHANGE ****


// Delete test (reset selected index if it matches)
function deleteTest(originalIndex) {
    if (originalIndex < 0 || originalIndex >= allTests.length) return;
    if (confirm(`Are you sure you want to delete the test "${allTests[originalIndex].name}"?`)) {
        allTests.splice(originalIndex, 1);
        saveTests();
        // Reset form state if the deleted record was the one selected in the form
        if (selectedRecordIndexForForm === originalIndex) {
             form.reset();
             updateTestNameOptions('');
             selectedRecordIndexForForm = null;
        }
        // Update UI
        renderTypeFilterButtons();
        populateTypeDropdown();
        updateTestNameOptions(testTypeInput.value); // Refresh test names for current type
        applyFilter();
        renderTable();
    }
}


// Clear all tests (reset selected index)
function clearAllTests() {
     if (confirm('Are you sure you want to delete ALL recorded tests? This cannot be undone.')) {
         allTests = []; filteredTests = []; uniqueTypes.clear();
         currentTypeFilter = 'All'; selectedRecordIndexForForm = null; // Reset index
         localStorage.removeItem('tests');
         renderTypeFilterButtons();
         populateTypeDropdown();
         updateTestNameOptions('');
         renderTable();
     }
}

// --- Pagination Navigation (remains the same) ---
function goToPrevPage() { /* ... */ }
function goToNextPage() { /* ... */ }
function goToPrevPage() { if (currentPage > 1) { currentPage--; renderTable(); } }
function goToNextPage() { const totalPages = Math.ceil(filteredTests.length / itemsPerPage); if (currentPage < totalPages) { currentPage++; renderTable(); } }


// --- Event Listeners ---
// **** CHANGED: Form submit now calls updateTest ****
form.addEventListener('submit', updateTest);
// **** END CHANGE ****

// Listener for Type dropdown change
testTypeInput.addEventListener('change', (event) => {
    const selectedType = event.target.value;
    updateTestNameOptions(selectedType);
});

// Listener for Test Name dropdown change
testNameInput.addEventListener('change', (event) => {
    const selectedName = event.target.value;
    const selectedType = testTypeInput.value;
    selectedRecordIndexForForm = null; // Reset index initially
    correctAnswersInput.value = ''; // Clear previous correct answers
    totalMarksInput.value = ''; // Clear previous total marks

    if (selectedName && selectedType) {
        // Find the first matching test and its index
        const foundIndex = allTests.findIndex(test => test.type === selectedType && test.name === selectedName);

        if (foundIndex !== -1) {
            const matchingTest = allTests[foundIndex];
            totalMarksInput.value = matchingTest.totalMarks;
            correctAnswersInput.value = matchingTest.correct; // **** ADDED: Populate correct answers ****
            selectedRecordIndexForForm = foundIndex; // **** ADDED: Store the index ****
            console.log(`Selected record at index: ${foundIndex}`);
        } else {
            // This case should ideally not happen if dropdowns are populated correctly
             console.warn(`No matching test found for Type: ${selectedType}, Name: ${selectedName}`);
        }
    }
});

// Listener for filter button clicks
typeFilterButtonsDiv.addEventListener('click', (event) => { /* ... */ });
typeFilterButtonsDiv.addEventListener('click', (event) => { if (event.target.tagName === 'BUTTON') { const selectedType = event.target.dataset.type; if (selectedType) { currentTypeFilter = selectedType; renderTypeFilterButtons(); applyFilter(); renderTable(); } } });

// Listener for delete buttons
testListBody.addEventListener('click', (event) => { /* ... */ });
testListBody.addEventListener('click', (event) => { if (event.target.classList.contains('delete-button')) { const originalIndexToDelete = parseInt(event.target.getAttribute('data-original-index'), 10); if (!isNaN(originalIndexToDelete)) { deleteTest(originalIndexToDelete); } } });

clearAllButton.addEventListener('click', clearAllTests);
prevPageButton.addEventListener('click', goToPrevPage);
nextPageButton.addEventListener('click', goToNextPage);


// --- Initial Data Loading (remains the same) ---
async function loadInitialData() { /* ... */ }
async function loadInitialData() {
    try {
        const response = await fetch('./Licence Preparation DB.csv'); if (!response.ok) throw new Error(`CSV not found (${response.status})`); const csvText = await response.text(); const parsedData = parseCSV(csvText);
        allTests = parsedData.map(csvRow => ({ name: csvRow['Test'] || 'Unnamed Test', type: csvRow['Type'] || 'Unknown', correct: parseInt(csvRow['Correct'], 10) || 0, totalMarks: parseInt(csvRow['Total Marks'], 10) || 0 }));
        console.log(`Loaded ${allTests.length} tests from CSV.`);
    } catch (error) {
        console.warn('Could not load data from CSV:', error.message); console.log('Attempting to load from Local Storage...'); const storedTests = localStorage.getItem('tests'); allTests = storedTests ? JSON.parse(storedTests) : []; console.log(`Loaded ${allTests.length} tests from Local Storage.`);
    } finally {
        selectedRecordIndexForForm = null; // Ensure index is null initially
        renderTypeFilterButtons(); populateTypeDropdown(); updateTestNameOptions(''); applyFilter(); renderTable();
    }
}

// --- Start the App ---
loadInitialData();