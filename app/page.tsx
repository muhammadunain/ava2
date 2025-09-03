import TransactionModalComponent from '@/components/ui/home/module/UploadPDF'
import React from 'react'

const Home = () => {
  return (
    <div className='min-h-screen bg-gradient-to-br from-slate-50 to-gray-100'>
      {/* Header Section */}
      <div className='text-center pt-12 pb-8'>
        <div className='max-w-4xl mx-auto px-6'>
          <h1 className='text-4xl md:text-5xl font-bold text-gray-900 mb-4'>
            AI-Powered Real Estate
            <span className='text-blue-600'> Document Analysis </span>
          </h1>
          <p className='text-xl text-gray-600 mb-2'>
            Extract key details from contracts, agreements, and property documents instantly
          </p>
          <p className='text-sm text-gray-500'>
            Upload purchase agreements, lease contracts, property disclosures, and closing documents for automated analysis
          </p>
          
          {/* Feature Pills */}
          <div className='flex flex-wrap justify-center gap-2 mt-6'>
            <span className='px-3 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full'>
              📋 Purchase Agreements
            </span>
            <span className='px-3 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full'>
              🏠 Property Contracts
            </span>
            <span className='px-3 py-1 bg-purple-100 text-purple-700 text-xs font-medium rounded-full'>
              📅 Timeline Extraction
            </span>
            <span className='px-3 py-1 bg-orange-100 text-orange-700 text-xs font-medium rounded-full'>
              💰 Financial Analysis
            </span>
            <span className='px-3 py-1 bg-red-100 text-red-700 text-xs font-medium rounded-full'>
              ⏰ Critical Deadlines
            </span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className='flex items-center justify-center px-6'>
        <TransactionModalComponent/>
      </div>
    </div>
  )
}

export default Home
