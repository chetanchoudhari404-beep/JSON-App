import React from 'react'
import LeftPanel from './LeftPanel'
import RightPanel from './RightPanel'

// Updated props list
const Container = ({ excelFiles, onFileSelected, onFileUpload, excelData, onSheetSelected, onSaveChanges, onAddRow, onDeleteRow, onCellEdit, isDataModified }) => {
    return (
        <div className='flex-1 w-full flex overflow-hidden'> 
            <LeftPanel 
                excelFiles={excelFiles} 
                onFileSelected={onFileSelected} 
                onFileUpload={onFileUpload}
            />
            <RightPanel 
                excelData={excelData} 
                onSheetSelected={onSheetSelected}
                onSaveChanges={onSaveChanges} 
                onAddRow={onAddRow}
                onDeleteRow={onDeleteRow} 
                onCellEdit={onCellEdit} // Passed down
                isDataModified={isDataModified} // Passed down
            />
        </div>
    )
}

export default Container