import React from 'react'
import { Upload, FileText, FolderOpen } from 'lucide-react'

const LeftPanel = ({ excelFiles, onFileSelected, onFileUpload }) => {
    
    const handleFileChange = (event) => {
        const file = event.target.files[0];
        if (file) {
            onFileUpload(file); 
        }
        
        event.target.value = null; 
    }

    return (
        <div className='w-64 bg-gray-800 border-r border-gray-700 flex flex-col p-3 overflow-y-auto'>
            <div className='flex flex-col gap-3'>
                
                {/* File Upload Input (Hidden) and Label (Button) */}
                <div className='rounded-lg overflow-hidden shadow-lg'>
                    <label 
                        htmlFor="excel-upload" 
                        className='bg-green-600 hover:bg-green-700 text-white block text-center p-3 cursor-pointer transition flex items-center justify-center font-semibold text-sm'
                    >
                        <Upload className='w-4 h-4 mr-2' />
                        Upload New JSON
                    </label>
                    <input 
                        id="excel-upload"
                        type="file"
                        // Change the 'accept' attribute to '.json'
                        accept=".json" 
                        className='hidden'
                        onChange={handleFileChange}
                    />
                </div>

                {/* File List */}
                <div className='bg-gray-700 rounded-lg shadow-inner flex-1 overflow-hidden'>
                    <h4 className='p-3 font-semibold text-sm text-green-400 border-b border-gray-600 flex items-center'>
                        <FolderOpen className='w-4 h-4 mr-2'/>
                        Available Files
                    </h4>
                    <ul className='divide-y divide-gray-600'>
                        {excelFiles.length > 0 ? (
                            excelFiles.map((file, index) => (
                                <li 
                                    key={index} 
                                    className='p-3 cursor-pointer hover:bg-gray-600 transition truncate flex items-center text-sm'
                                    onClick={() => onFileSelected(file.path)}
                                >
                                    <FileText className='w-4 h-4 mr-2 text-blue-400 flex-shrink-0' />
                                    <span className='truncate'>{file.name}</span>
                                </li>
                            ))
                        ) : (
                            <li className='p-3 text-gray-400 text-sm italic'>
                                No files uploaded yet.
                            </li>
                        )}
                    </ul>
                </div>
            </div>
        </div>
    )
}

export default LeftPanel