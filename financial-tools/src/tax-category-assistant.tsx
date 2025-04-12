import { useState } from 'react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';

export default function TaxCategoryAssistant() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [viewMode, setViewMode] = useState('categorize'); // 'categorize' or 'summary'
  const [processedCount, setProcessedCount] = useState(0);
  const [changedCount, setChangedCount] = useState(0);
  
  // Tax categories for individuals
  const taxCategories = {
    income: [
      'Wages & Salary',
      'Self-Employment Income',
      'Interest Income',
      'Dividend Income',
      'Capital Gains',
      'Rental Income',
      'Other Income'
    ],
    deductions: [
      'Mortgage Interest',
      'Property Tax',
      'Medical Expenses',
      'Charitable Donations',
      'State & Local Taxes',
      'Education Expenses',
      'Student Loan Interest',
      'Retirement Contributions',
      'Home Office',
      'Health Insurance (Self-Employed)',
      'Business Expenses',
      'Other Deductions'
    ],
    other: [
      'Personal (Non-Deductible)',
      'Transfer Between Accounts',
      'Reimbursable Expense',
      'Credit Card Payment',
      'Unknown/Need to Research'
    ]
  };
  
  // Sample expense descriptions to category mappings
  const categoryMatcher = {
    'doctor': 'Medical Expenses',
    'hospital': 'Medical Expenses',
    'clinic': 'Medical Expenses',
    'pharmacy': 'Medical Expenses',
    'rx': 'Medical Expenses',
    'dental': 'Medical Expenses',
    'optometrist': 'Medical Expenses',
    
    'tuition': 'Education Expenses',
    'school': 'Education Expenses',
    'college': 'Education Expenses',
    'university': 'Education Expenses',
    'books': 'Education Expenses',
    
    'donation': 'Charitable Donations',
    'donate': 'Charitable Donations',
    'charity': 'Charitable Donations',
    'nonprofit': 'Charitable Donations',
    
    'mortgage': 'Mortgage Interest',
    'property tax': 'Property Tax',
    
    'paycheck': 'Wages & Salary',
    'direct deposit': 'Wages & Salary',
    'salary': 'Wages & Salary',
    
    'business': 'Business Expenses',
    'office': 'Business Expenses',
    'supplies': 'Business Expenses',
    'client': 'Business Expenses',
    
    'rent payment': 'Rental Income',
    'rental income': 'Rental Income',
    
    'dividend': 'Dividend Income',
    'interest': 'Interest Income',
    
    'ira': 'Retirement Contributions',
    '401k': 'Retirement Contributions',
    'retirement': 'Retirement Contributions',
    
    'student loan': 'Student Loan Interest',
    
    'transfer': 'Transfer Between Accounts',
    'credit card payment': 'Credit Card Payment',
    'cc payment': 'Credit Card Payment',
    
    'restaurant': 'Personal (Non-Deductible)',
    'coffee': 'Personal (Non-Deductible)',
    'grocery': 'Personal (Non-Deductible)',
    'amazon': 'Personal (Non-Deductible)',
    'netflix': 'Personal (Non-Deductible)',
    'spotify': 'Personal (Non-Deductible)',
    'uber': 'Personal (Non-Deductible)',
    'lyft': 'Personal (Non-Deductible)'
  };
  
  // Function to handle file upload
  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    setLoading(true);
    
    const fileReader = new FileReader();
    fileReader.onload = (e) => {
      try {
        // Check file extension
        if (file.name.endsWith('.csv')) {
          Papa.parse(e.target.result, {
            header: true,
            complete: (results) => processFileData(results.data),
            error: handleFileError
          });
        } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet);
          processFileData(jsonData);
        } else {
          alert('Unsupported file format. Please upload a CSV or Excel file.');
          setLoading(false);
        }
      } catch (error) {
        handleFileError(error);
      }
    };
    
    if (file.name.endsWith('.csv')) {
      fileReader.readAsText(file);
    } else {
      fileReader.readAsArrayBuffer(file);
    }
  };
  
  // Process the file data
  const processFileData = (data) => {
    // Try to identify relevant columns
    const processedData = data.map(row => {
      // Find date column
      const dateKey = findKey(row, ['date', 'timestamp', 'time', 'day']);
      // Find description column
      const descriptionKey = findKey(row, ['description', 'desc', 'memo', 'name', 'transaction', 'details']);
      // Find amount column
      const amountKey = findKey(row, ['amount', 'sum', 'value', 'price', 'cost']);
      // Find category column if exists
      const categoryKey = findKey(row, ['category', 'type', 'classification', 'tag']);
      
      // Initialize with default tax category
      let suggestedTaxCategory = 'Unknown/Need to Research';
      
      // Try to suggest a tax category based on description
      if (row[descriptionKey]) {
        const description = row[descriptionKey].toLowerCase();
        
        // Loop through our category matchers
        for (const [keyword, category] of Object.entries(categoryMatcher)) {
          if (description.includes(keyword.toLowerCase())) {
            suggestedTaxCategory = category;
            break;
          }
        }
      }
      
      return {
        date: row[dateKey] || '',
        description: row[descriptionKey] || '',
        amount: row[amountKey] || '',
        originalCategory: row[categoryKey] || '',
        taxCategory: row[categoryKey] || suggestedTaxCategory,
        suggestedTaxCategory,
        isProcessed: false,
        originalObject: row
      };
    });
    
    setTransactions(processedData);
    setCurrentIndex(0);
    setProcessedCount(0);
    setChangedCount(0);
    setLoading(false);
  };
  
  // Handle file upload errors
  const handleFileError = (error) => {
    console.error('Error processing file:', error);
    alert('Error processing file. Please check the format and try again.');
    setLoading(false);
  };
  
  // Find a key in an object that matches (case-insensitive) any of the given keywords
  const findKey = (obj, keywords) => {
    const keys = Object.keys(obj);
    for (const key of keys) {
      for (const keyword of keywords) {
        if (key.toLowerCase().includes(keyword.toLowerCase())) {
          return key;
        }
      }
    }
    return keys[0] || ''; // Return first key as fallback
  };
  
  // Set the tax category for the current transaction
  const setTaxCategory = (category) => {
    if (currentIndex >= transactions.length) return;
    
    const updatedTransactions = [...transactions];
    const wasChanged = updatedTransactions[currentIndex].taxCategory !== category;
    
    updatedTransactions[currentIndex].taxCategory = category;
    updatedTransactions[currentIndex].isProcessed = true;
    
    setTransactions(updatedTransactions);
    setProcessedCount(prev => prev + 1);
    
    if (wasChanged) {
      setChangedCount(prev => prev + 1);
    }
    
    // Move to next transaction
    if (currentIndex < transactions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      // All done, show summary
      setViewMode('summary');
    }
  };
  
  // Skip the current transaction
  const skipTransaction = () => {
    if (currentIndex >= transactions.length - 1) {
      setViewMode('summary');
    } else {
      setCurrentIndex(currentIndex + 1);
    }
  };
  
  // Export categorized transactions
  const exportCategorizedTransactions = () => {
    // Format for export
    const exportData = transactions.map(tx => {
      // Create a copy of the original object
      const exportObj = {...tx.originalObject};
      
      // Add or update the tax category field
      exportObj.TaxCategory = tx.taxCategory;
      
      return exportObj;
    });
    
    // Create a workbook
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Tax Categorized");
    
    // Generate Excel file
    XLSX.writeFile(workbook, "Tax_Categorized_Transactions.xlsx");
  };
  
  // Render category button
  const renderCategoryButton = (category) => {
    const currentTx = transactions[currentIndex] || {};
    const isActive = currentTx.taxCategory === category;
    
    return (
      <button
        key={category}
        onClick={() => setTaxCategory(category)}
        className={`px-3 py-1 m-1 text-sm rounded-md transition-colors ${
          isActive 
            ? 'bg-blue-600 text-white' 
            : 'bg-gray-200 hover:bg-gray-300'
        }`}
      >
        {category}
      </button>
    );
  };
  
  // Render category groups
  const renderCategoryGroup = (title, categories) => {
    return (
      <div className="mb-4">
        <h3 className="font-medium mb-2">{title}</h3>
        <div className="flex flex-wrap">
          {categories.map(category => renderCategoryButton(category))}
        </div>
      </div>
    );
  };
  
  // Render the categorization screen
  const renderCategorizer = () => {
    if (transactions.length === 0) return null;
    if (currentIndex >= transactions.length) {
      setViewMode('summary');
      return null;
    }
    
    const currentTx = transactions[currentIndex];
    
    return (
      <div className="mt-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">
            Categorize Transactions ({currentIndex + 1} of {transactions.length})
          </h2>
          <div className="text-sm text-gray-600">
            {processedCount} categorized, {changedCount} changed
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          <div className="grid md:grid-cols-3 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
              <div className="p-2 bg-gray-50 rounded">{currentTx.date}</div>
            </div>
            <div className="md:col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
              <div className="p-2 bg-gray-50 rounded">
                ${parseFloat(currentTx.amount).toFixed(2)}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Original Category</label>
              <div className="p-2 bg-gray-50 rounded">{currentTx.originalCategory || 'None'}</div>
            </div>
          </div>
          
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <div className="p-3 bg-gray-50 rounded font-medium">
              {currentTx.description}
            </div>
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Suggested Tax Category
            </label>
            <div className="p-2 bg-blue-50 text-blue-700 rounded font-medium">
              {currentTx.suggestedTaxCategory}
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-4">Select Tax Category</h3>
          
          {renderCategoryGroup('Income', taxCategories.income)}
          {renderCategoryGroup('Deductions', taxCategories.deductions)}
          {renderCategoryGroup('Other', taxCategories.other)}
          
          <div className="flex justify-between mt-6">
            <button
              onClick={skipTransaction}
              className="px-4 py-2 bg-gray-200 rounded-md"
            >
              Skip For Now
            </button>
            <button
              onClick={() => setViewMode('summary')}
              className="px-4 py-2 bg-blue-600 text-white rounded-md"
            >
              View Summary
            </button>
          </div>
        </div>
      </div>
    );
  };
  
  // Render the summary screen
  const renderSummary = () => {
    // Group by tax category
    const categorySummary = {};
    let totalAmount = 0;
    
    transactions.forEach(tx => {
      const category = tx.taxCategory;
      const amount = parseFloat(tx.amount) || 0;
      
      if (!categorySummary[category]) {
        categorySummary[category] = {
          count: 0,
          total: 0,
          transactions: []
        };
      }
      
      categorySummary[category].count++;
      categorySummary[category].total += amount;
      categorySummary[category].transactions.push(tx);
      
      totalAmount += amount;
    });
    
    return (
      <div className="mt-8">
        <h2 className="text-lg font-semibold mb-4">Tax Category Summary</h2>
        
        <div className="bg-blue-50 p-4 rounded-lg mb-6">
          <div className="flex justify-between">
            <div>
              <div className="text-sm text-gray-600">Total Transactions</div>
              <div className="text-xl font-bold">{transactions.length}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Processed</div>
              <div className="text-xl font-bold text-green-600">
                {processedCount} ({Math.round((processedCount / transactions.length) * 100)}%)
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Total Amount</div>
              <div className="text-xl font-bold">${totalAmount.toFixed(2)}</div>
            </div>
          </div>
        </div>
        
        <div className="mb-8">
          <h3 className="font-medium mb-3">Category Breakdown</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white shadow-md rounded-lg overflow-hidden">
              <thead className="bg-gray-100">
                <tr>
                  <th className="py-3 px-4 text-left font-medium">Category</th>
                  <th className="py-3 px-4 text-left font-medium">Count</th>
                  <th className="py-3 px-4 text-left font-medium">Total</th>
                  <th className="py-3 px-4 text-left font-medium">Percentage</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(categorySummary)
                  .sort((a, b) => b[1].total - a[1].total)
                  .map(([category, data]) => (
                    <tr key={category} className="border-t">
                      <td className="py-3 px-4">{category}</td>
                      <td className="py-3 px-4">{data.count}</td>
                      <td className="py-3 px-4">${data.total.toFixed(2)}</td>
                      <td className="py-3 px-4">
                        {Math.round((data.total / totalAmount) * 100)}%
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
        
        <div className="flex justify-between">
          <button
            onClick={() => {
              setCurrentIndex(0);
              setViewMode('categorize');
            }}
            className="px-4 py-2 bg-gray-200 rounded-md"
          >
            Continue Categorizing
          </button>
          <button
            onClick={exportCategorizedTransactions}
            className="px-4 py-2 bg-green-600 text-white rounded-md"
          >
            Export Categorized Transactions
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Tax Category Assistant</h1>
      
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-lg font-semibold mb-4">Import Transactions</h2>
        <p className="mb-4 text-sm text-gray-600">
          Upload your transactions file to begin categorizing for tax reporting
        </p>
        
        <input
          type="file"
          accept=".csv,.xlsx,.xls"
          onChange={handleFileUpload}
          className="block w-full text-sm text-gray-500
            file:mr-4 file:py-2 file:px-4
            file:rounded-md file:border-0
            file:text-sm file:font-semibold
            file:bg-blue-50 file:text-blue-700
            hover:file:bg-blue-100"
        />
        
        {loading && <p className="mt-2 text-blue-600">Processing your file...</p>}
        
        {transactions.length > 0 && (
          <div className="mt-3 text-sm text-green-600">
            Loaded {transactions.length} transactions
          </div>
        )}
      </div>
      
      {viewMode === 'categorize' ? renderCategorizer() : renderSummary()}
      
      <div className="mt-8 text-sm text-gray-500">
        <h3 className="font-medium mb-2">About this Tool</h3>
        <p>
          This assistant helps you categorize your transactions for tax reporting purposes.
          It automatically suggests categories based on transaction descriptions and allows
          you to quickly assign appropriate tax categories to each transaction.
        </p>
      </div>
    </div>
  );
}