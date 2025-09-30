const express = require('express');
const XLSX = require('xlsx');
const path = require('path');
const upload = require('../config/multer-config'); 

const router = express.Router();

// API Endpoint 1: Handle File Upload
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

// API Endpoint 2: Get Excel Data (Stable Version)
router.get('/excel-data', (req, res) => {
    const filePath = req.query.path;
    const sheetName = req.query.sheet;
    
    if (!filePath) {
        return res.status(400).send('File path is required.');
    }

    try {
        const workbook = XLSX.readFile(filePath);
        
        const visibleSheetNames = workbook.Workbook.Sheets
            .filter(sheetInfo => !sheetInfo.Hidden)
            .map(sheetInfo => sheetInfo.name);

        let targetSheetName = sheetName || visibleSheetNames[0];

        if (!visibleSheetNames.includes(targetSheetName)) {
            targetSheetName = visibleSheetNames[0];
        }

        if (!targetSheetName) {
            return res.status(404).json({ filename: path.basename(filePath), sheetNames: [], headers: [], rows: [] })
        }
        
        const worksheet = workbook.Sheets[targetSheetName]

        let headers = [];
        let rows = [];

        if (worksheet && worksheet['!ref']) {
            let range = XLSX.utils.decode_range(worksheet['!ref']);
            let headerRowIndex = -1;
            const MIN_HEADERS_COUNT = 2;

            for (let R = range.s.r; R <= range.e.r; ++R) {
                let populatedCellsCount = 0;
                for (let C = range.s.c; C <= range.e.c; ++C) {
                    const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
                    if (worksheet[cellAddress] && worksheet[cellAddress].v) {
                        populatedCellsCount++;
                    }
                }
                if (populatedCellsCount >= MIN_HEADERS_COUNT) {
                    headerRowIndex = R;
                    break;
                }
            }
            
            if (headerRowIndex !== -1) {
                const newRange = XLSX.utils.encode_range({s: {r: headerRowIndex, c: range.s.c}, e: range.e});
                
                // Use defval: '' to handle empty cells gracefully
                const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1, range: newRange, defval: '' }); 
                
                headers = rawData.length > 0 ? rawData[0] : [];
                const rowArrays = rawData.slice(1);
                
                rows = rowArrays
                    .map(row => {
                        const obj = {};
                        row.forEach((cell, i) => {
                            if (headers[i] !== undefined && headers[i] !== null) { 
                                obj[headers[i]] = cell;
                            }
                        });
                        return obj;
                    })
                    // Filter out completely empty objects/rows 
                    .filter(obj => Object.values(obj).some(val => val !== ''));
            }
        }

        res.json({
            filename: path.basename(filePath),
            path: filePath, 
            sheetNames: visibleSheetNames,
            currentSheet: targetSheetName,
            headers: headers,
            rows: rows
        })

    } catch (error) {
        console.error('Error reading Excel file:', error)
        if (error.code === 'ENOENT') {
            return res.status(404).send('File not found.')
        }
        res.status(500).send('Failed to read or parse Excel file.')
    }
});

// API Endpoint 3: Save Changes (FIXED LOGIC to preserve headers)
router.post('/excel-data/save', (req, res) => {
    // NEW: Destructure headers from the request body
    const { filePath, sheetName, rows, headers } = req.body; 
    
    // Check for headers if rows are empty (required for saving an empty sheet)
    if (!filePath || !sheetName || !rows || (rows.length === 0 && !headers)) {
        return res.status(400).send('File path, sheet name, and data/headers are required.');
    }

    try {
        const workbook = XLSX.readFile(filePath);
        
        let newWorksheet;
        
        if (rows.length > 0) {
            // Case 1: Data exists, use json_to_sheet (infers headers from rows)
            newWorksheet = XLSX.utils.json_to_sheet(rows);
        } else if (headers && headers.length > 0) {
            // Case 2: Data is empty, but headers are provided. 
            // Use aoa_to_sheet to write ONLY the header row.
            newWorksheet = XLSX.utils.aoa_to_sheet([headers]);
        } else {
            // Case 3: Completely empty sheet
            newWorksheet = {};
        }

        // Update the specific sheet in the workbook
        workbook.Sheets[sheetName] = newWorksheet;
        
        XLSX.writeFile(workbook, filePath);
        
        res.status(200).json({ message: 'File saved successfully.' });

    } catch (error) {
        console.error('Error saving file:', error);
        res.status(500).send('Failed to save changes.');
    }
});

module.exports = router;