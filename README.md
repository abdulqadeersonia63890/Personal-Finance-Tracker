# Personal Finance Tracker
React + Vite frontend, Node.js + Express backend. Transactions are saved in a JSON file, so MySQL is not required.

## Run on Windows
1. Extract ZIP and open this folder in VS Code.
2. In terminal run:
   ```bash
   npm install
   npm run install:all
   npm run dev
   ```
3. Open http://localhost:5173

Backend API runs on http://localhost:5000. Data is stored at `server/data/transactions.json`.
Features: add/edit/delete transactions, income and expenses, filters/search, summary cards, charts, CSV export.
This is a learning portfolio project, not a production banking application.
