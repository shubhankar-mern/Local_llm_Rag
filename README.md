Persistent RAG CLI with HNSWLib & OpenAI

This project provides a robust Command Line Interface (CLI) application for Retrieval-Augmented Generation (RAG) using modern JavaScript and the LangChain framework. It is designed to demonstrate persistent vector indexing using the high-performance HNSWLib library, allowing the index to be saved locally and reloaded quickly without re-embedding data.

🚀 Key Features

Persistent Storage: The RAG index is saved to the local directory (hnswlib_rag_index/) using HNSWLib, enabling fast startups after the initial indexing run.

Web Loader: Uses the CheerioWebBaseLoader to scrape and index content from a publicly available URL.

OpenAI Integration: Utilizes OpenAI's embeddings (text-embedding-ada-002) and chat model (gpt-3.5-turbo) for RAG generation.

Interactive CLI: A simple menu system for indexing, loading, querying, and deleting the data store.

🛠️ Prerequisites

To run this application, you must have:

Node.js: Version 18 or higher.

OpenAI API Key: Required for generating embeddings and LLM responses.

⚙️ Setup and Installation

1. Create Project Directory

Make sure you are in your project directory (e.g., SimpleAI).

2. Install Dependencies

This project relies on several modular LangChain packages and their peer dependencies.