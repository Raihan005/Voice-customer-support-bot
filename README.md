# Voice Customer Support Bot

This project is a complete Voice Customer Support Bot platform that features a LiveKit-powered voice agent capable of natural conversations, retrieving dynamic data from a database, and answering policy questions via a Retrieval-Augmented Generation (RAG) pipeline.

## Features
- **Voice Customer Support Agent**: Interacts with users seamlessly using STT (Speech-to-Text), LLM (Large Language Model), and TTS (Text-to-Speech) pipelines.
- **Database Tools**: The voice agent is equipped with tool-calling capabilities to access a PostgreSQL database. It can fetch real-time user profiles and order histories during live conversations.
- **RAG Implementation**: Answers specific company policy questions (like returns, shipping, warranty) by embedding policies using **Gemini's embedding model**.
- **Vector Database**: Utilizes `pgvector` on top of PostgreSQL to store embeddings and perform fast similarity searches for the RAG pipeline.

## Tech Stack
- **Frontend**: Vite + React (Modern, responsive UI)
- **Backend**: Node.js + Express (Handles API logic and database interactions securely)
- **Database**: PostgreSQL with `pgvector` (Run locally via Docker Compose)
- **Voice Agent**: Python LiveKit Agent Module
  - Integrates state-of-the-art **STT, LLM, and TTS** models for low-latency conversations.

## How to Run Locally

### Prerequisites
- [Docker](https://docs.docker.com/get-docker/) & Docker Compose
- [Node.js](https://nodejs.org/) (v18+ recommended)
- [Python 3](https://www.python.org/)
- API Keys for LiveKit and Gemini.

### 1. Environment Setup
Create a `.env` file in the root directory based on the `.env.example` file and fill in your actual credentials (database passwords, LiveKit keys, and Gemini API keys).

### 2. Start the Database
Use Docker Compose to spin up the PostgreSQL database (which includes `pgvector`):
```bash
docker-compose up -d
```

### 3. Start the Backend API
Navigate to the backend directory, install dependencies, and run the server:
```bash
cd backend
npm install
npm run dev
```

### 4. Start the Frontend
Navigate to the frontend directory, install dependencies, and run the Vite development server:
```bash
cd frontend
npm install
npm run dev
```

### 5. Run the Voice Agent
Navigate to the agent directory, set up your Python virtual environment, install the dependencies, and start the agent script:
```bash
cd agent
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
python agent.py dev
```

## Future Work
- **Hosting and Deployment**: Transition the locally running application to a production-ready environment. 
  - The PostgreSQL/pgvector database and backend server are planned to be hosted on a cloud provider like Railway.
  - The LiveKit voice agent service will be deployed to the LiveKit Cloud platform.
  - The Vite + React frontend will be deployed on a global CDN (like Vercel or Netlify).
