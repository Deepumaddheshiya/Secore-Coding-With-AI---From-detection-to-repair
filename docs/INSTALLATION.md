# Installation Guide

This guide describes how to install and configure SecureCode AI on Windows.

---

## 1. Prerequisites

- **Operating System:** Windows 10/11 (or Linux/macOS)
- **Python:** 3.10+ (Current system: Python 3.11.9)
- **Node.js:** v18+ (Current system: Node v22.19.0, npm 10.9.3)
- **Git:** Installed and available in PATH

---

## 2. Setting Up the Backend

1. **Navigate to the project root:**
   ```powershell
   cd c:\Users\Deepu\OneDrive\Desktop\SECURE_CODING_WITH_AI
   ```

2. **Create and activate a virtual environment (optional but recommended):**
   ```powershell
   python -m venv venv
   .\venv\Scripts\Activate.ps1
   ```

3. **Install Python dependencies:**
   ```powershell
   pip install -r backend/requirements.txt
   ```

4. **Verify Flawfinder installation:**
   ```powershell
   flawfinder --version
   ```

---

## 3. Setting Up the Frontend

1. **Navigate to the frontend directory:**
   ```powershell
   cd c:\Users\Deepu\OneDrive\Desktop\SECURE_CODING_WITH_AI\frontend
   ```

2. **Install node modules:**
   ```powershell
   npm install
   ```

3. **Build or run development server:**
   ```powershell
   npm run build
   # or
   npm run dev
   ```

---

## 4. Optional: Local Ollama Setup

If you wish to use a local LLM for code repair without any cloud API keys:
1. Ensure Ollama is installed (`ollama --version`).
2. Run the Ollama server:
   ```powershell
   ollama serve
   ```
3. Pull a coding model:
   ```powershell
   ollama pull qwen2.5-coder:1.5b
   ```
If Ollama is not running, the system automatically falls back to deterministic rule-based repair.
