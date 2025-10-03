const express = require('express');
const fs = require('fs');
const path = require('path');
const upload = require('../config/multer-config');

const router = express.Router();

// A helper function to recursively find all arrays of objects
const findArrays = (obj, currentPath = '') => {
    let results = [];
    if (typeof obj !== 'object' || obj === null) {
        return results;
    }

    if (Array.isArray(obj)) {
        if (obj.length === 0 || (obj.length > 0 && typeof obj[0] === 'object' && !Array.isArray(obj[0]))) {
            results.push({ path: currentPath, data: obj });
        }
        return results;
    }

    for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
            const newPath = currentPath ? `${currentPath}.${key}` : key;
            const value = obj[key];
            
            if (Array.isArray(value)) {
                if (value.length === 0 || (value.length > 0 && typeof value[0] === 'object' && !Array.isArray(value[0]))) {
                    results.push({ path: newPath, data: value });
                }
            } else if (typeof value === 'object' && value !== null) {
                results = results.concat(findArrays(value, newPath));
            }
        }
    }
    return results;
};

//---

// Endpoint 1: Get File List
const storageDir = path.join(__dirname, '../uploads');
router.get('/files', (req, res) => {
    try {
        if (!fs.existsSync(storageDir)) {
            fs.mkdirSync(storageDir, { recursive: true });
        }
        const files = fs.readdirSync(storageDir).map(file => ({
            name: file,
            path: path.join(storageDir, file)
        }));
        res.json(files);
    } catch (error) {
        console.error('Error fetching file list:', error);
        res.status(500).json({ message: 'Failed to retrieve file list.' });
    }
});

//---

// Endpoint 2: Handle File Upload
router.post('/upload', upload.single('excelFile'), (req, res) => {
    if (!req.file) {
        return res.status(400).send('No file uploaded.');
    }
    
    res.json({
        message: 'File uploaded successfully',
        name: req.file.originalname,
        path: req.file.path
    });
});

//---

// Endpoint 3: Get JSON Data (Optimized for nested arrays)
router.get('/excel-data', (req, res) => {
    const { path: filePath, sheet: selectedSheet } = req.query;
    
    if (!filePath) {
        return res.status(400).send('File path is required.');
    }

    try {
        const fileContent = fs.readFileSync(filePath, 'utf8');
        const fullJsonData = JSON.parse(fileContent);

        const foundArrays = findArrays(fullJsonData);
        const sheetNames = foundArrays.map(arr => arr.path);

        const currentSheetPath = selectedSheet && sheetNames.includes(selectedSheet)
            ? selectedSheet
            : sheetNames[0];

        const selectedSheetData = foundArrays.find(arr => arr.path === currentSheetPath);
        const dataToDisplay = selectedSheetData ? selectedSheetData.data : [];

        const headers = dataToDisplay.length > 0 ? Object.keys(dataToDisplay[0]) : [];

        res.json({
            filename: path.basename(filePath),
            path: filePath,
            sheetNames: sheetNames,
            currentSheet: currentSheetPath,
            headers: headers,
            rows: dataToDisplay,
            fullJsonData: fullJsonData
        });
    } catch (error) {
        console.error('Error reading JSON file:', error);
        if (error.code === 'ENOENT') {
            return res.status(404).send('File not found.');
        }
        if (error instanceof SyntaxError) {
            return res.status(400).send('Invalid JSON file format.');
        }
        res.status(500).send('Failed to read or parse JSON file.');
    }
});

//---

// Endpoint 4: Save Changes
router.post('/excel-data/save', (req, res) => {
    const { filePath, fullJsonData } = req.body;
    
    if (!filePath || !fullJsonData) {
        return res.status(400).send('File path and full JSON data are required.');
    }

    try {
        const jsonString = JSON.stringify(fullJsonData, null, 2);
        fs.writeFileSync(filePath, jsonString, 'utf8');
        res.status(200).json({ message: 'File saved successfully.' });
    } catch (error) {
        console.error('Error saving file:', error);
        res.status(500).send('Failed to save changes.');
    }
});

module.exports = router;