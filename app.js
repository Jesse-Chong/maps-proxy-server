const express = require('express');
const cors = require('cors');
const route = require('./routes');
const PORT = 3001;
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use('/', route);

// Route
app.get('/', (req, res) => {
    res.send('This is the home');
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});