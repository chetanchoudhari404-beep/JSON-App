import React from 'react'
import { FileSpreadsheet } from 'lucide-react';

const Header = () => {
  return (
    <div className='h-12 bg-gray-800 border-b border-gray-700 flex items-center px-4 shadow-md'>
        <FileSpreadsheet className='w-6 h-6 text-green-400 mr-2' />
        <h1 className='text-xl font-bold text-white'>Excel Manager App</h1>
    </div>
  )
}

export default Header