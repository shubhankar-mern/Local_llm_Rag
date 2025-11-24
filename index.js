import "dotenv/config";
import { ChatOpenAI, OpenAIEmbeddings } from "@langchain/openai";
import { CheerioWebBaseLoader } from "@langchain/community/document_loaders/web/cheerio";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { HNSWLib } from "@langchain/community/vectorstores/hnswlib"; // --- CHANGE 1: Import HNSWLib ---
import { pull } from "langchain/hub";
import { formatDocumentsAsString } from "@langchain/classic/util/document";
import { RunnableSequence, RunnablePassthrough } from "@langchain/core/runnables";
import { StringOutputParser } from "@langchain/core/output_parsers";
import * as fs from 'node:fs/promises'; // Needed to check for index existence

// --- Configuration ---
const VECTOR_STORE_PATH = "hnswlib_rag_index"; 
let vectorStoreRetriever; // Global variable to hold the retriever instance

// --- 1. Load, Split & Save Documents (Indexing Phase) ---
async function indexDocuments(ulink) {
    console.log("Starting indexing phase...");
    let url = ulink;
    if (!url) {
        url = "https://www.freecodecamp.org/news/the-next-js-handbook/";  
    }
    
    const loader = new CheerioWebBaseLoader(
        url
    );
    const docs = await loader.load();
    
   
    const textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
    });
    const splits = await textSplitter.splitDocuments(docs);

    
    console.log("Creating embeddings and persistent HNSWLib index...");
    const vectorStore = await HNSWLib.fromDocuments(
      splits,
      new OpenAIEmbeddings({ apiKey: process.env.OPENAI_API_KEY })
    );

    
    await vectorStore.save(VECTOR_STORE_PATH);
    vectorStoreRetriever = vectorStore.asRetriever();

    console.log(`Indexed ${splits.length} document chunks and saved to '${VECTOR_STORE_PATH}'.`);
    return vectorStoreRetriever;
}

// --- Helper function to load the index if it already exists ---
async function loadRetriever() {
    try {
       
        await fs.stat(VECTOR_STORE_PATH); 
        
        console.log(`Loading existing HNSWLib index from disk: '${VECTOR_STORE_PATH}'...`);
        
        
        const vectorStore = await HNSWLib.load(VECTOR_STORE_PATH, new OpenAIEmbeddings({ apiKey: process.env.OPENAI_API_KEY }));
        vectorStoreRetriever = vectorStore.asRetriever();
        
        console.log("Index loaded successfully.");
        return vectorStoreRetriever;
    } catch (error) {
        if (error.code === 'ENOENT') {
            console.log("Persistent index not found. You must run 'indexDocuments' first.");
        } else {
            console.error("Error loading index:", error.message);
        }
        return null;
    }
}

// --- 2. Build the RAG Chain (Retrieval and Generation Phase) ---
async function buildRAGChain(retriever) {
    if (!retriever) {
        console.error("Retriever is null. Cannot build RAG chain.");
        return null;
    }

   
    const llm = new ChatOpenAI({ model: "gpt-3.5-turbo", temperature: 0 });

    
    const ragPrompt = await pull("rlm/rag-prompt");
    
    
    const ragChain = RunnableSequence.from([
        {
            
            context: retriever.pipe(formatDocumentsAsString), 
           
            question: new RunnablePassthrough(), 
        },
       
        ragPrompt,
       
        llm,
       
        new StringOutputParser(),
    ]);

    return ragChain;
}

// --- 3. Run the RAG System ---
async function runRAG(question) {
    
    let retrieverInstance = vectorStoreRetriever || await loadRetriever();

    if (!retrieverInstance) {
        return "ERROR: RAG index is not available. Please run the Index Document step (option 1) first.";
    }

    
    const ragChain = await buildRAGChain(retrieverInstance);
    
    if (!ragChain) return "ERROR: Failed to build RAG chain.";

    console.log(`\nInvoking RAG chain with question: "${question}"`);
    
    const result = await ragChain.invoke(question);

    return result;
}

/**
 * Function to delete the persistent HNSWLib index from disk.
 */
async function deleteVectorStoreData() {
    try {
        console.log(`Deleting persistent index directory: '${VECTOR_STORE_PATH}'...`);
        
      
        await fs.rm(VECTOR_STORE_PATH, { recursive: true, force: true });
        
        vectorStoreRetriever = null; 
        console.log("✅ HNSWLib index deleted successfully from disk.");
        
    } catch (error) {
        if (error.code === 'ENOENT') {
             console.log("Index folder not found, assuming it is already deleted.");
        } else {
             console.error("❌ Error during index deletion:", error.message);
        }
    }
}

export { indexDocuments, runRAG, deleteVectorStoreData, loadRetriever };