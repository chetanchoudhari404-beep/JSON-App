const express = require('express');
const cors = require('cors');
const excelRoutes = require('./routes/excel-routes'); 

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json()); 

// Excel Routes
app.use('/excel', excelRoutes); 

// Test Route
app.get('/', (req, res) => {
    res.send('Hello World! Server is running.');
});

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
});