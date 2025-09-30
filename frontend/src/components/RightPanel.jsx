import React, { useState, useRef, useEffect, useCallback } from 'react'
import { Plus, Trash2, Sheet, AlertTriangle, FolderKanban, Dot, CircleCheckBig } from 'lucide-react'

const DEFAULT_COL_WIDTH = 200;
const ACTION_COL_WIDTH = 120;
const DEFAULT_ROW_HEIGHT = 40; // New constant for default row height

const RightPanel = ({ excelData, onSheetSelected, onAddRow, onDeleteRow, onCellEdit, isDataModified }) => {

    const [editingCell, setEditingCell] = useState(null);
    const [columnWidths, setColumnWidths] = useState({});
    const [rowHeights, setRowHeights] = useState({}); // New state for row heights
    const [resizingCol, setResizingCol] = useState(null);
    const [resizingRow, setResizingRow] = useState(null); // New state to track which row is being resized

    // Ref to hold transient column resize data
    const colResizeInfo = useRef({
        startX: 0,
        startWidth: 0,
    });
    
    // Ref to hold transient row resize data
    const rowResizeInfo = useRef({ // New ref
        startY: 0,
        startHeight: 0,
    });

    // --- Initialization Effect (Combined for Columns and Rows) ---

    useEffect(() => {
        if (!excelData) return;

        // 1. Initialize Column Widths
        if (excelData.headers && excelData.headers.length > 0) {
            const newColWidths = excelData.headers.reduce((acc, header) => {
                acc[header] = columnWidths[header] || DEFAULT_COL_WIDTH;
                return acc;
            }, {});
            setColumnWidths(newColWidths);
        } else {
            setColumnWidths({});
        }

        // 2. Initialize Row Heights
        if (excelData.rows && excelData.rows.length > 0) {
            const newRowHeights = excelData.rows.reduce((acc, _, index) => {
                // Use index as the key for row height
                acc[index] = rowHeights[index] || DEFAULT_ROW_HEIGHT;
                return acc;
            }, {});
            setRowHeights(newRowHeights);
        } else {
            setRowHeights({});
        }
    }, [excelData?.headers?.length, excelData?.rows?.length]); // Trigger when sheet data structure changes


    // --- Column Resizing Handlers (Modified to use colResizeInfo) ---

    const handleMouseDown = (e, header) => {
        e.stopPropagation();
        e.preventDefault();

        const headerWidth = columnWidths[header];

        if (headerWidth) {
            setResizingCol(header);
            colResizeInfo.current.startX = e.clientX;
            colResizeInfo.current.startWidth = headerWidth;
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
            document.body.style.cursor = 'col-resize';
        }
    };

    const handleMouseMove = useCallback((e) => {
        if (!resizingCol) return;

        const { startX, startWidth } = colResizeInfo.current;
        const deltaX = e.clientX - startX;
        const newWidth = Math.max(50, startWidth + deltaX);

        setColumnWidths(prevWidths => ({
            ...prevWidths,
            [resizingCol]: newWidth,
        }));
    }, [resizingCol]);

    const handleMouseUp = useCallback(() => {
        if (resizingCol) {
            setResizingCol(null);
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
            document.body.style.cursor = 'default';
        }
    }, [resizingCol, handleMouseMove]);


    // --- Row Resizing Handlers (NEW) ---

    const handleRowMouseDown = (e, rowIndex) => {
        e.stopPropagation();
        e.preventDefault();

        // Find the actual row height from the DOM element to ensure accuracy if CSS overrides are present
        const rowElement = e.currentTarget.closest('tr');
        if (!rowElement) return;
        
        const currentHeight = rowElement.offsetHeight;

        setResizingRow(rowIndex);
        rowResizeInfo.current.startY = e.clientY;
        rowResizeInfo.current.startHeight = currentHeight;
        
        window.addEventListener('mousemove', handleRowMouseMove);
        window.addEventListener('mouseup', handleRowMouseUp);
        document.body.style.cursor = 'row-resize';
    };

    const handleRowMouseMove = useCallback((e) => {
        if (resizingRow === null) return;

        const { startY, startHeight } = rowResizeInfo.current;
        const deltaY = e.clientY - startY;

        // Minimum row height of 20px
        const newHeight = Math.max(20, startHeight + deltaY);

        setRowHeights(prevHeights => ({
            ...prevHeights,
            [resizingRow]: newHeight,
        }));
    }, [resizingRow]);

    const handleRowMouseUp = useCallback(() => {
        if (resizingRow !== null) {
            setResizingRow(null);
            window.removeEventListener('mousemove', handleRowMouseMove);
            window.removeEventListener('mouseup', handleRowMouseUp);
            document.body.style.cursor = 'default';
        }
    }, [resizingRow, handleRowMouseMove]);


    // --- Global Cleanup Effect ---
    useEffect(() => {
        return () => {
            // Clean up column listeners
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
            // Clean up row listeners
            window.removeEventListener('mousemove', handleRowMouseMove);
            window.removeEventListener('mouseup', handleRowMouseUp);
        };
    }, [handleMouseMove, handleMouseUp, handleRowMouseMove, handleRowMouseUp]);


    // --- Existing Handlers & Render Functions ---

    const renderTab = (sheetName) => {
        const isActive = excelData.currentSheet === sheetName;
        return (
            <button
                key={sheetName}
                className={`py-2 px-4 text-sm font-medium transition flex items-center ${isActive
                    ? 'bg-gray-700 border-b-2 border-green-500 text-green-400'
                    : 'bg-gray-800 hover:bg-gray-700 text-white'
                    } rounded-t-lg focus:outline-none`}
                onClick={() => onSheetSelected(sheetName)}
            >
                <Sheet className='w-4 h-4 mr-1' />
                {sheetName}
            </button>
        )
    }

    const handleCellClick = (rowIndex, colName) => {
        setEditingCell({ rowIndex, colName });
    };

    const handleInputChange = (e, rowIndex, colName) => {
        onCellEdit(e, rowIndex, colName);
    };

    const handleInputKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.target.blur();
        }
    };

    if (excelData && excelData.error) {
        return (
            <div className='flex-1 p-8 h-full flex items-center justify-center bg-gray-900'>
                <div className='text-center p-6 border border-red-500 bg-gray-800 rounded-lg shadow-xl'>
                    <AlertTriangle className='w-8 h-8 text-red-500 mx-auto mb-3' />
                    <h2 className='text-xl font-semibold text-red-400 mb-2'>Error Loading Data</h2>
                    <p className='text-gray-400'>{excelData.error}</p>
                </div>
            </div>
        );
    }

    // Calculate total width of the table for horizontal scrolling
    const totalTableWidth = excelData?.headers?.length > 0
        ? excelData.headers.reduce((sum, header) => sum + (columnWidths[header] || DEFAULT_COL_WIDTH), 0) + ACTION_COL_WIDTH
        : '100%';


    return (
        <div className='flex-1 p-4 flex flex-col overflow-hidden bg-gray-900 text-gray-100 font-sans'>
            {excelData ? (
                <div className='w-full h-full flex flex-col'>
                    <div className='flex justify-between items-start mb-4'>
                        <div className='flex flex-col items-start'>
                            <div className='flex gap-2 items-center text-xl font-semibold text-white mb-1'>
                                <FolderKanban className='w-6 h-6 text-cyan-400' />
                                <h1>{excelData.filename}</h1>
                            </div>
                            {isDataModified ? (
                                <div className='flex items-center text-sm text-yellow-400'>
                                    <Dot className='w-6 h-6 animate-pulse' />
                                    <span>Unsaved Changes (Auto-save on sheet switch)</span>
                                </div>
                            ) : (
                                <div className='flex items-center text-sm text-green-400'>
                                    <CircleCheckBig className='w-3 h-3 mr-1' />
                                    <span>All changes saved.</span>
                                </div>
                            )}
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={onAddRow}
                                className='p-2 px-4 bg-green-600 rounded-lg text-sm text-white font-medium hover:bg-green-700 transition flex items-center shadow-lg'
                            >
                                <Plus className='w-4 h-4 mr-1' /> Add Row
                            </button>
                        </div>
                    </div>

                    {excelData.sheetNames && excelData.sheetNames.length > 0 && (
                        <div className='flex overflow-x-auto mb-4 bg-gray-800 rounded-t-lg border-b border-gray-700'>
                            {excelData.sheetNames.map(renderTab)}
                        </div>
                    )}

                    <div className='flex-1 overflow-auto border border-gray-700 rounded-b-lg shadow-2xl'>
                        {excelData.headers.length > 0 ? (
                            <table
                                className='text-sm table-fixed border-collapse'
                                style={{ width: `${totalTableWidth}px` }}
                            >
                                {/* Column Groups for Resizing (Existing Logic) */}
                                <colgroup>
                                    {excelData.headers.map(header => (
                                        <col key={header} style={{ width: `${columnWidths[header] || DEFAULT_COL_WIDTH}px` }} />
                                    ))}
                                    <col style={{ width: `${ACTION_COL_WIDTH}px` }} />
                                </colgroup>

                                <thead className='bg-gray-800 sticky top-0 z-10 shadow-md'>
                                    <tr>
                                        {excelData.headers.map(header => (
                                            <th
                                                key={header}
                                                style={{ width: `${columnWidths[header] || DEFAULT_COL_WIDTH}px` }}
                                                className='p-3 border-r border-gray-700 text-left font-semibold text-green-400 whitespace-nowrap overflow-hidden relative select-none'
                                            >
                                                <div className="flex items-center h-full">
                                                    {header}
                                                </div>
                                                {/* Column Resizer Handle */}
                                                <div
                                                    className={`absolute top-0 right-0 h-full w-2 z-20 transition-colors cursor-col-resize 
                                                             ${resizingCol === header ? 'bg-green-500' : 'hover:bg-green-500/50'}`}
                                                    onMouseDown={(e) => handleMouseDown(e, header)}
                                                    style={{ width: '8px', right: '-4px' }}
                                                />
                                            </th>
                                        ))}
                                        <th
                                            className='p-3 text-center text-red-400 whitespace-nowrap border-l border-gray-700'
                                            style={{ width: `${ACTION_COL_WIDTH}px` }}
                                        >
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {excelData.rows.length > 0 ? (
                                        excelData.rows.map((row, index) => (
                                            <tr 
                                                key={index} 
                                                className='hover:bg-gray-800 transition odd:bg-gray-900 even:bg-gray-950/50 text-gray-200'
                                                style={{ height: `${rowHeights[index] || DEFAULT_ROW_HEIGHT}px` }} // Apply fixed row height
                                            >
                                                {excelData.headers.map(header => (
                                                    <td
                                                        key={header}
                                                        className={`border-r border-b border-gray-700 transition cursor-pointer p-0 align-top relative`}
                                                        onClick={() => handleCellClick(index, header)}
                                                        // Ensure the cell content takes the full height of the row
                                                        style={{ height: '100%' }} 
                                                    >
                                                        {editingCell?.rowIndex === index && editingCell?.colName === header ? (
                                                            <input
                                                                type="text"
                                                                value={row[header] !== undefined && row[header] !== null ? String(row[header]) : ''}
                                                                onBlur={() => setEditingCell(null)}
                                                                onChange={(e) => handleInputChange(e, index, header)}
                                                                onKeyDown={handleInputKeyDown}
                                                                autoFocus
                                                                className="w-full h-full bg-black text-white border border-green-500 rounded-none focus:ring-0 focus:outline-none px-2"
                                                            />
                                                        ) : (
                                                            <div className="w-full h-full px-2 py-1 overflow-hidden text-ellipsis whitespace-wrap flex items-center"
                                                                title={row[header] !== undefined && row[header] !== null ? String(row[header]) : ''}
                                                            >
                                                                {row[header] !== undefined && row[header] !== null ? String(row[header]) : ''}
                                                            </div>
                                                        )}
                                                    </td>
                                                ))}
                                                <td className='p-1 border-b border-gray-700 text-center relative'>
                                                    <button
                                                        onClick={() => onDeleteRow(index)}
                                                        className='text-red-500 hover:text-red-400 transition font-medium text-xs flex items-center justify-center mx-auto p-1 rounded hover:bg-red-900/50'
                                                    >
                                                        <Trash2 className='w-4 h-4 mr-1' /> Delete
                                                    </button>
                                                    {/* Row Resizer Handle (NEW) */}
                                                    <div
                                                        className={`absolute bottom-0 left-0 w-full z-20 transition-colors cursor-row-resize 
                                                                    ${resizingRow === index ? 'bg-green-500' : 'hover:bg-green-500/50'}`}
                                                        onMouseDown={(e) => handleRowMouseDown(e, index)}
                                                        // Style for hit area, positioned at the bottom border
                                                        style={{ height: '4px', bottom: '-2px' }}
                                                    />
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={excelData.headers.length + 1}>
                                                <div className='p-8 text-center text-gray-400 bg-gray-800 h-full flex items-center justify-center'>
                                                    <p className='text-lg'>
                                                        No data rows found in this sheet. Use <strong className="text-green-400">Add Row</strong> to start.
                                                    </p>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        ) : (
                            <div className='p-8 text-center text-gray-400 bg-gray-800 h-full flex items-center justify-center'>
                                <p className='text-lg'>
                                    No headers or data found in sheet.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                <div className='h-full flex items-center justify-center text-gray-500'>
                    <p className='text-xl p-8 bg-gray-800 rounded-lg shadow-xl border border-gray-700'>
                        Select an Excel file from the left panel to display its data.
                    </p>
                </div>
            )}
        </div>
    )
}

export default RightPanel
