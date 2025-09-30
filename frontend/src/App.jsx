import React, { useState, useEffect } from 'react'
import Header from './components/Header'
import Container from './components/Container'
import Footer from './components/Footer'
import { ToastContainer, toast } from 'react-toastify';

const API_BASE_URL = 'http://localhost:3000'

const App = () => {
    const [excelFiles, setExcelFiles] = useState([])
    const [selectedFileData, setSelectedFileData] = useState(null)
    const [activeFilePath, setActiveFilePath] = useState(null); 
    const [isDataModified, setIsDataModified] = useState(false); 

    const fetchExcelData = async (filePath, sheetName) => {
        try {
            setSelectedFileData(null); 
            
            let url = `${API_BASE_URL}/excel/excel-data?path=${filePath}`;
            if (sheetName) {
                url += `&sheet=${sheetName}`;
            }

            const response = await fetch(url);
            
            if (!response.ok) {
                // Throw error to be caught below, including status text if available
                const errorText = await response.text();
                throw new Error(`Failed to fetch file data: ${response.status} ${errorText}`);
            }
            const data = await response.json();
            setSelectedFileData(data);
            console.log(data);
            setActiveFilePath(filePath); 
            setIsDataModified(false); 
        } catch (error) {
            console.error("Error fetching file data:", error);
            setSelectedFileData({ error: `Could not load data. Details: ${error.message.substring(0, 100)}...` }); 
        }
    }

    const handleFileSelection = (filePath) => {
        fetchExcelData(filePath);
    }
    
    // UPDATED: Now passes headers to handleSaveChanges
    const handleSheetSelection = async (newSheetName) => {
        if (!selectedFileData || !activeFilePath) return;

        if (selectedFileData.currentSheet === newSheetName) return;

        if (isDataModified) {
            console.log(`Auto-saving changes for sheet: ${selectedFileData.currentSheet}`);
            const saveSuccess = await handleSaveChanges(
                selectedFileData.rows, 
                selectedFileData.headers,
                selectedFileData.currentSheet
            );

            if (!saveSuccess) {
                console.error('Auto-save failed. Aborting sheet switch.');
                alert('Failed to automatically save changes. Please try again.');
                return; 
            }
        }
        
        fetchExcelData(activeFilePath, newSheetName);
    }

    const handleFileUpload = async (file) => {
        const formData = new FormData();
        formData.append('excelFile', file); 

        try {
            const response = await fetch(`${API_BASE_URL}/excel/upload`, {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                throw new Error('File upload failed');
            }

            const result = await response.json();
            setExcelFiles(prevFiles => [
                ...prevFiles,
                { name: result.name, path: result.path }
            ]);

        } catch (error) {
            console.error("Error uploading file:", error);
            alert(`Upload failed: ${error.message}`);
        }
    }

    // UPDATED: handleSaveChanges now accepts and sends headers
    const handleSaveChanges = async (rows, headers, sheetName) => {
        try {
            const response = await fetch(`${API_BASE_URL}/excel/excel-data/save`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                // NEW: Send headers in the request body
                body: JSON.stringify({ filePath: activeFilePath, sheetName, rows, headers }),
            });
            if (!response.ok) {
                throw new Error('Failed to save changes.');
            }
            toast.success(`Changes saved for sheet "${sheetName}"`);
            setIsDataModified(false); 
            return true;
        } catch (error) {
            console.error('Error saving changes:', error);
            return false;
        }
    };

    const handleCellEdit = (e, rowIndex, colName) => {
        const newValue = e.target.value;
        if (selectedFileData && selectedFileData.rows && selectedFileData.rows[rowIndex]) {
            const newRows = selectedFileData.rows.map((row, index) => {
                if (index === rowIndex) {
                    return { ...row, [colName]: newValue };
                }
                return row;
            });
            
            setSelectedFileData(prevData => ({
                ...prevData,
                rows: newRows,
            }));
            
            setIsDataModified(true);
        }
    };


    const handleAddRow = () => {
        if (!selectedFileData || !selectedFileData.headers) return;
        const newRow = selectedFileData.headers.reduce((acc, header) => ({ ...acc, [header]: '' }), {});
    
        setSelectedFileData(prevData => {
            if (!prevData) return null;
            return {
                ...prevData,
                rows: [...prevData.rows, newRow],
            };
        });
        setIsDataModified(true); 
    };


    const handleDeleteRow = (rowIndex) => {
        if (!selectedFileData) return;
        
        setSelectedFileData(prevData => {
            if (!prevData) return null;
            const newRows = prevData.rows.filter((_, index) => index !== rowIndex);
            return {
                ...prevData,
                rows: newRows,
            };
        });
        setIsDataModified(true); 
    };

    return (
        <div className='flex flex-col w-screen h-screen text-white bg-gray-900 overflow-hidden'> 
            <Header/>
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
            />
            <Footer/>
            <ToastContainer autoClose={2000} />
        </div>
    )
}

export default App