// importCsv.js
const admin = require('firebase-admin');
const csv = require('csv-parser');
const fs = require('fs');

// --- !!! CONFIGURE !!! ---
// 1. Replace './serviceAccountKey.json' with the actual filename of your downloaded key file.
const serviceAccount = require('./serviceAccountKey.json');
// 2. Make sure this path points to your CSV file.
const csvFilePath = './Licence Preparation DB.csv';
// 3. This should match the collection name you created in Firestore.
const targetCollection = 'tests';
// --- !!! END CONFIGURE !!! ---

try {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    console.log("Firebase Admin Initialized.");
} catch (error) {
    console.error("Error initializing Firebase Admin:", error);
    process.exit(1); // Exit if initialization fails
}


const db = admin.firestore();

// --- Batched Writes Upload (Recommended) ---
async function importWithBatching() {
    const batchSize = 400; // Firestore batch limit is 500, use slightly less
    let batch = db.batch();
    let countInBatch = 0;
    let totalCount = 0;
    let skippedCount = 0;

    // Create a readable stream from the CSV file
    const stream = fs.createReadStream(csvFilePath)
        .on('error', (error) => {
            console.error(`Error reading CSV file stream: ${error.message}`);
            process.exit(1); // Exit on stream error
        })
        .pipe(csv()) // Use csv-parser
        .on('error', (error) => {
            // Handle errors during CSV parsing itself
            console.error(`Error parsing CSV data: ${error.message}`);
            // Decide if you want to stop or just log the error and continue
            // For now, we let the stream continue if possible after a parse error
        });

    console.log('Starting import using Batched Writes...');
    console.log(`Target Collection: ${targetCollection}`);
    console.log(`Batch Size: ${batchSize}`);

    // Process stream data using an async loop
    try {
        for await (const row of stream) {
            try {
                // --- Data Transformation and Validation ---
                // Access columns by the exact header name in your CSV file
                const name = row['Test'] || null; // Use null if empty? Decide default strategy
                const type = row['Type'] || null;
                const correctStr = row['Correct'];
                const totalMarksStr = row['Total Marks'];

                // Validate required fields (adjust as needed)
                if (!name || !type || correctStr === undefined || totalMarksStr === undefined) {
                    console.warn(`Skipping row (missing required data): ${JSON.stringify(row)}`);
                    skippedCount++;
                    continue;
                }

                const correct = parseInt(correctStr, 10);
                const totalMarks = parseInt(totalMarksStr, 10);

                // Validate numbers more strictly
                if (isNaN(correct) || correct < 0 || isNaN(totalMarks) || totalMarks <= 0) {
                    console.warn(`Skipping row (invalid number format): Correct='<span class="math-inline">\{correctStr\}', Total\='</span>{totalMarksStr}' in row: ${JSON.stringify(row)}`);
                    skippedCount++;
                    continue; // Skip this row
                }

                // --- Prepare Firestore Document ---
                const dataObject = {
                    name: name,
                    type: type,
                    correct: correct,
                    totalMarks: totalMarks
                    // Add other fields from CSV if needed, e.g.,
                    // result: row['Result'] || null,
                    // percentage: row['Percentage'] || null
                };

                // Get a new document reference WITH auto-generated ID
                const docRef = db.collection(targetCollection).doc();
                // Add the set operation to the current batch
                batch.set(docRef, dataObject);
                countInBatch++;
                totalCount++;

                // Commit the batch when it's full
                if (countInBatch >= batchSize) {
                    console.log(`Committing batch of ${countInBatch} documents (Total processed: ${totalCount})...`);
                    await batch.commit();
                    // Start a new batch
                    batch = db.batch();
                    countInBatch = 0;
                    console.log("Batch committed. Starting new batch.");
                }
            } catch (error) {
                console.error(`Error processing row data: ${JSON.stringify(row)}`, error);
                skippedCount++; // Count rows that failed during processing
            }
        } // End of for await loop

        // Commit any remaining documents in the last batch
        if (countInBatch > 0) {
            console.log(`Committing final batch of ${countInBatch} documents (Total processed: ${totalCount})...`);
            await batch.commit();
            console.log("Final batch committed.");
        }

        console.log(`\n----------------------------------------------------`);
        console.log(`Batch import finished.`);
        console.log(`  Total documents successfully prepared for Firestore: ${totalCount}`);
        console.log(`  Total rows skipped due to errors/missing data: ${skippedCount}`);
        console.log(`----------------------------------------------------`);

    } catch (error) {
         console.error(`Error during stream processing or batch commit: ${error.message}`);
    }
}

// Run the batched import function
importWithBatching().catch(err => {
     console.error("Unhandled error during import process:", err);
});