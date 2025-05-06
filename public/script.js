// --- DOM Element References ---
const form = document.getElementById('add-test-form');
const testTypeInput = document.getElementById('test-type');
const testNameInput = document.getElementById('test-name');
const correctAnswersFormInput = document.getElementById('correct-answers-form'); // Form input
// Removed totalMarksFormInput reference
const testListBody = document.getElementById('test-list-body');
const noTestsMessage = document.getElementById('no-tests-message');
const clearAllButton = document.getElementById('clear-all-button');
const testListTable = document.getElementById('test-list-table');
const typeFilterButtonsDiv = document.getElementById('type-filter-buttons');
const exportCsvButton = document.getElementById('export-csv-button'); // Keep export button reference if HTML has it

// --- Application State ---
let allTests = []; // Holds ALL tests loaded from Firestore (includes Firestore ID)
let filteredTests = []; // Holds tests after applying the Type filter
let uniqueTypes = new Set(); // To store unique test types for filters/dropdown
let currentTypeFilter = 'All'; // Currently selected type filter
let selectedRecordIndexForForm = null; // Index in allTests for the record selected in the FORM
let currentlyEditingIndex = null; // Index in allTests for the record being edited INLINE
let currentlyEditingElement = null; // TD element being edited INLINE

// --- Firebase Initialization ---
let db; // Declare db instance variable globally
try {
    if (firebase && typeof firebase.initializeApp === 'function') {
         // Check if Firebase is loaded (via script tags in index.html)
         // Firebase should already be initialized by the snippet in index.html
         db = firebase.firestore(); // Get Firestore instance
         console.log("Firestore instance obtained.");
    } else {
        throw new Error("Firebase SDK not loaded correctly.");
    }
} catch (e) {
    console.error("Firebase initialization error:", e);
    alert("Error connecting to database services. App functionality may be limited.");
    // Disable elements dependent on DB if needed
    if(form) form.style.display = 'none';
    if(testListContainer) testListContainer.innerHTML = '<p>Error connecting to database.</p>';
}

// --- Data Handling Functions ---
// REMOVED saveTests() function (was for localStorage)

function calculatePercentage(correct, totalMarks) {
    const numCorrect = parseFloat(correct);
    const numTotal = parseFloat(totalMarks);
    if (isNaN(numCorrect) || isNaN(numTotal) || numTotal === 0) return 0;
    return ((numCorrect / numTotal) * 100).toFixed(1);
}

// --- UI Update Functions ---

// Populate Type dropdown (for the form)
function populateTypeDropdown() {
    if (!testTypeInput) return; // Check if form exists
    // uniqueTypes set is populated within renderTypeFilterButtons
    testTypeInput.innerHTML = '<option value="" disabled selected>-- Select Type --</option>'; // Reset
    const sortedTypes = Array.from(uniqueTypes).sort();
    sortedTypes.forEach(type => {
        const option = document.createElement('option'); option.value = type; option.textContent = type; testTypeInput.appendChild(option);
    });
}

