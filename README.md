# India Vendor Onboarding Agent - TinyFish API

An autonomous web agent that automates the vendor onboarding process on the India GST Portal.

## Architecture
- **Frontend**: React + Vite (A sleek, single-page UI)
- **Backend**: Node.js + Express (Handles API logic)
- **Agent Layer**: TinyFish API (Takes high-level goals and streams back real browser interactions)

---

## Setup Instructions

### 1. Configure the Backend
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Create a `.env` file and add your TinyFish API key:
   ```bash
   TINYFISH_API_KEY=your_api_key_here
   ```
3. Start the Express server:
   ```bash
   npm start
   ```

### 2. Configure the Frontend
1. Open a new terminal and navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies (may have been done automatically by Vite):
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```

## Running the Demo
1. Open up your browser to the local Vite URL (usually `http://localhost:5173`).
2. You will see the Vendor Configuration pre-filled with the mock JSON payload representing the company details.
3. Click **Start Autonomous Onboarding**.
4. Watch the right-hand panel! It will stream the live telemetry of the TinyFish agent as it navigates the GST portal, interacts with form elements, and prepares the document uploads.

---
