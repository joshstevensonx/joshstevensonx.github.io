// --- DOM Element References ---
const form = document.getElementById('add-test-form');
const testTypeInput = document.getElementById('test-type');
const testNameInput = document.getElementById('test-name');
const correctAnswersFormInput = document.getElementById('correct-answers-form');
// **** REMOVED: totalMarksFormInput ****
const testListBody = document.getElementById('test-list-body');
const noTestsMessage = document.getElementById('no-tests-message');
const clearAllButton = document.getElementById('clear-all-button');
const testListTable = document.getElementById('test-list-table');
const typeFilterButtonsDiv = document.getElementById('type-filter-buttons');

// --- Application State ---
let allTests = [];
let filteredTests = [];
let uniqueTypes = new Set();
let currentTypeFilter = 'All';
let selectedRecordIndexForForm = null;
let currentlyEditingIndex = null;
let currentlyEditingElement = null;

// --- CSV Parsing Function ---
function parseCSV(csvText) { /* ... */ }
function parseCSV(csvText) { const lines = csvText.trim().split('\n'); if (lines.length < 2) return []; const headers = lines[0].split(',').map(h => h.trim()); const data = []; for (let i = 1; i < lines.length; i++) { const values = lines[i].split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(v => v.trim().replace(/^"|"$/g, '')); if (values.length === headers.length) { const rowObject = {}; headers.forEach((header, index) => { rowObject[header] = values[index]; }); data.push(rowObject); } else { console.warn(`Skipping malformed CSV line ${i + 1}: ${lines[i]}`); } } return data; }


// --- Data Handling Functions ---
function saveTests() { localStorage.setItem('tests', JSON.stringify(allTests)); }
function calculatePercentage(correct, totalMarks) { /* ... */ }
function calculatePercentage(correct, totalMarks) { const numCorrect = parseFloat(correct); const numTotal = parseFloat(totalMarks); if (isNaN(numCorrect) || isNaN(numTotal) || numTotal === 0) return 0; return ((numCorrect / numTotal) * 100).toFixed(1); }


// --- UI Update Functions ---

// Populate Type dropdown
function populateTypeDropdown() { /* ... */ }
function populateTypeDropdown() { testTypeInput.innerHTML = '<option value="" disabled selected>-- Select Type --</option>'; const sortedTypes = Array.from(uniqueTypes).sort(); sortedTypes.forEach(type => { const option = document.createElement('option'); option.value = type; option.textContent = type; testTypeInput.appendChild(option); }); }


// Update Test Name options based on selected Type
function updateTestNameOptions(selectedType) {
    const testNameSelect = testNameInput;
    testNameSelect.innerHTML = '<option value="" disabled selected>-- Select Test Name --</option>';
    // **** REMOVED: Clearing totalMarksFormInput ****
    correctAnswersFormInput.value = ''; // Clear form correct answers
    selectedRecordIndexForForm = null;

    if (!selectedType) { testNameSelect.disabled = true; return; }
    const testsOfType = allTests.filter(test => test.type === selectedType);
    const namesOfType = new Set(testsOfType.map(test => test.name));
    if (namesOfType.size === 0) {
        testNameSelect.disabled = true;
        const noTestOption = document.createElement('option'); noTestOption.value = ""; noTestOption.textContent = "-- No tests found --"; noTestOption.disabled = true; testNameSelect.appendChild(noTestOption);
    } else {
        const sortedNames = Array.from(namesOfType).sort();
        sortedNames.forEach(name => {
            const option = document.createElement('option'); option.value = name; option.textContent = name; testNameSelect.appendChild(option);
        });
        testNameSelect.disabled = false;
    }
}

// Render filter buttons
function renderTypeFilterButtons() { /* ... */ }
function renderTypeFilterButtons() { typeFilterButtonsDiv.innerHTML = ''; uniqueTypes.clear(); allTests.forEach(test => { if (test.type) uniqueTypes.add(test.type); }); const allButton = document.createElement('button'); allButton.textContent = 'All Types'; allButton.dataset.type = 'All'; if (currentTypeFilter === 'All') allButton.classList.add('active-filter'); typeFilterButtonsDiv.appendChild(allButton); const sortedTypes = Array.from(uniqueTypes).sort(); sortedTypes.forEach(type => { const typeButton = document.createElement('button'); typeButton.textContent = type; typeButton.dataset.type = type; if (currentTypeFilter === type) typeButton.classList.add('active-filter'); typeFilterButtonsDiv.appendChild(typeButton); }); }

// Apply filter
function applyFilter() { /* ... */ }
function applyFilter() { if (currentTypeFilter === 'All') { filteredTests = [...allTests]; } else { filteredTests = allTests.filter(test => test.type === currentTypeFilter); } }