// Update Test Name options based on selected Type (for the form)
function updateTestNameOptions(selectedType) {
     if (!testNameInput || !correctAnswersFormInput) return; // Check if form elements exist
    const testNameSelect = testNameInput;
    testNameSelect.innerHTML = '<option value="" disabled selected>-- Select Test Name --</option>'; // Reset
    correctAnswersFormInput.value = ''; // Clear form correct answers
    selectedRecordIndexForForm = null; // Reset form selection index

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

// Render filter buttons (populates uniqueTypes)
function renderTypeFilterButtons() {
    typeFilterButtonsDiv.innerHTML = ''; uniqueTypes.clear();
    // Get unique types from allTests (which now comes from Firestore)
    allTests.forEach(test => { if (test.type) uniqueTypes.add(test.type); });

    // Create "All" button
    const allButton = document.createElement('button'); allButton.textContent = 'All Types'; allButton.dataset.type = 'All'; if (currentTypeFilter === 'All') allButton.classList.add('active-filter'); typeFilterButtonsDiv.appendChild(allButton);
    // Create button for each type
    const sortedTypes = Array.from(uniqueTypes).sort();
    sortedTypes.forEach(type => { const typeButton = document.createElement('button'); typeButton.textContent = type; typeButton.dataset.type = type; if (currentTypeFilter === type) typeButton.classList.add('active-filter'); typeFilterButtonsDiv.appendChild(typeButton); });
}

// Apply filter
function applyFilter() {
    if (currentTypeFilter === 'All') { filteredTests = [...allTests]; }
    else { filteredTests = allTests.filter(test => test.type === currentTypeFilter); }
}

// Render table (Sets up for inline editing, uses Firestore data)
function renderTable() {
    if (currentlyEditingIndex !== null) { saveOrCancelEdit(true); } // Save/cancel inline edit before full re-render

    testListBody.innerHTML = ''; // Clear table
    const dataExists = allTests && allTests.length > 0;
    const filteredDataExists = filteredTests && filteredTests.length > 0;

    if (!filteredDataExists) {
        noTestsMessage.style.display = 'block';
        testListTable.style.display = 'none';
    } else {
        noTestsMessage.style.display = 'none';
        testListTable.style.display = 'table';

        filteredTests.forEach((test) => {
            // Find index in allTests array (useful for local operations, but use test.id for DB)
            const originalIndex = allTests.findIndex(t => t.id === test.id);
            const row = document.createElement('tr');

            const name = test.name || 'N/A';
            const type = test.type || 'N/A';
            const correct = test.correct !== undefined ? test.correct : 'N/A';
            const totalMarks = test.totalMarks !== undefined ? test.totalMarks : 0; // Needed for calc/validation
            const percentage = calculatePercentage(correct, totalMarks);

            // Removed Total Marks TD, kept data-index for inline editing context
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
    // Show/Hide action buttons based on whether *any* data exists
    if(clearAllButton) clearAllButton.style.display = dataExists ? 'inline-block' : 'none';
    if(exportCsvButton) exportCsvButton.style.display = dataExists ? 'inline-block' : 'none'; // Keep export logic if button exists
}


// --- Inline Editing Functions ---
function startEditing(cell, index) {
    if (index < 0 || index >= allTests.length) return; // Invalid index
    if (currentlyEditingIndex !== null && currentlyEditingIndex !== index) { saveOrCancelEdit(true); }
    if (currentlyEditingIndex === index) return;

    resetFormSelection(); // Reset form if starting inline edit

    currentlyEditingIndex = index; currentlyEditingElement = cell;
    const record = allTests[index];
    const currentCorrectValue = record.correct;
    const totalMarks = record.totalMarks;

    cell.innerHTML = `<input type="number" class="inline-edit-input" value="${currentCorrectValue}" min="0" max="${totalMarks}" data-original-value="${currentCorrectValue}" />`;
    const input = cell.querySelector('.inline-edit-input');
    input.focus(); input.select();
    input.addEventListener('keydown', handleEditKeyDown);
    input.addEventListener('blur', handleEditBlur);
}

function handleEditKeyDown(event) { if (event.key === 'Enter') { event.preventDefault(); saveOrCancelEdit(true); } else if (event.key === 'Escape') { saveOrCancelEdit(false); } }

function handleEditBlur() { setTimeout(() => { if (currentlyEditingElement && currentlyEditingElement.contains(document.activeElement)) { return; } if (currentlyEditingIndex !== null) { saveOrCancelEdit(true); } }, 100); }

async function saveOrCancelEdit(attemptSave) { // Make async for Firestore
    if (currentlyEditingIndex === null || !currentlyEditingElement) return; // Not editing

    const input = currentlyEditingElement.querySelector('.inline-edit-input');
    const index = currentlyEditingIndex; // Index in the local allTests array
    if (index < 0 || index >= allTests.length || !input) { // Safety checks
         currentlyEditingIndex = null; currentlyEditingElement = null; return;
    }

    const recordToUpdate = allTests[index];
    const originalValue = input.dataset.originalValue;
    let saved = false;

    if (attemptSave) {
        const newValue = parseInt(input.value, 10);
        const totalMarks = recordToUpdate.totalMarks;

        // Validation
        if (isNaN(newValue) || newValue < 0 || newValue > totalMarks) {
            console.error("Invalid input value. Reverting.");
            input.style.outline = '2px solid red'; setTimeout(() => { input.style.outline = 'none'; }, 1500);
            attemptSave = false; // Force cancel
        } else if (newValue !== parseInt(originalValue, 10)) {
            // --- Update Firestore ---
            const docId = recordToUpdate.id;
            if (!docId) { console.error("Missing Firestore document ID for inline update."); alert("Error: Cannot save update, missing ID."); attemptSave = false; }
            else {
                try {
                    await db.collection("tests").doc(docId).update({ correct: newValue });
                    console.log("Firestore document updated (inline):", docId);
                    recordToUpdate.correct = newValue; // Update local only after DB success
                    saved = true;
                } catch (error) {
                    console.error("Error updating Firestore (inline):", error); alert("Failed to save update. Please try again."); attemptSave = false;
                }
            }
        } else { // Value unchanged
            console.log("Value unchanged, reverting UI."); attemptSave = false; saved = true; // Treat as saved for UI revert
        }
    } // End if (attemptSave)

    // --- Revert UI ---
    const displayValue = (saved || !attemptSave) ? recordToUpdate.correct : originalValue;
    currentlyEditingElement.innerHTML = `<span>${displayValue}</span>`;

     // Update percentage cell if saved successfully
     if(saved && attemptSave){
        const percentageCell = currentlyEditingElement.nextElementSibling; // Assumes % is next
        if (percentageCell) { percentageCell.textContent = calculatePercentage(recordToUpdate.correct, recordToUpdate.totalMarks) + '%'; }
     }

    // --- Reset editing state ---
    currentlyEditingIndex = null; currentlyEditingElement = null;
}


// --- Form Update Function ---
async function updateTestViaForm(event) { // Make async for Firestore
    event.preventDefault();
    if (!db) { alert("Database not connected. Cannot save."); return; } // Check DB connection
    if (currentlyEditingIndex !== null) { alert("Please finish or cancel the inline table edit first."); return; }
    if (selectedRecordIndexForForm === null || selectedRecordIndexForForm < 0 || selectedRecordIndexForForm >= allTests.length) { alert("Please select a valid Type and Test Name in the form first."); return; }

    const recordToUpdate = allTests[selectedRecordIndexForForm];
    const newCorrectValue = parseInt(correctAnswersFormInput.value, 10);
    const totalMarks = recordToUpdate.totalMarks; // Get total marks from existing record

    // Validation
    if (isNaN(newCorrectValue)) { alert('Please enter a valid number for Correct Answers.'); return; }
    if (newCorrectValue < 0 || totalMarks === undefined || totalMarks <= 0) { alert('Correct Answers cannot be negative.'); return; }
    if (newCorrectValue > totalMarks) { alert(`Correct answers cannot be greater than total marks (${totalMarks}).`); return; }

    // --- Update Firestore ---
    const docId = recordToUpdate.id;
    if (!docId) { console.error("Missing Firestore document ID for form update."); alert("Error: Cannot save update, missing ID."); return; }

    if (newCorrectValue !== recordToUpdate.correct) { // Only update if value changed
         try {
             await db.collection("tests").doc(docId).update({ correct: newCorrectValue });
             console.log("Firestore document updated via form:", docId);
             recordToUpdate.correct = newCorrectValue; // Update local array after DB success
             resetFormSelection(); applyFilter(); renderTable(); // Reset UI after success
         } catch (error) {
             console.error("Error updating Firestore via form:", error); alert("Failed to save update via form. Please try again.");
             // Optionally reset form even on failure
             // resetFormSelection();
         }
     } else {
         console.log("Form value unchanged. No update sent.");
         resetFormSelection(); // Still reset form
     }
}

// --- Helper to Reset Form ---
function resetFormSelection() {
    if (!form) return; // Check if form exists
    form.reset(); // Resets dropdowns/inputs
    if(testNameInput) updateTestNameOptions(''); // Resets name select, clears correct input
    selectedRecordIndexForForm = null; // Clear form state tracker
}

// --- Actions ---
async function deleteTest(originalIndex) { // Make async
    if (!db) { alert("Database not connected. Cannot delete."); return; } // Check DB
    if (originalIndex < 0 || originalIndex >= allTests.length) return;
    if (currentlyEditingIndex === originalIndex) { saveOrCancelEdit(false); } // Cancel inline edit if deleting target

    const recordToDelete = allTests[originalIndex];
    const docId = recordToDelete.id; // Get Firestore ID
    if (!docId) { console.error("Missing Firestore ID for delete."); alert("Cannot delete: Missing record ID."); return;}

    if (confirm(`Are you sure you want to delete "${recordToDelete.name}" (${recordToDelete.type})?`)) {
        try {
            // --- Delete from Firestore FIRST ---
            await db.collection("tests").doc(docId).delete();
            console.log("Firestore document deleted:", docId);

            // --- Update local state and UI only AFTER successful DB delete ---
            const deletedWasSelectedInForm = (selectedRecordIndexForForm === originalIndex);
            allTests.splice(originalIndex, 1); // Remove from local array

            if (deletedWasSelectedInForm) { resetFormSelection(); } // Reset form if needed
            renderTypeFilterButtons(); populateTypeDropdown(); updateTestNameOptions(testTypeInput?.value); // Update form state
            applyFilter(); renderTable();

        } catch (error) {
            console.error("Error deleting Firestore document:", error); alert("Failed to delete test. Please check connection and try again.");
        }
    }
}

function clearAllTests() {
     // NOTE: Clearing all tests directly from client-side against Firestore is generally
     // not recommended for performance and security. Usually done via a backend function.
     // This implementation will only clear the LOCAL view and localStorage if used.
     // To truly clear Firestore, manual deletion or a backend script is needed.
     alert("Clearing all tests from the display. This does NOT delete them permanently from the database in this version.");
     if (confirm('Are you sure you want to clear the display? (Data remains in database)')) {
         saveOrCancelEdit(false); // Cancel any inline edit
         allTests = []; filteredTests = []; uniqueTypes.clear(); currentTypeFilter = 'All';
         // localStorage.removeItem('tests'); // Remove this if you fully switched from localStorage
         resetFormSelection(); // Reset the form
         renderTypeFilterButtons(); populateTypeDropdown(); updateTestNameOptions(''); // Update UI
         renderTable(); // Re-render empty state
     }
}


// --- CSV Export (Optional, kept from previous step) ---
function generateCSVContent() {
    const headers = ["Test", "Type", "Correct", "Total Marks", "Result", "Percentage"]; // Include Total Marks in export
    let csvRows = [headers.join(',')];
    const formatCsvCell = (value) => { const stringValue = String(value ?? ''); if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) { return `"${stringValue.replace(/"/g, '""')}"`; } return stringValue; };
    allTests.forEach(test => {
        const correct = test.correct ?? 0; const totalMarks = test.totalMarks ?? 0;
        const percentage = parseFloat(calculatePercentage(correct, totalMarks)); const result = !isNaN(percentage) && percentage >= 50 ? 'Pass' : 'Fail';
        const rowValues = [ formatCsvCell(test.name), formatCsvCell(test.type), formatCsvCell(correct), formatCsvCell(totalMarks), formatCsvCell(result), formatCsvCell(percentage.toFixed(1) + '%') ];
        csvRows.push(rowValues.join(','));
    }); return csvRows.join('\n');
}
function downloadFile(filename, content, mimeType = 'text/csv;charset=utf-8;') {
    const blob = new Blob([content], { type: mimeType }); const link = document.createElement("a");
    const url = URL.createObjectURL(blob); link.setAttribute("href", url); link.setAttribute("download", filename);
    link.style.visibility = 'hidden'; document.body.appendChild(link); link.click(); document.body.removeChild(link); URL.revokeObjectURL(url);
}


// --- Event Listeners ---
if(form) form.addEventListener('submit', updateTestViaForm); // Check if form exists
if(testTypeInput) testTypeInput.addEventListener('change', (event) => { saveOrCancelEdit(false); updateTestNameOptions(event.target.value); }); // Check if element exists
if(testNameInput) testNameInput.addEventListener('change', (event) => {
    // Check if inline edit active, cancel it
    saveOrCancelEdit(false);
    const selectedName = event.target.value; const selectedType = testTypeInput.value;
    selectedRecordIndexForForm = null;
    if(correctAnswersFormInput) correctAnswersFormInput.value = ''; // Check element
    // totalMarksFormInput is removed

    if (selectedName && selectedType) {
        // Find index in LOCAL array based on selected form values
        const foundIndex = allTests.findIndex(test => test.type === selectedType && test.name === selectedName);
        if (foundIndex !== -1) {
            const matchingTest = allTests[foundIndex];
            if(correctAnswersFormInput) correctAnswersFormInput.value = matchingTest.correct; // Populate form correct answers
            selectedRecordIndexForForm = foundIndex; // Store LOCAL index for form submission
        }
    }
}); // Check element

testListBody.addEventListener('click', (event) => {
    const target = event.target;
    if (target.classList.contains('delete-button')) { const originalIndexToDelete = parseInt(target.getAttribute('data-original-index'), 10); if (!isNaN(originalIndexToDelete)) { deleteTest(originalIndexToDelete); } return; }
    const editableCell = target.closest('.editable-correct');
    if (editableCell) { const indexToEdit = parseInt(editableCell.dataset.index, 10); if (!isNaN(indexToEdit)) { startEditing(editableCell, indexToEdit); } }
});

typeFilterButtonsDiv.addEventListener('click', (event) => { if (event.target.tagName === 'BUTTON') { const selectedType = event.target.dataset.type; if (selectedType) { saveOrCancelEdit(true); currentTypeFilter = selectedType; renderTypeFilterButtons(); applyFilter(); renderTable(); } } }); // Save edit before filtering
if(clearAllButton) clearAllButton.addEventListener('click', clearAllTests); // Check element
if(exportCsvButton) exportCsvButton.addEventListener('click', () => { if (currentlyEditingIndex !== null) { saveOrCancelEdit(true); } const csvContent = generateCSVContent(); downloadFile('updated_licence_prep.csv', csvContent); }); // Check element

// --- Initial Data Loading ---
// Make sure this runs after the DOM is ready, or use defer attribute on script tag
document.addEventListener('DOMContentLoaded', () => {
    loadInitialData();
});

// --- Start the App (call loadInitialData via DOMContentLoaded) ---
// loadInitialData(); // Call moved into DOMContentLoaded listener