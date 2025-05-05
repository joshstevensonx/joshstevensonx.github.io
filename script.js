// --- DOM Element References ---
const form = document.getElementById('add-test-form');
const testNameInput = document.getElementById('test-name');
const testTypeInput = document.getElementById('test-type'); // New input field
const correctAnswersInput = document.getElementById('correct-answers');
const totalMarksInput = document.getElementById('total-marks');
const testListBody = document.getElementById('test-list-body');
const noTestsMessage = document.getElementById('no-tests-message');
const clearAllButton = document.getElementById('clear-all-button');
const testListTable = document.getElementById('test-list-table');
const typeFilterSelect = document.getElementById('type-filter'); // Filter dropdown
const paginationControlsDiv = document.querySelector('.pagination-controls'); // Pagination container
const prevPageButton = document.getElementById('prev-page');
const nextPageButton = document.getElementById('next-page');
const pageInfoSpan = document.getElementById('page-info');

// --- Application State ---
let allTests = []; // Holds ALL tests loaded (from CSV or LocalStorage)
let filteredTests = []; // Holds tests after applying the Type filter
let uniqueTypes = new Set(); // To store unique test types for the filter dropdown
let currentTypeFilter = 'All'; // Currently selected type filter
let currentPage = 1; // Current page number for pagination
const itemsPerPage = 10; // Number of items to show per page

// --- CSV Parsing Function (same as before) ---
function parseCSV(csvText) {
    const lines = csvText.trim().split('\n');
    if (lines.length < 2) return [];
    const headers = lines[0].split(',').map(header => header.trim());
    const data = [];
    for (let i = 1; i < lines.length; i++) {
        // Basic split, improved slightly to handle potential quotes, but still basic
        const values = lines[i].split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(val => val.trim().replace(/^"|"$/g, ''));
        if (values.length === headers.length) {
            const rowObject = {};
            headers.forEach((header, index) => {
                rowObject[header] = values[index];
            });
            data.push(rowObject);
        } else {
            console.warn(`Skipping malformed CSV line ${i + 1}: ${lines[i]}`);
        }
    }
    return data;
}


// --- Data Handling Functions ---
function saveTests() {
    // Save the complete list of tests
    localStorage.setItem('tests', JSON.stringify(allTests));
}

function calculatePercentage(correct, totalMarks) {
    const numCorrect = parseFloat(correct);
    const numTotal = parseFloat(totalMarks);
    if (isNaN(numCorrect) || isNaN(numTotal) || numTotal === 0) return 0;
    return ((numCorrect / numTotal) * 100).toFixed(1);
}

// --- UI Update Functions ---

// Populate the type filter dropdown
function populateTypeFilter() {
    // Clear existing options except 'All'
    typeFilterSelect.innerHTML = '<option value="All">All Types</option>';
    uniqueTypes.clear(); // Clear previous types

    // Find unique types from all loaded tests
    allTests.forEach(test => {
        if (test.type) { // Only add if type exists
             uniqueTypes.add(test.type);
        }
    });

    // Sort types alphabetically and add them as options
    const sortedTypes = Array.from(uniqueTypes).sort();
    sortedTypes.forEach(type => {
        const option = document.createElement('option');
        option.value = type;
        option.textContent = type;
        typeFilterSelect.appendChild(option);
    });

     // Restore previously selected filter if applicable
     typeFilterSelect.value = currentTypeFilter;
}

// Apply the current type filter to the data
function applyFilter() {
    if (currentTypeFilter === 'All') {
        filteredTests = [...allTests]; // Copy all tests
    } else {
        filteredTests = allTests.filter(test => test.type === currentTypeFilter);
    }
    currentPage = 1; // Reset to first page after filtering
}

// Update pagination controls (buttons, page info)
function updatePaginationUI() {
    if (!filteredTests || filteredTests.length === 0) {
        paginationControlsDiv.style.display = 'none'; // Hide if no data
        return;
    }

    paginationControlsDiv.style.display = 'block'; // Show pagination

    const totalItems = filteredTests.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);

    // Ensure currentPage is valid
    if (currentPage < 1) currentPage = 1;
    if (currentPage > totalPages && totalPages > 0) currentPage = totalPages;

    pageInfoSpan.textContent = `Page ${currentPage} of ${totalPages || 1}`;

    // Enable/disable buttons
    prevPageButton.disabled = (currentPage <= 1);
    nextPageButton.disabled = (currentPage >= totalPages);
}

// Render the table body with filtered and paginated data
function renderTable() {
    testListBody.innerHTML = ''; // Clear table

    if (!filteredTests || filteredTests.length === 0) {
        noTestsMessage.style.display = 'block';
        testListTable.style.display = 'none';
        clearAllButton.style.display = allTests.length > 0 ? 'block' : 'none'; // Show clear if ANY data exists
    } else {
        noTestsMessage.style.display = 'none';
        testListTable.style.display = 'table';
        clearAllButton.style.display = 'block';

        // Calculate items for the current page
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const testsToDisplay = filteredTests.slice(startIndex, endIndex);

        testsToDisplay.forEach((test) => {
            // Find original index in allTests for stable delete functionality
            const originalIndex = allTests.findIndex(t => t === test); // Find based on object reference

            const row = document.createElement('tr');
            const name = test.name || 'N/A';
            const type = test.type || 'N/A'; // Display Type
            const correct = test.correct || 0;
            const totalMarks = test.totalMarks || 0;
            const percentage = calculatePercentage(correct, totalMarks);

            row.innerHTML = `
                <td>${name}</td>
                <td>${type}</td>
                <td>${correct}</td>
                <td>${totalMarks}</td>
                <td>${percentage}%</td>
                <td><button class="delete-button" data-original-index="${originalIndex}">Delete</button></td>
            `; // Use originalIndex for delete button
            testListBody.appendChild(row);
        });
    }
    updatePaginationUI(); // Update pagination controls based on rendered data
}