// Render table (Removed Total Marks column)
function renderTable() {
    if (currentlyEditingIndex !== null) { saveOrCancelEdit(true); }
    testListBody.innerHTML = '';
    if (!filteredTests || filteredTests.length === 0) {
        noTestsMessage.style.display = 'block'; testListTable.style.display = 'none'; clearAllButton.style.display = allTests.length > 0 ? 'block' : 'none';
    } else {
        noTestsMessage.style.display = 'none'; testListTable.style.display = 'table'; clearAllButton.style.display = 'block';
        filteredTests.forEach((test) => {
            const originalIndex = allTests.findIndex(t => t === test);
            const row = document.createElement('tr');
            const name = test.name || 'N/A'; const type = test.type || 'N/A'; const correct = test.correct !== undefined ? test.correct : 'N/A';
            // **** Get totalMarks for calculation, but don't display it directly ****
            const totalMarks = test.totalMarks !== undefined ? test.totalMarks : 0;
            const percentage = calculatePercentage(correct, totalMarks);
            // **** CHANGED: Removed Total Marks TD ****
            row.innerHTML = `
                <td>${name}</td>
                <td>${type}</td>
                <td class="editable-correct" data-index="${originalIndex}">
                    <span>${correct}</span>
                </td>
                <td>${percentage}%</td>
                <td><button class="delete-button" data-original-index="${originalIndex}">Delete</button></td>
            `;
            testListBody.appendChild(row);
        });
    }
}

// --- Inline Editing Functions ---
function startEditing(cell, index) {
    if (currentlyEditingIndex !== null && currentlyEditingIndex !== index) { saveOrCancelEdit(true); }
    if (currentlyEditingIndex === index) return;
    resetFormSelection(); // Reset form if starting inline edit
    currentlyEditingIndex = index; currentlyEditingElement = cell;
    const currentCorrectValue = allTests[index].correct;
    const totalMarks = allTests[index].totalMarks; // Still needed for max attribute
    cell.innerHTML = `<input type="number" class="inline-edit-input" value="${currentCorrectValue}" min="0" max="${totalMarks}" data-original-value="${currentCorrectValue}" />`; // Keep max
    const input = cell.querySelector('.inline-edit-input'); input.focus(); input.select();
    input.addEventListener('keydown', handleEditKeyDown); input.addEventListener('blur', handleEditBlur);
}

function handleEditKeyDown(event) { if (event.key === 'Enter') { event.preventDefault(); saveOrCancelEdit(true); } else if (event.key === 'Escape') { saveOrCancelEdit(false); } }
function handleEditBlur() { setTimeout(() => { if (currentlyEditingElement && currentlyEditingElement.contains(document.activeElement)) { return; } if (currentlyEditingIndex !== null) { saveOrCancelEdit(true); } }, 100); }

function saveOrCancelEdit(attemptSave) {
    if (currentlyEditingIndex === null || !currentlyEditingElement) return;
    const input = currentlyEditingElement.querySelector('.inline-edit-input'); const index = currentlyEditingIndex; const originalValue = input.dataset.originalValue; let saved = false;
    if (attemptSave) {
        const newValue = parseInt(input.value, 10);
        const totalMarks = allTests[index].totalMarks; // Get total marks for validation
        if (isNaN(newValue) || newValue < 0 || newValue > totalMarks) { console.error("Invalid input. Reverting."); attemptSave = false; }
        else { allTests[index].correct = newValue; saveTests(); saved = true; }
    }
    currentlyEditingElement.innerHTML = `<span>${saved ? allTests[index].correct : originalValue}</span>`;
    if(saved){
        // **** CHANGED: Find percentage cell relative to correct cell (now one less column) ****
        const percentageCell = currentlyEditingElement.nextElementSibling; // It's the immediate next sibling now
        if (percentageCell) { percentageCell.textContent = calculatePercentage(allTests[index].correct, allTests[index].totalMarks) + '%'; }
    }
    currentlyEditingIndex = null; currentlyEditingElement = null;
}

// --- Form Update Function ---
function updateTestViaForm(event) {
    event.preventDefault();
    if (currentlyEditingIndex !== null) { alert("Please finish or cancel the inline table edit first."); return; }
    if (selectedRecordIndexForForm === null || selectedRecordIndexForForm < 0 || selectedRecordIndexForForm >= allTests.length) { alert("Please select a valid Type and Test Name in the form first."); return; }

    const recordToUpdate = allTests[selectedRecordIndexForForm];
    const newCorrectValue = parseInt(correctAnswersFormInput.value, 10);
    // **** Get totalMarks from the data record for validation ****
    const totalMarks = recordToUpdate.totalMarks;

    if (isNaN(newCorrectValue)) { alert('Please enter a valid number for Correct Answers.'); return; }
    // Use fetched totalMarks for validation
    if (newCorrectValue < 0 || totalMarks === undefined || totalMarks <= 0) { alert('Correct Answers cannot be negative.'); return; }
    if (newCorrectValue > totalMarks) { alert(`Correct answers cannot be greater than total marks (${totalMarks}).`); return; }

    recordToUpdate.correct = newCorrectValue;
    saveTests();
    resetFormSelection();
    applyFilter(); renderTable();
}

