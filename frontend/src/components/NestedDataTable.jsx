import React, { useState } from 'react';
import { Plus, Trash2, ChevronDown, ChevronRight } from 'lucide-react';
import NestedTabs from './NestedTabs';

const NestedDataTable = ({
  data,
  headers,
  rowIndex,
  nestedColumn,
  onAddNestedRow,
  onDeleteNestedRow,
  onCellEditNested,
}) => {
  const [editingCell, setEditingCell] = useState(null);
  const [expandedRows, setExpandedRows] = useState({});

  if (!data || data.length === 0) {
    return (
      <div className="p-4 text-gray-400 text-sm">
        No data for this sheet/tab.
      </div>
    );
  }

  // Check if data is an array (Array of Objects) or a single object.
  const isArrayOfObjects = Array.isArray(data);
  const isSingleObject = !isArrayOfObjects && typeof data === 'object' && data !== null;


  const visibleHeaders = headers.filter(header => {
    const firstRowValue = data[0]?.[header];
    return !(Array.isArray(firstRowValue) && firstRowValue.every(item => typeof item === 'object'));
  });

  const nestedObjectHeaders = headers.filter(header => {
    const firstRowValue = data[0]?.[header];
    return (Array.isArray(firstRowValue) && firstRowValue.every(item => typeof item === 'object'));
  });

  const handleCellClick = (itemIndex, nestedHeader) => {
    setEditingCell({ itemIndex, nestedHeader });
  };

  const handleInputChange = (e, itemIndex, nestedHeader) => {
    const newValue = e.target.value;
    console.log(newValue)
    // Pass nestedColumn (which is the column key) to App.js
    onCellEditNested(rowIndex, nestedColumn, itemIndex, nestedHeader, newValue);
  };

  const handleInputKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.target.blur();
    }
  };

  const handleToggleExpand = (itemIndex) => {
    setExpandedRows(prev => ({
      ...prev,
      [itemIndex]: !prev[itemIndex]
    }));
  };

  if (isSingleObject) {
    return (
      <div className="p-4 bg-gray-900/50 rounded-lg">
        <h4 className="text-md font-semibold text-yellow-400 mb-3">Edit Object: {nestedColumn}</h4>
        <div className="grid grid-cols-2 gap-4">
          {Object.keys(data).map(header => (
            <div key={header} className="flex flex-col">
              <label className="text-xs font-medium text-gray-400 mb-1">{header}</label>
              <input
                type="text"
                value={data[header] !== undefined && data[header] !== null ? String(data[header]) : ''}
                // For single object, itemIndex is 0 (or irrelevant), we pass null and handle the pathing in App.js if needed.
                // The pathing for a single object is easier: SheetName[rowIndex].nestedColumn.header
                // We can use itemIndex = 0 for consistency if App.js pathing is fixed, but let's use the object structure.
                // A better approach is to create a specific handler in App.js for SingleObjectEdit.
                // BUT for now, let's use the existing handler and pass a dummy index (0) since there's only one "row" in this case.
                onChange={(e) => onCellEditNested(rowIndex, nestedColumn, -1, header, e.target.value)}
                className="w-full bg-black text-white border border-gray-600 rounded p-2 text-sm focus:border-green-500 focus:ring-green-500"
              />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Ensure the rest of the component only runs for ArrayOfObjects
  if (!isArrayOfObjects) {
    return <div className="p-4 text-gray-400 text-sm">No data for this nested field.</div>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-xs table-auto border-collapse">
        <thead>
          <tr>
            {nestedObjectHeaders.length > 0 && <th className="w-10"></th>}
            {visibleHeaders.map((header) => (
              <th
                key={header}
                className="p-2 border-b border-gray-600 text-left font-medium text-green-400"
              >
                {header}
              </th>
            ))}
            <th className="p-2 border-b border-gray-600 text-center text-red-400">Actions</th>
          </tr>
        </thead>
        <tbody>
          {data.map((item, itemIndex) => (

            <React.Fragment key={itemIndex}>
              <tr className="border-b border-gray-700 hover:bg-gray-600/50 transition">
                {nestedObjectHeaders.length > 0 && (
                  <td className="w-10 p-0 text-center">
                    <button
                      onClick={() => handleToggleExpand(itemIndex)}
                      className="p-1 rounded hover:bg-gray-700"
                    >
                      {expandedRows[itemIndex] ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                    </button>
                  </td>
                )}
                {visibleHeaders.map((header) => (
                  <td
                    key={header}
                    className="p-1 text-gray-300 relative cursor-pointer"
                    onClick={() => handleCellClick(itemIndex, header)}
                  >
                    {editingCell?.itemIndex === itemIndex && editingCell?.nestedHeader === header ? (
                      <input
                        type="text"
                        value={item[header] !== undefined && item[header] !== null ? String(item[header]) : ''}
                        onChange={(e) => handleInputChange(e, itemIndex, header)}
                        onBlur={() => setEditingCell(null)}
                        onKeyDown={handleInputKeyDown}
                        autoFocus
                        className="w-full h-full bg-black text-white border border-green-500 rounded-none focus:ring-0 focus:outline-none px-2"
                      />
                    ) : (
                      <div
                        className="px-2 py-1 overflow-hidden text-ellipsis whitespace-nowrap"
                        title={item[header] !== undefined && item[header] !== null ? String(item[header]) : ''}
                      >
                        {String(item[header])}
                      </div>
                    )}
                  </td>
                ))}
                <td className="p-1 text-center">
                  <button
                    onClick={() => onDeleteNestedRow(rowIndex, nestedColumn, itemIndex)}
                    className='text-red-500 hover:text-red-400 transition flex items-center justify-center mx-auto p-1 rounded hover:bg-red-900/50'
                  >
                    <Trash2 className='w-3 h-3' />
                  </button>
                </td>
              </tr>
              {expandedRows[itemIndex] && nestedObjectHeaders.length > 0 && (
                <tr key={`${itemIndex}-nested-data`}>
                  <td colSpan={headers.length + 1}>
                    <div className="p-4 bg-gray-800 rounded-b-lg">
                      {nestedObjectHeaders.map(nestedHeader => {
                        const newFullPathSegment = `${nestedColumn}[${itemIndex}].${nestedHeader}`;
                        return (
                          <div key={nestedHeader}>
                            <NestedTabs
                              data={item}
                              headers={[nestedHeader]}
                              rowIndex={rowIndex}
                              nestedColumn={newFullPathSegment}
                              onAddNestedRow={onAddNestedRow}
                              onDeleteNestedRow={onDeleteNestedRow}
                              onCellEditNested={onCellEditNested}
                            />
                          </div>
                        );

                      })}
                    </div>
                  </td>
                </tr>
              )}
            </React.Fragment>
          ))}
        </tbody>
      </table>
      <button
        onClick={() => onAddNestedRow(rowIndex, nestedColumn)}
        className='mt-4 p-2 px-4 bg-green-600 rounded-lg text-xs text-white hover:bg-green-700 transition flex items-center'
      >
        <Plus className='w-3 h-3 mr-1' /> Add Nested Row
      </button>
    </div>
  );
};

export default NestedDataTable;