// --- Actions ---

// Add a new test (from form)
function addTest(event) {
    event.preventDefault();
    const name = testNameInput.value.trim();
    const type = testTypeInput.value.trim(); // Get type from new input
    const correct = parseInt(correctAnswersInput.value, 10);
    const totalMarks = parseInt(totalMarksInput.value, 10);

    if (!name || !type || isNaN(correct) || isNaN(totalMarks)) { // Added type check
        alert('Please fill in all fields correctly.');
        return;
    }
    if (correct < 0 || totalMarks <= 0) {
         alert('Please enter valid numbers (Correct >= 0, Total Marks > 0).');
         return;
    }
     if (correct > totalMarks) {
         alert('Correct answers cannot be greater than total marks.');
         return;
     }

    const newTest = { name, type, correct, totalMarks }; // Include type

    allTests.push(newTest); // Add to the main list
    saveTests(); // Save the updated main list

    // Refresh UI elements
    populateTypeFilter(); // Update filter options if new type was added
    applyFilter(); // Re-apply current filter (might show the new item)
    // Go to the last page if filtering by 'All' or the type of the added item
    if (currentTypeFilter === 'All' || currentTypeFilter === newTest.type) {
         currentPage = Math.ceil(filteredTests.length / itemsPerPage);
    }
    renderTable(); // Render the potentially updated table & pagination
    form.reset();
    testNameInput.focus();
}

// Delete a test (using original index)
function deleteTest(originalIndex) {
    if (originalIndex < 0 || originalIndex >= allTests.length) return; // Index out of bounds

    if (confirm(`Are you sure you want to delete the test "${allTests[originalIndex].name}"?`)) {
        allTests.splice(originalIndex, 1); // Remove from the main list
        saveTests(); // Save the updated main list

        // Refresh UI
        populateTypeFilter(); // Types might have changed
        applyFilter(); // Re-apply filter
        renderTable(); // Re-render table (pagination might adjust)
    }
}

// Clear all tests
function clearAllTests() {
     if (confirm('Are you sure you want to delete ALL recorded tests? This cannot be undone.')) {
         allTests = [];
         filteredTests = [];
         uniqueTypes.clear();
         localStorage.removeItem('tests');
         populateTypeFilter(); // Clear filter dropdown
         renderTable(); // Re-render empty state
     }
}

// --- Pagination Navigation ---
function goToPrevPage() {
    if (currentPage > 1) {
        currentPage--;
        renderTable();
    }
}

function goToNextPage() {
    const totalPages = Math.ceil(filteredTests.length / itemsPerPage);
    if (currentPage < totalPages) {
        currentPage++;
        renderTable();
    }
}


// --- Event Listeners ---
form.addEventListener('submit', addTest);

// Listener for type filter change
typeFilterSelect.addEventListener('change', (event) => {
    currentTypeFilter = event.target.value;
    applyFilter(); // Filter data based on selection
    renderTable(); // Re-render table for page 1 of new filter
});

// Listener for delete buttons (using event delegation)
testListBody.addEventListener('click', (event) => {
    if (event.target.classList.contains('delete-button')) {
        // Get the original index stored on the button
        const originalIndexToDelete = parseInt(event.target.getAttribute('data-original-index'), 10);
        if (!isNaN(originalIndexToDelete)) {
            deleteTest(originalIndexToDelete);
        }
    }
});

clearAllButton.addEventListener('click', clearAllTests);
prevPageButton.addEventListener('click', goToPrevPage);
nextPageButton.addEventListener('click', goToNextPage);


// --- Initial Data Loading ---
async function loadInitialData() {
    try {
        const response = await fetch('./Licence Preparation DB.csv'); // Fetch CSV
        if (!response.ok) throw new Error(`CSV not found (${response.status})`);
        const csvText = await response.text();
        const parsedData = parseCSV(csvText);

        // Map CSV data to our app's structure, including Type
        allTests = parsedData.map(csvRow => ({
             name: csvRow['Test'] || 'Unnamed Test',
             type: csvRow['Type'] || 'Unknown', // Store the Type
             correct: parseInt(csvRow['Correct'], 10) || 0,
             totalMarks: parseInt(csvRow['Total Marks'], 10) || 0
        }));
        console.log(`Loaded ${allTests.length} tests from CSV.`);
        // Optional: Overwrite LocalStorage with CSV data?
        // saveTests();

    } catch (error) {
        console.warn('Could not load data from CSV:', error.message);
        console.log('Attempting to load from Local Storage...');
        const storedTests = localStorage.getItem('tests');
        allTests = storedTests ? JSON.parse(storedTests) : [];
        console.log(`Loaded ${allTests.length} tests from Local Storage.`);
    } finally {
        // Initial setup after data is loaded (either way)
        populateTypeFilter(); // Populate the dropdown based on loaded types
        applyFilter(); // Apply the initial 'All' filter
        renderTable(); // Render the first page
    }
}

// --- Start the App ---
loadInitialData(); // Load data and initialize the UI