// --- Helper to Reset Form ---
function resetFormSelection() {
    form.reset();
    updateTestNameOptions(''); // Resets name select, clears correct input
    selectedRecordIndexForForm = null;
    // **** REMOVED: Clearing totalMarksFormInput ****
}

// --- Actions ---
function deleteTest(originalIndex) { /* ... */ }
function deleteTest(originalIndex) {
    if (originalIndex < 0 || originalIndex >= allTests.length) return;
    if (currentlyEditingIndex === originalIndex) { saveOrCancelEdit(false); }
    if (confirm(`Are you sure you want to delete "${allTests[originalIndex].name}" (${allTests[originalIndex].type})?`)) {
        const deletedWasSelectedInForm = (selectedRecordIndexForForm === originalIndex);
        allTests.splice(originalIndex, 1); saveTests();
        if (deletedWasSelectedInForm) { resetFormSelection(); }
        renderTypeFilterButtons(); populateTypeDropdown(); updateTestNameOptions(testTypeInput.value);
        applyFilter(); renderTable();
    }
}

function clearAllTests() { /* ... */ }
function clearAllTests() {
     if (confirm('Are you sure you want to delete ALL tests?')) {
         saveOrCancelEdit(false);
         allTests = []; filteredTests = []; uniqueTypes.clear(); currentTypeFilter = 'All';
         localStorage.removeItem('tests');
         resetFormSelection();
         renderTypeFilterButtons(); populateTypeDropdown(); updateTestNameOptions('');
         renderTable();
     }
}

// --- Event Listeners ---
form.addEventListener('submit', updateTestViaForm);

testTypeInput.addEventListener('change', (event) => { saveOrCancelEdit(false); updateTestNameOptions(event.target.value); });

testNameInput.addEventListener('change', (event) => {
    saveOrCancelEdit(false);
    const selectedName = event.target.value; const selectedType = testTypeInput.value;
    selectedRecordIndexForForm = null; correctAnswersFormInput.value = '';
    // **** REMOVED: Populating totalMarksFormInput ****

    if (selectedName && selectedType) {
        const foundIndex = allTests.findIndex(test => test.type === selectedType && test.name === selectedName);
        if (foundIndex !== -1) {
            const matchingTest = allTests[foundIndex];
            // **** Only populate correct answers in form ****
            correctAnswersFormInput.value = matchingTest.correct;
            selectedRecordIndexForForm = foundIndex;
        }
    }
});

testListBody.addEventListener('click', (event) => { /* ... */ });
testListBody.addEventListener('click', (event) => { const target = event.target; if (target.classList.contains('delete-button')) { const originalIndexToDelete = parseInt(target.getAttribute('data-original-index'), 10); if (!isNaN(originalIndexToDelete)) { deleteTest(originalIndexToDelete); } return; } const editableCell = target.closest('.editable-correct'); if (editableCell) { const indexToEdit = parseInt(editableCell.dataset.index, 10); if (!isNaN(indexToEdit)) { startEditing(editableCell, indexToEdit); } } });


typeFilterButtonsDiv.addEventListener('click', (event) => { /* ... */ });
typeFilterButtonsDiv.addEventListener('click', (event) => { if (event.target.tagName === 'BUTTON') { const selectedType = event.target.dataset.type; if (selectedType) { saveOrCancelEdit(true); currentTypeFilter = selectedType; renderTypeFilterButtons(); applyFilter(); renderTable(); } } });


clearAllButton.addEventListener('click', clearAllTests);

// --- Initial Data Loading ---
async function loadInitialData() { /* ... */ }
async function loadInitialData() {
    try {
        const response = await fetch('./Licence Preparation DB.csv'); if (!response.ok) throw new Error(`CSV not found (${response.status})`); const csvText = await response.text(); const parsedData = parseCSV(csvText);
        allTests = parsedData.map(csvRow => ({ name: csvRow['Test'] || 'Unnamed Test', type: csvRow['Type'] || 'Unknown', correct: parseInt(csvRow['Correct'], 10) || 0, totalMarks: parseInt(csvRow['Total Marks'], 10) || 0 })); // Keep parsing totalMarks
        console.log(`Loaded ${allTests.length} tests from CSV.`);
    } catch (error) {
        console.warn('Could not load data from CSV:', error.message); console.log('Attempting to load from Local Storage...'); const storedTests = localStorage.getItem('tests'); allTests = storedTests ? JSON.parse(storedTests) : []; console.log(`Loaded ${allTests.length} tests from Local Storage.`);
    } finally {
        currentlyEditingIndex = null; currentlyEditingElement = null; selectedRecordIndexForForm = null;
        renderTypeFilterButtons(); populateTypeDropdown(); updateTestNameOptions('');
        applyFilter(); renderTable();
    }
}

// --- Start the App ---
loadInitialData();