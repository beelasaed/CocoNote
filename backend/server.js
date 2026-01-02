const express = require('express');
const path = require('path');
const app = express();
const PORT = 3000;

// This tells Express to serve all your frontend files
app.use(express.static(path.join(__dirname, '../frontend')));

// Main route to load index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

app.listen(PORT, () => {
    console.log(`CocoNote is running at http://localhost:${PORT}`);
});