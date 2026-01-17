const express = require('express');
const cors = require('cors'); 
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// --- 1. MIDDLEWARE (Security & Setup) ---
app.use(cors()); // Fixes "Cross-Origin" errors
app.use(express.json()); // Allows the server to read JSON data

// --- 2. STATIC FILES (Frontend & Uploads) ---
app.use(express.static(path.join(__dirname, '../frontend')));
app.use('/uploads', express.static(path.join(__dirname, '../frontend/uploads')));

// --- 3. ROUTES (The New Logic) ---
const authRoutes = require('./routes/authRoutes');

// Mount the Auth Routes
// Any URL starting with /api/auth goes to authRoutes
app.use('/api/auth', authRoutes);  

// --- 4. CATCH-ALL (Fix for Express v5 Error) ---
// We use /(.*)/ instead of '*' because Express 5 changed how wildcards work
app.get(/(.*)/, (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// --- 5. START SERVER ---
app.listen(PORT, () => {
    console.log(`____________________________________________________`);
    console.log(`🚀 CocoNote Server running on http://localhost:${PORT}`);
    console.log(`____________________________________________________`);
});