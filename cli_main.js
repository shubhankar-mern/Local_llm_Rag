import "dotenv/config";
import * as readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
// Imports the four required functions (index, run, delete, load) from index.js
import { indexDocuments, runRAG, deleteVectorStoreData, loadRetriever } from './index.js';

// Global variable for the readline interface
let rl;

/**
 * Executes necessary cleanup before exiting the application.
 */
function cleanupAndExit() {
    console.log('\n\n👋 Shutting down CLI... Goodbye!');
    if (rl) {
        rl.close();
    }
    // We use process.exit to ensure the Node process terminates cleanly
    process.exit(0); 
}

// Asynchronous function to handle the CLI interaction
async function startCLI() {
    console.log("Welcome to the Persistent HNSWLib RAG CLI Tool!");
    console.log("==============================================\n");

    
    rl = readline.createInterface({ input, output });

  
    rl.on('SIGINT', () => {
        console.log('\n\nCtrl+C detected. Initiating graceful shutdown...');
        cleanupAndExit();
    });

    
    await loadRetriever();


    while (true) {
      
        const isIndexReady = (await loadRetriever()) !== null; 

        console.log("---------------------------------------");
        console.log(`STATUS: Index is ${isIndexReady ? '✅ READY' : '⚠️ NOT LOADED'}`);
        console.log("---------------------------------------");
        console.log("Please enter your choice:");
        console.log(" 1. Index Document (Create & save persistent index)");
        console.log(" 2. Load Index (Load existing index from disk)");
        console.log(" 3. Ask a Question (Run RAG chain)");
        console.log(" 4. Delete Index (Remove persistent index from disk)");
        console.log(" 5. Exit Application");

        const userChoice = await rl.question('\n> Enter choice (1-5): ');
        console.log('\n');

        switch (userChoice) {
            case '1':
                const userHaveLinks = await rl.question('>> Do you have URLs to index? (y/n): ');
                if (userHaveLinks.toLowerCase() === 'y') {
                    const userLinksInput = await rl.question('>> Please enter the URL ');
                    await indexDocuments(userLinksInput);
                } else {    
                await indexDocuments();
                }
                break;
            case '2':
                await loadRetriever();
                break;
            case '3':
                if (isIndexReady) {
                    const userQuestion = await rl.question('>> Please enter your question: ');
                  
                    const answer = await runRAG(userQuestion);
                    
                    console.log("\n--- RAG Answer ---");
                    console.log(answer);
                    console.log("------------------\n");
                } else {
                    console.log("🛑 Cannot ask question. Index is not loaded. Please run option 1 or 2 first.");
                }
                break;
            case '4':
                await deleteVectorStoreData();
                break;
            case '5':
                cleanupAndExit();
                break;
            default:
                console.log(`Invalid choice: "${userChoice}". Please enter a number between 1 and 5.\n`);
        }
    }
}


startCLI().catch(err => {
    console.error("An unhandled error occurred:", err);
    cleanupAndExit();
});