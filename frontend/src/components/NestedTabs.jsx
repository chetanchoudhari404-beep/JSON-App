import React, { useState } from 'react';
import NestedDataTable from './NestedDataTable';

const NestedTabs = ({ data, headers, rowIndex, onAddNestedRow, onDeleteNestedRow, onCellEditNested }) => {
    const [activeTab, setActiveTab] = useState(headers.length > 0 ? headers[0] : null);
    

    if (!headers || headers.length === 0 || !data) {
        return (
            <div className="p-4 bg-gray-850 text-gray-400 text-sm">
                No nested data available.
            </div>
        );
    }

    let nestedData = data[activeTab];
    let nestedHeaders = [];

    if (Array.isArray(nestedData) && nestedData.length > 0) {
        // Case 1: Array of Objects
        nestedHeaders = Object.keys(nestedData[0]);
    } else if (typeof nestedData === 'object' && nestedData !== null) {
        // Case 2: Single Object (Non-array)
        nestedHeaders = Object.keys(nestedData);
    }

    return (
        <div className="p-4 bg-gray-850 rounded-lg my-2 flex flex-col">
            <div className="flex justify-start items-center border-b border-gray-700 mb-4">
                {headers.map((header) => (
                    <button
                        key={header}
                        className={`py-2 px-4 text-sm font-medium rounded-t-lg transition ${activeTab === header
                            ? 'bg-gray-700 text-green-400 border-b-2 border-green-500'
                            : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                            }`}
                        onClick={() => setActiveTab(header)}
                    >
                        {header}
                    </button>
                ))}
            </div>

            {activeTab && (
                <NestedDataTable
                    data={data[activeTab]}
                    headers={nestedHeaders}
                    rowIndex={rowIndex}
                    nestedColumn={activeTab} 
                    onAddNestedRow={onAddNestedRow}
                    onDeleteNestedRow={onDeleteNestedRow}
                    onCellEditNested={onCellEditNested}
                />
            )}
        </div>
    );
};

export default NestedTabs;