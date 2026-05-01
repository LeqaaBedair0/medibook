# 🏥 Medibook: Intelligent Healthcare Platform

**Live Demo:** [https://mediibook.duckdns.org](https://mediibook.duckdns.org)

![Build Status](https://img.shields.io/badge/build-passing-brightgreen)
![Docker](https://img.shields.io/badge/Docker-Enabled-blue?logo=docker)
![AWS](https://img.shields.io/badge/AWS-EC2-orange?logo=amazon-aws)
![Python](https://img.shields.io/badge/Python-3.10-blue?logo=python)
![React](https://img.shields.io/badge/React-Vite-61DAFB?logo=react)

> An intelligent, highly-available clinic management system featuring a custom AI Medical Assistant powered by Retrieval-Augmented Generation (RAG). 

Medibook is designed to handle doctor schedules, patient appointments, and clinic reviews while providing real-time, context-aware AI support based on internal clinic documentation.

---

## ✨ Key Features
* **🤖 AI Medical Assistant (RAG):** Answers patient queries accurately using embedded clinic data via ChromaDB and OpenRouter/OpenAI.
* **🌍 Multi-Language Support:** Full UI and backend support for both English and Arabic.
* **🐳 Fully Containerized:** Isolated microservices for the frontend, backend, and vector database.
* **🚢 Continuous Deployment (CI/CD):** Zero-downtime automated deployments to AWS via GitHub Actions.
* **💾 Persistent Storage:** Stateful data and AI embeddings survive container rebuilds using Docker Volumes.

---

## 🏗️ Tech Stack & Architecture

| Layer | Technology | Description |
| :--- | :--- | :--- |
| **Frontend** | React (Vite) | Lightning-fast UI, containerized and port-mapped. |
| **Backend** | Python (Flask/FastAPI) | Handles routing, DB connections, and AI logic. |
| **Database** | SQLite & ChromaDB | Relational data (`medibook.db`) + Vector embeddings (`chroma_data`). |
| **AI / NLP** | LangChain | Orchestrates the Retrieval-Augmented Generation pipeline. |
| **DevOps** | Docker Compose | Multi-container orchestration and environment mapping | Reverse Proxy with Nginx. |
| **Infrastructure**| AWS EC2 (Ubuntu) | Production host server with SSH-based deployment | Security & SSL HTTPS configured via Let's Encrypt (Certbot) | Domain Management DuckDNS Dynamic DNS. | 

---

## ⚙️ Environment Variables
To run this project locally or in production, you must configure the following environment variables. 

**⚠️ Security Note:** Never commit your `.env` file to version control. 

| Variable | Required | Location | Description |
| :--- | :---: | :--- | :--- |
| `OPENROUTER_API_KEY` | ✅ | Backend (`.env`) | API key for generating AI responses and embeddings. |
| `CHROMA_PATH` | ❌ | Backend (`.env`) | Path to vector DB. Defaults to `/app/chroma_data` in Docker. |
| `DATA_PATH` | ❌ | Backend (`.env`) | Path to source docs. Defaults to `/app/data` in Docker. |

---

## 🚀 Local Development

### Prerequisites
* [Docker](https://docs.docker.com/get-docker/) and Docker Compose installed.
* Git installed.

### Quick Start
1. **Clone the repository:**
   ```bash
   git clone [https://github.com/YourUsername/medibook.git](https://github.com/YourUsername/medibook.git)
   cd medibook
2. **Set up your environment:**
    Create a .env file in the root directory:
      echo "OPENROUTER_API_KEY=your_actual_key_here" > .env
3. **Spin up the infrastructure:**
     docker compose up -d --build
4. **Ingest Medical Data (Initialize AI):**
     Ensure you have .txt or .pdf files in backend/data, then run the ingestion script inside the container to build the ChromaDB memory:
       docker exec -it my_backend python backend/populate.py
   
### Access the App:
  Frontend: http://localhost:3000
  Backend API: http://localhost:8000
---

## 🚢 CI/CD Pipeline (GitHub Actions -> AWS)
  This project utilizes a robust deployment pipeline that entirely automates the transition from code push to live production.
  ### The Automated Workflow
  1. Trigger: Code pushed to the main branch.
  2. Authentication: GitHub Actions runner connects to the AWS EC2 instance via SSH (appleboy/ssh-action).
  3. Secret Injection: The OPENROUTER_API_KEY is securely passed from GitHub Secrets into the server's session environment.
  4. Synchronization: The server executes git fetch and git reset --hard to align with the repository state.
  5.Rebuild & Restart: Docker Compose cleanly tears down the old containers and builds the new images.

  ### High Availability & Data Persistence
  The docker-compose.yml is configured with restart: always to ensure maximum uptime. Furthermore, data is strictly decoupled from the ephemeral containers using Docker Volumes:
     - ./medibook.db:/app/medibook.db
     - ./backend/chroma_data:/app/chroma_data
     This guarantees that user accounts, appointments, and AI vector embeddings remain completely intact across deployments and server reboots.


