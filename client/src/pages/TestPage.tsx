import React, { useState } from 'react';

export default function TestPage() {
  const [count, setCount] = useState(0);
  
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <h1 className="text-3xl font-bold mb-8">Test Page</h1>
      
      <div className="flex flex-col items-center space-y-6">
        <div className="text-xl">Count: {count}</div>
        
        <div className="flex space-x-4">
          <button 
            onClick={() => setCount(count - 1)}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            Decrease
          </button>
          
          <button 
            onClick={() => setCount(count + 1)}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
          >
            Increase
          </button>
        </div>
        
        <div className="mt-12">
          <p className="text-center text-gray-300">
            This is a simple test page to verify that button interactions work correctly.
          </p>
        </div>
      </div>
    </div>
  );
}