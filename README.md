# 🚀 AI Interview Analyzer

> **An advanced, fully-functional AI-powered mock interview platform designed to simulate real-world technical and behavioral interviews with real-time multimodal analysis.**

---

## 🌟 The Impact (Why this project stands out)

This project was built to solve a critical problem for job seekers: getting high-quality, actionable, and objective feedback on their interview performance without needing an expensive human coach. 

For an interviewer reviewing this portfolio project, here is why it demonstrates strong engineering capability:

*   **Multimodal AI Integration:** Seamlessly combines Large Language Models (Google Gemini Pro) for semantic analysis, Computer Vision (MediaPipe FaceMesh) for facial tracking, and Audio Processing for speech metrics into a single, cohesive user experience.
*   **Complex State Management:** The React frontend handles highly complex state orchestration simultaneously: live webcam streams, audio recording, real-time computer vision frame processing, active code editor states, and API polling.
*   **Secure Remote Code Execution (RCE):** Built a sandboxed Python execution environment on the FastAPI backend using `subprocess` with strict security timeouts, allowing users to safely compile and test DSA code in real-time.
*   **Premium UI/UX Engineering:** Designed from scratch without reliance on bloated component libraries. Features a custom TailwindCSS design system with a sleek, dark-mode glassmorphism aesthetic, complex CSS animations, and responsive interactive elements.
*   **Data Visualization & Reporting:** Transforms raw AI JSON feedback into digestible, interactive insights using Recharts for historical progress and dynamic PDF generation for session takeaways.

---

## 🎯 Key Features

### 1. 🤖 Smart AI Evaluation (Gemini Pro)
*   Evaluates candidate transcripts in real-time.
*   Extracts emotional **Tone** (e.g., Confident, Hesitant, Enthusiastic).
*   Generates targeted feedback categorized into **Strengths**, **Weaknesses**, and actionable **Improvement Suggestions**.
*   Simultaneously evaluates **both** the spoken transcript and the written code snippet for Technical (DSA) questions.

### 2. 👁️ Advanced Facial & Voice Analytics
*   **Live FaceMesh Tracking:** Runs Google MediaPipe in the browser to calculate:
    *   *Head Pose (Yaw/Pitch)* to detect if the candidate is looking away or centered.
    *   *Smile Frequency* via lip/mouth landmark ratios.
    *   *Eye Contact Percentage* and a composite *Attention Score*.
*   **Speech Metrics:** Calculates Words-Per-Minute (WPM), speaking duration, average words per sentence, and tracks exact **Filler Word** counts (um, uh, like).

### 3. 💻 Sandboxed Coding Environment
*   Integrated **Monaco Editor** (the engine behind VS Code) for a rich coding experience.
*   Candidates can write Python code, execute it via the backend sandbox, and see live console output.
*   The AI evaluates the efficiency and correctness of the code alongside the verbal explanation.

### 4. 📈 Historical Tracking & Dashboards
*   **Company Templates:** Pre-populated settings for FAANG-level mock loops (e.g., Google SWE, Amazon SDET, Meta Frontend).
*   **Progress Tracking:** Dynamic visual charting (Recharts) tracks Performance Trajectories (Overall, Technical, Communication scores) across multiple mock interviews.
*   **Tabbed Reporting UI:** Granular, question-by-question breakdowns of performance metrics.
*   **PDF Exports:** Instant export of comprehensive session analysis via `html2pdf`.

---

## 🧠 Technical Architecture

The application follows a modern, decoupled Client-Server architecture:

*   **Frontend (Client):** React SPA built with Vite. Handles all real-time media constraints (Webcam/Mic), runs the MediaPipe WASM models for on-device facial tracking (reducing server load/latency), and manages the Monaco Editor instance.
*   **Backend (API):** Python FastAPI service. Acts as the orchestration layer between the frontend, the MongoDB database, the Gemini API (for LLM inference), and the local OS (for sandboxed Python code execution).
*   **Database:** MongoDB stores user profiles, historical interview sessions, detailed transcripts, and granular metric payloads for the dashboard charts.

---

## 🛠️ Tech Stack

**Frontend:**
*   React 18 + Vite
*   Tailwind CSS (Custom Layer Architecture + Glassmorphism Theme)
*   Google MediaPipe (`@mediapipe/face_mesh`)
*   Monaco Editor (`@monaco-editor/react`)
*   Recharts (Data Visualization)
*   React Router DOM

**Backend:**
*   Python 3.10+
*   FastAPI & Uvicorn
*   Google Generative AI SDK (Gemini Pro)
*   Motor (Async MongoDB Driver)
*   PyJWT (Authentication)
*   Python `subprocess` (Code Sandboxing)

---

## ⚙️ Setup Instructions

### Prerequisites
*   Node.js (v18+)
*   Python (3.10+)
*   MongoDB Atlas Account (or local MongoDB)
*   Google Gemini API Key

### 1. Backend Setup
1. Navigate to the `backend` directory.
2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Create a `.env` file in the `backend` directory:
   ```env
   GEMINI_API_KEY=your_gemini_key_here
   MONGO_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/?retryWrites=true&w=majority
   SECRET_KEY=your_jwt_secret_key
   ```
4. Start the FastAPI server:
   ```bash
   uvicorn main:app --reload
   ```

### 2. Frontend Setup
1. Navigate to the root directory.
2. Install Node modules:
   ```bash
   npm install
   ```
3. Create a `.env` file in the root directory:
   ```env
   VITE_API_URL=http://127.0.0.1:8000
   ```
4. Start the Vite development server:
   ```bash
   npm run dev
   ```

---

## 🚀 Production Deployment

### Frontend (e.g., Vercel, Netlify)
1. Ensure your `.env` contains the production backend API URL (e.g., `VITE_API_URL=https://api.yourdomain.com`).
2. Run `npm run build`.
3. Deploy the `dist` folder.

### Backend (e.g., Render, Railway, AWS, GCP)
1. Ensure the host provides the `GEMINI_API_KEY`, `MONGO_URI`, and `SECRET_KEY` environment variables.
2. Startup command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
3. Ensure CORS settings in `main.py` explicitly allow requests from your deployed frontend domain.
