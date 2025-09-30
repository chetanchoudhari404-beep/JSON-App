import React from 'react'
import { Code } from 'lucide-react';

const Footer = () => {
  return (
    <div className='h-8 bg-gray-800 border-t border-gray-700 flex items-center justify-center text-xs text-gray-500'>
        <Code className='w-3 h-3 mr-1' />
        <p>Excel App 2025</p>
    </div>
  )
}

export default Footer