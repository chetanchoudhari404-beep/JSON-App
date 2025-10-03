import React from 'react';
import LeftPanel from './LeftPanel';
import RightPanel from './RightPanel';

// Update the props list to include onSaveChanges
const Container = ({ excelFiles, onFileSelected, onFileUpload, excelData, onSheetSelected, onAddRow, onDeleteRow, onCellEdit, isDataModified, onCellEditNested, onAddNestedRow, onDeleteNestedRow, onSaveChanges }) => {
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
                onAddRow={onAddRow}
                onDeleteRow={onDeleteRow}
                onCellEdit={onCellEdit}
                isDataModified={isDataModified}
                // Pass down the nested CRUD handlers
                onCellEditNested={onCellEditNested}
                onAddNestedRow={onAddNestedRow}
                onDeleteNestedRow={onDeleteNestedRow}
                onSave={onSaveChanges} // <-- Pass onSaveChanges to RightPanel as onSave
            />
        </div>
    );
};

export default Container;