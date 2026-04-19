## 🏥 Medibook - AI-Powered Healthcare & Advanced Medical RAG
Medibook is a high-performance healthcare management platform that bridges the gap between patients and reliable medical information. By integrating a sophisticated Retrieval-Augmented Generation (RAG) system, it provides accurate, context-aware medical insights specifically optimized for the Arabic language.

## 🚀 Features
User Authentication: Secure login and registration for patients and medical staff.

Appointment Scheduling: Real-time booking system allowing patients to choose available time slots with specific doctors.

Patient Dashboard: A personalized area for users to view their medical history, upcoming appointments, and profile details.

Doctor Management: Interface for medical staff to manage their daily schedules and update patient statuses.

Medical RAG System: Beyond simple chatbots, Medibook utilizes Retrieval-Augmented Generation to minimize AI hallucinations and provide evidence-based information derived from specialized medical datasets.

Semantic Search Engine: Powered by ChromaDB, the system performs context-aware searches. It understands the meaning behind a query rather than just matching keywords, ensuring high accuracy in medical information retrieval.

User Follow-up Tracking: Integrated SQLite database to manage patient history and follow-up records for long-term health monitoring.

Intelligent Intent Detection: A classification layer that distinguishes between general "chat" and serious medical inquiries. For medical queries, the system provides a structured analysis including:
  Potential Condition Analysis
  Severity/Risk Assessment
  Suggested Medical Specialty

## 🛠️ Tech Stack
# Frontend
  React.js: For building a dynamic and responsive user interface.
  Vite: Used as the build tool for fast development and optimized production bundles.
  Tailwind CSS: For modern, utility-first styling.
  React Router: For smooth client-side navigation.

# Backend & Security
  Flask (Python): Robust RESTful API design for system orchestration.
  SQLite: Reliable management of user data and clinical follow-up history.
  Security & Encryption: Implementation of advanced password hashing and data protection to ensure patient privacy.

# AI & Data Science
  ChromaDB: Vector database for high-efficiency semantic search and medical data indexing.
  OpenRouter API: Access to state-of-the-art Large Language Models (LLMs).
  Deep Translator & Custom NLP: For multilingual processing and Arabic language optimization.


## 📖 How It Works (The RAG Flow)
Query Input: The user asks a medical question (in Arabic, English, or mixed).

Intent Detection: The system determines if the query requires a medical retrieval or a general response.

Semantic Retrieval: The system queries the ChromaDB Vector Store to find the most relevant medical documents.

Augmented Generation: The context from those documents is sent to the LLM (via OpenRouter) to generate a grounded, accurate answer.

Output: The user receives a detailed analysis, including a risk level and the recommended doctor specialty.

## 📥 Installation and Setup
# To get a local copy up and running, follow these steps.
# Prerequisites:
  Node.js (v18 or higher)
  Python (3.9 or higher)
  OpenRouter API Key

# 1. Clone the Repository
  git clone https://github.com/yourusername/medibook.git
  cd medibook
# 2. Backend Setup (Flask)
  cd backend
  python -m venv venv
  source venv/bin/activate  # On Windows: venv\Scripts\activate
  pip install -r requirements.txt
  python app.py
# 3. Frontend Setup (React)
    cd frontend
    npm install
    npm run dev
  
## 📖 Usage
  # as a new patient
    Secure Registration: Sign up as a new patient to unlock the full booking and AI-tracking system.
    AI-Powered Guidance: Use the Medical RAG model to describe your symptoms. The system will analyze your intent and suggest the appropriate medical specialty.
    Provider Discovery: Browse verified doctors based on the AI’s recommendation or specific medical fields.
    Smart Scheduling: Select available dates and times to confirm your appointments instantly
    Personal Health Dashboard: View, confirm, or reschedule upcoming visits.
    Status Tracking: Use the AI assistant to log your recovery progress and track your health status over time through your history records.
    
  # as a new doctor
    Professional Onboarding: Create a medical profile including specialty, credentials, and consultation hours.
    Schedule Management: Manage your daily availability and view upcoming appointments at a glance.
    AI-Assisted Patient History: Access patient records enhanced by AI summaries, allowing you to review symptoms and previous AI-tracking logs before the consultation.
    Consultation Logging: Update patient statuses and medical notes after each visit.
    Performance Analytics: View patient volume and feedback to optimize your clinic's service.
    
  # as a new manger
    System Oversight: Monitor the entire platform's activity from a centralized administrative dashboard.
    User Verification: Review and approve doctor registrations to ensure only qualified professionals are listed.
    AI Model Monitoring: Oversee the performance of the RAG system and semantic search accuracy.
    Operational Analytics: Access high-level reports on appointment trends, specialty demand, and system health.
    Database Management: Maintain the integrity of user records (SQLite) and the medical vector database (ChromaDB).

## 🤝 Contributing
Contributions are what make the open-source community such an amazing place to learn, inspire, and create. Any contributions you make are greatly appreciated.

Fork the Project.

Create your Feature Branch (git checkout -b feature/AmazingFeature).

Commit your Changes (git commit -m 'Add some AmazingFeature').

Push to the Branch (git push origin feature/AmazingFeature).

Open a Pull Request.
