const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// --- 1. MIDDLEWARE ---
app.use(cors());
app.use(express.json());

// --- 2. STATIC FILES ---
app.use(express.static(path.join(__dirname, '../frontend')));

// Serve the 'backend/uploads' folder so users can view PDFs
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// --- 3. ROUTES ---
const authRoutes = require('./routes/authRoutes');
const noteRoutes = require('./routes/noteRoutes'); // NEW IMPORT

app.use('/api/auth', authRoutes);
app.use('/api/notes', noteRoutes); // NEW ROUTE MOUNT

// --- 4. CATCH-ALL (SPA Support) ---
app.get(/(.*)/, (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// --- 5. ERROR HANDLER ---
app.use((err, req, res, next) => {
    console.error('Unhandled Error:', err);
    res.status(err.status || 500).json({
        message: err.message || 'Internal Server Error',
        error: process.env.NODE_ENV === 'development' ? err : {}
    });
});

// --- 6. START SERVER ---
app.listen(PORT, () => {
    console.log(`____________________________________________________`);
    console.log(`🚀 CocoNote Server running on http://localhost:${PORT}`);
    console.log(`____________________________________________________`);
});