import React, { useState, useEffect, useCallback } from 'react';
import Header from './components/Header';
import Container from './components/Container';
import Footer from './components/Footer';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const API_BASE_URL = 'http://localhost:3000';

const App = () => {
    const [excelFiles, setExcelFiles] = useState([]);
    const [selectedFileData, setSelectedFileData] = useState(null);
    const [activeFilePath, setActiveFilePath] = useState(null);
    const [isDataModified, setIsDataModified] = useState(false);

    const fetchExcelData = async (filePath, sheetName) => {
        try {
            setSelectedFileData(null);

            let url = `${API_BASE_URL}/excel/excel-data?path=${encodeURIComponent(filePath)}`;
            if (sheetName) {
                url += `&sheet=${encodeURIComponent(sheetName)}`;
            }

            const response = await fetch(url);

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Failed to fetch file data: ${response.status} ${errorText}`);
            }
            const data = await response.json();
            setSelectedFileData(data);
            setActiveFilePath(filePath);
            setIsDataModified(false);
        } catch (error) {
            console.error("Error fetching file data:", error);
            setSelectedFileData({ error: `Could not load data. Details: ${error.message.substring(0, 100)}...` });
        }
    };

    const handleFileSelection = (filePath) => {
        fetchExcelData(filePath);
    };

    const handleSheetSelection = async (newSheetName) => {
        if (!selectedFileData || !activeFilePath) return;

        if (selectedFileData.currentSheet === newSheetName) return;

        if (isDataModified) {
            console.log(`Auto-saving changes for sheet: ${selectedFileData.currentSheet}`);
            const saveSuccess = await handleSaveChanges();

            if (!saveSuccess) {
                console.error('Auto-save failed. Aborting sheet switch.');
                alert('Failed to automatically save changes. Please try again.');
                return;
            }
        }

        fetchExcelData(activeFilePath, newSheetName);
    };

    const handleFileUpload = async (file) => {
        const formData = new FormData();
        formData.append('excelFile', file);

        try {
            const response = await fetch(`${API_BASE_URL}/excel/upload`, {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'File upload failed');
            }

            const result = await response.json();
            const filePath = result.path;
            const fileName = result.name;

            setExcelFiles(prevFiles => {
                const isNewFile = !prevFiles.some(f => f.path === filePath);
                if (isNewFile) {
                    return [...prevFiles, { name: fileName, path: filePath }];
                }
                return prevFiles;
            });
            fetchExcelData(filePath);

        } catch (error) {
            console.error("Error uploading file:", error);
            toast.error(`Upload failed: ${error.message}`);
        }
    };

    const handleSaveChanges = async () => {
        if (!activeFilePath || !selectedFileData || !selectedFileData.fullJsonData) {
            console.error("Missing data to save.");
            return false;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/excel/excel-data/save`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ filePath: activeFilePath, fullJsonData: selectedFileData.fullJsonData }),
            });
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText || 'Failed to save changes.');
            }
            toast.success(`Changes saved for sheet "${selectedFileData.currentSheet}"`);
            setIsDataModified(false);
            return true;
        } catch (error) {
            console.error('Error saving changes:', error);
            toast.error(`Save failed: ${error.message}`);
            return false;
        }
    };

    const handleCellEdit = useCallback((e, rowIndex, colName) => {
        const newValue = e.target.value;
        if (!selectedFileData || !selectedFileData.rows) return;

        const newRows = selectedFileData.rows.map((row, index) => {
            if (index === rowIndex) {
                return { ...row, [colName]: newValue };
            }
            return row;
        });

        setSelectedFileData(prevData => {
            if (!prevData) return null;
            const newFullJsonData = updateNestedObject(prevData.fullJsonData, prevData.currentSheet, newRows);
            return {
                ...prevData,
                rows: newRows,
                fullJsonData: newFullJsonData
            };
        });
        setIsDataModified(true);
    }, [selectedFileData]);

    const handleAddRow = useCallback(() => {
        if (!selectedFileData || !selectedFileData.headers) return;
        const newRow = selectedFileData.headers.reduce((acc, header) => ({ ...acc, [header]: '' }), {});

        setSelectedFileData(prevData => {
            if (!prevData) return null;
            const newRows = [...prevData.rows, newRow];
            const newFullJsonData = updateNestedObject(prevData.fullJsonData, prevData.currentSheet, newRows);
            return {
                ...prevData,
                rows: newRows,
                fullJsonData: newFullJsonData
            };
        });
        setIsDataModified(true);
    }, [selectedFileData]);

    const handleDeleteRow = useCallback((rowIndex) => {
        if (!selectedFileData || !selectedFileData.rows) return;

        setSelectedFileData(prevData => {
            if (!prevData) return null;
            const newRows = prevData.rows.filter((_, index) => index !== rowIndex);
            const newFullJsonData = updateNestedObject(prevData.fullJsonData, prevData.currentSheet, newRows);
            return {
                ...prevData,
                rows: newRows,
                fullJsonData: newFullJsonData
            };
        });
        setIsDataModified(true);
    }, [selectedFileData]);

    const handleCellEditNested = useCallback((rowIndex, fullPathSegment, itemIndex, nestedHeader, newValue) => {
    setSelectedFileData(prevData => {
        if (!prevData) return null;

        let fullPath;

        // 1. Path Root: SheetName[rowIndex]
        const pathRoot = `${prevData.currentSheet}[${rowIndex}]`;
        
        // 2. Path Segment: fullPathSegment (e.g., 'items' or 'items[0].subitems')

        if (itemIndex === -1) {
            // Case for Single Object Edit (e.g., { meta: 'value' })
            // Path: SheetName[rowIndex].fullPathSegment.nestedHeader
            // fullPathSegment is the key for the object (e.g., 'metadata')
            fullPath = `${pathRoot}.${fullPathSegment}.${nestedHeader}`;
        } else {
            // Case for Array of Objects Edit (e.g., [{ id: 1 }, { id: 2 }])
            // Path: SheetName[rowIndex].fullPathSegment[itemIndex].nestedHeader
            fullPath = `${pathRoot}.${fullPathSegment}[${itemIndex}].${nestedHeader}`;
        }

        // Clean up: removes any resulting double dots or leading dots
        fullPath = fullPath.replace(/\.+/g, '.').replace(/^\./, '');

        console.log(`Editing Path: ${fullPath} with value: ${newValue}`); // Debug

        const newFullJsonData = updateNestedObject(prevData.fullJsonData, fullPath, newValue);

        // This line is crucial: It must fetch the top-level array for the current sheet
        const newRows = getNestedValue(newFullJsonData, prevData.currentSheet);

        return {
            ...prevData,
            rows: newRows,
            fullJsonData: newFullJsonData
        };
    });
    setIsDataModified(true);
}, []);

    const handleAddNestedRow = useCallback((rowIndex, nestedColumn) => {
        setSelectedFileData(prevData => {
            if (!prevData) return null;

            // The path to the array we want to append to: SheetName[MainRowIndex].NestedColumnName
            const arrayPath = `${prevData.currentSheet}[${rowIndex}].${nestedColumn}`;

            const currentArray = getNestedValue(prevData.fullJsonData, arrayPath) || [];

            // Determine headers for the new row
            const newNestedHeaders = currentArray.length > 0 ? Object.keys(currentArray[0]) : ['new_key']; // Fallback for empty array
            const newNestedRow = newNestedHeaders.reduce((acc, header) => ({ ...acc, [header]: '' }), {});

            const newArray = [...currentArray, newNestedRow];

            const newFullJsonData = updateNestedObject(prevData.fullJsonData, arrayPath, newArray);

            // Re-fetch data to keep the UI in sync
            const newRows = getNestedValue(newFullJsonData, prevData.currentSheet);
            // console.log(newRows);
            return {
                ...prevData,
                rows: newRows,
                fullJsonData: newFullJsonData
            };
        });
        setIsDataModified(true);
    }, []);

    const handleDeleteNestedRow = useCallback((rowIndex, nestedColumn, itemIndex) => {
        setSelectedFileData(prevData => {
            if (!prevData) return null;

            // The path to the array we want to modify: SheetName[MainRowIndex].NestedColumnName
            const arrayPath = `${prevData.currentSheet}[${rowIndex}].${nestedColumn}`;

            const currentArray = getNestedValue(prevData.fullJsonData, arrayPath);
            const newArray = currentArray.filter((_, idx) => idx !== itemIndex);

            const newFullJsonData = updateNestedObject(prevData.fullJsonData, arrayPath, newArray);

            // Re-fetch data to keep the UI in sync
            const newRows = getNestedValue(newFullJsonData, prevData.currentSheet);
            // console.log(newRows);
            return {
                ...prevData,
                rows: newRows,
                fullJsonData: newFullJsonData
            };
        });
        setIsDataModified(true);
    }, []);

    // Recursive helper function to update nested object by path
    // New, Immutable update function for App.js
    const updateNestedObject = (obj, path, value) => {
        // 1. Break the path into parts (handling key[index] notation)
        const parts = path.split('.').flatMap(part => {
            const match = part.match(/^(.*?)\[(\d+)\]$/);
            if (match) {
                // e.g., 'items[0]' -> ['items', '0']
                return [match[1], match[2]];
            }
            return [part];
        }).filter(p => p); // Filter out any empty strings

        // Base case: If no parts, return the value directly
        if (parts.length === 0) return value;

        // 2. Recursive update function
        const update = (currentObj, keys) => {
            const [key, ...rest] = keys;

            // If the key is an array index
            const index = parseInt(key);
            if (!isNaN(index) && Array.isArray(currentObj)) {
                // If it's the last part, set the value
                if (rest.length === 0) {
                    return currentObj.map((item, i) => i === index ? value : item);
                }
                // Otherwise, recursively update the nested item
                return currentObj.map((item, i) =>
                    i === index ? update(item, rest) : item
                );
            }
            // If the key is an object property
            else if (typeof currentObj === 'object' && currentObj !== null) {
                // If it's the last part, set the value
                if (rest.length === 0) {
                    return { ...currentObj, [key]: value };
                }
                // Otherwise, recursively update the nested property
                return {
                    ...currentObj,
                    [key]: update(currentObj[key] || (isNaN(parseInt(rest[0])) ? {} : []), rest)
                };
            }

            // Fallback for non-object/array values (shouldn't happen with correct path)
            return currentObj;
        };

        return update(obj, parts);
    };

    // Helper to get nested value by path
    const getNestedValue = (obj, path) => {
        const parts = path.split('.').flatMap(part => {
            const match = part.match(/^(.*?)\[(\d+)\]$/);
            if (match) {
                return [match[1], match[2]];
            }
            return [part];
        }).filter(p => p);

        return parts.reduce((acc, part) => {
            if (acc === undefined || acc === null) return undefined;

            // Check if the part is an array index
            const index = parseInt(part);
            if (!isNaN(index) && Array.isArray(acc)) {
                return acc[index];
            }
            // Otherwise, treat it as an object key
            else {
                return acc[part];
            }
        }, obj);
    };

    useEffect(() => {
        const fetchFiles = async () => {
            try {
                const response = await fetch(`${API_BASE_URL}/excel/files`);
                if (!response.ok) {
                    throw new Error('Failed to fetch file list');
                }
                const files = await response.json();
                setExcelFiles(files);
            } catch (error) {
                console.error('Error fetching file list:', error);
            }
        };
        fetchFiles();
    }, []);

    return (
        <div className='flex flex-col w-screen h-screen text-white bg-gray-900 overflow-hidden'>
            <Header />
            <Container
                excelFiles={excelFiles}
                onFileSelected={handleFileSelection}
                onFileUpload={handleFileUpload}
                excelData={selectedFileData}
                onSheetSelected={handleSheetSelection}
                onSaveChanges={handleSaveChanges}
                onAddRow={handleAddRow}
                onDeleteRow={handleDeleteRow}
                onCellEdit={handleCellEdit}
                isDataModified={isDataModified}
                onCellEditNested={handleCellEditNested}
                onAddNestedRow={handleAddNestedRow}
                onDeleteNestedRow={handleDeleteNestedRow}
            />
            <Footer />
            <ToastContainer autoClose={2000} />
        </div>
    );
};

export default App;