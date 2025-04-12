import { useState, useEffect } from 'react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';

export default function TransactionVerificationTool() {
  const [transactionData, setTransactionData] = useState([]);
  const [cardStatements, setCardStatements] = useState([]);
  const [missingTransactions, setMissingTransactions] = useState([]);
  const [step, setStep] = useState(1);
  const [fileData, setFileData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [taxCategories, setTaxCategories] = useState([
    'Income', 'Business Expense', 'Medical', 'Charity', 
    'Mortgage Interest', 'Property Tax', 'Education', 
    'Retirement Contribution', 'Personal (Non-Deductible)'
  ]);
  const [months, setMonths] = useState({
    'November 2024': false,
    'December 2024': false
  });
  
  // Function to handle Excel file import
  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    setLoading(true);
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        
        setFileData(jsonData);
        setTransactionData(jsonData);
        setLoading(false);
        setStep(2);
      } catch (error) {
        console.error("Error processing Excel file:", error);
        setLoading(false);
        alert("Error processing the file. Please make sure it's a valid Excel file.");
      }
    };
    
    reader.readAsBinaryString(file);
  };
  
  // Function to handle credit card statement paste
  const handleStatementPaste = (event) => {
    const text = event.target.value;
    
    // Parse the pasted text (simple CSV format assumption)
    Papa.parse(text, {
      complete: (results) => {
        const parsedData = results.data
          .filter(row => row.length > 1) // Filter out empty rows
          .map(row => {
            // Try to extract date and amount using regex
            const dateMatch = row.find(cell => /\d{1,2}\/\d{1,2}\/\d{2,4}/.test(cell));
            const amountMatch = row.find(cell => /\$?\d+\.\d{2}/.test(cell));
            
            // Find the description (typically the longest cell that's not a date or amount)
            const description = row
              .filter(cell => cell !== dateMatch && cell !== amountMatch)
              .sort((a, b) => b.length - a.length)[0] || '';
            
            return {
              date: dateMatch || '',
              description: description,
              amount: amountMatch ? amountMatch.replace(/[^\d.-]/g, '') : '',
              matched: false,
              taxCategory: '',
              notes: ''
            };
          })
          .filter(item => item.date && item.amount); // Only keep rows with date and amount
          
        setCardStatements(parsedData);
        findMissingTransactions(transactionData, parsedData);
      }
    });
  };
  
  // Find transactions in card statements that don't match existing data
  const findMissingTransactions = (existingData, statementData) => {
    // This is a simplified approach - in reality you'd want more sophisticated matching
    const missing = statementData.filter(statement => {
      // Check if this statement matches any existing transaction
      const isExisting = existingData.some(existing => {
        // Compare date and amount (simplified)
        const existingDate = existing.date || existing.Date || existing.Timestamp;
        const existingAmount = existing.amount || existing.Amount;
        const statementDate = new Date(statement.date);
        
        // Normalize dates for comparison
        let existingDateObj;
        try {
          existingDateObj = new Date(existingDate);
        } catch (e) {
          return false;
        }
        
        // Match if date is within 2 days and amount is the same
        const dateDiff = Math.abs(existingDateObj - statementDate) / (1000 * 60 * 60 * 24);
        const amountMatch = parseFloat(existingAmount) === parseFloat(statement.amount);
        
        return dateDiff <= 2 && amountMatch;
      });
      
      return !isExisting;
    });
    
    setMissingTransactions(missing);
    if (missing.length > 0) {
      setStep(3);
    } else {
      setStep(4); // Skip to summary if no missing transactions
    }
  };
  
  // Update tax category for a missing transaction
  const updateTaxCategory = (index, category) => {
    const updated = [...missingTransactions];
    updated[index].taxCategory = category;
    setMissingTransactions(updated);
  };
  
  // Update notes for a missing transaction
  const updateNotes = (index, notes) => {
    const updated = [...missingTransactions];
    updated[index].notes = notes;
    setMissingTransactions(updated);
  };
  
  // Add all categorized transactions
  const addMissingTransactions = () => {
    // In a real app, you would update your database here
    setStep(4);
  };
  
  // Export the completed data
  const exportData = () => {
    const combinedData = [
      ...transactionData,
      ...missingTransactions.map(tx => ({
        Date: tx.date,
        Description: tx.description,
        Amount: tx.amount,
        Category: tx.taxCategory,
        Notes: tx.notes
      }))
    ];
    
    // Create a worksheet from the data
    const worksheet = XLSX.utils.json_to_sheet(combinedData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Completed Transactions");
    
    // Generate Excel file
    XLSX.writeFile(workbook, "Completed_2024_Transactions.xlsx");
  };
  
  // Toggle month completion status
  const toggleMonth = (month) => {
    setMonths({
      ...months,
      [month]: !months[month]
    });
  };
  
  // Render the appropriate step
  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="p-6 bg-white rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">Step 1: Import Your Existing Transactions</h2>
            <div className="mb-4">
              <p className="mb-2">Upload your Budget and Income Tracker spreadsheet:</p>
              <input 
                type="file" 
                accept=".xlsx,.xls" 
                onChange={handleFileUpload}
                className="block w-full text-sm text-gray-500
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-md file:border-0
                  file:text-sm file:font-semibold
                  file:bg-blue-50 file:text-blue-700
                  hover:file:bg-blue-100"
              />
            </div>
            <div className="mb-4">
              <h3 className="font-medium mb-2">Month Verification:</h3>
              <div className="flex flex-col space-y-2">
                {Object.keys(months).map(month => (
                  <label key={month} className="inline-flex items-center">
                    <input
                      type="checkbox"
                      checked={months[month]}
                      onChange={() => toggleMonth(month)}
                      className="rounded text-blue-500"
                    />
                    <span className="ml-2">I've verified all transactions for {month}</span>
                  </label>
                ))}
              </div>
            </div>
            {loading && <p className="text-blue-600">Loading your data...</p>}
          </div>
        );
        
      case 2:
        return (
          <div className="p-6 bg-white rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">Step 2: Paste Credit Card Statements</h2>
            <p className="mb-4">Paste your credit card statement text below to find missing transactions:</p>
            <textarea
              className="w-full h-48 p-2 border rounded-md mb-4"
              placeholder="Paste your credit card statement here..."
              onChange={handleStatementPaste}
            ></textarea>
            <div className="flex justify-between">
              <button 
                onClick={() => setStep(1)} 
                className="px-4 py-2 bg-gray-200 rounded-md"
              >
                Back
              </button>
              <button 
                onClick={() => setStep(3)}
                className="px-4 py-2 bg-blue-500 text-white rounded-md"
                disabled={cardStatements.length === 0}
              >
                Find Missing Transactions
              </button>
            </div>
          </div>
        );
        
      case 3:
        return (
          <div className="p-6 bg-white rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">Step 3: Categorize Missing Transactions</h2>
            {missingTransactions.length === 0 ? (
              <p className="mb-4">No missing transactions found! All your records match.</p>
            ) : (
              <>
                <p className="mb-4">We found {missingTransactions.length} transactions that might be missing from your records:</p>
                <div className="overflow-x-auto">
                  <table className="min-w-full bg-white">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="py-2 px-4 text-left">Date</th>
                        <th className="py-2 px-4 text-left">Description</th>
                        <th className="py-2 px-4 text-left">Amount</th>
                        <th className="py-2 px-4 text-left">Tax Category</th>
                        <th className="py-2 px-4 text-left">Notes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {missingTransactions.map((tx, index) => (
                        <tr key={index} className="border-b">
                          <td className="py-2 px-4">{tx.date}</td>
                          <td className="py-2 px-4">{tx.description}</td>
                          <td className="py-2 px-4">${parseFloat(tx.amount).toFixed(2)}</td>
                          <td className="py-2 px-4">
                            <select 
                              value={tx.taxCategory}
                              onChange={(e) => updateTaxCategory(index, e.target.value)}
                              className="w-full p-1 border rounded"
                            >
                              <option value="">Select Category</option>
                              {taxCategories.map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                              ))}
                            </select>
                          </td>
                          <td className="py-2 px-4">
                            <input
                              type="text"
                              value={tx.notes}
                              onChange={(e) => updateNotes(index, e.target.value)}
                              className="w-full p-1 border rounded"
                              placeholder="Add notes..."
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
            <div className="flex justify-between mt-6">
              <button 
                onClick={() => setStep(2)} 
                className="px-4 py-2 bg-gray-200 rounded-md"
              >
                Back
              </button>
              <button 
                onClick={addMissingTransactions}
                className="px-4 py-2 bg-blue-500 text-white rounded-md"
              >
                Add Missing Transactions
              </button>
            </div>
          </div>
        );
        
      case 4:
        return (
          <div className="p-6 bg-white rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">Step 4: Summary and Export</h2>
            <div className="mb-6 p-4 bg-green-50 rounded-lg">
              <h3 className="font-medium text-green-700 mb-2">Verification Complete!</h3>
              <p className="text-green-600">
                Your transaction data has been processed and is ready for tax preparation.
              </p>
            </div>
            
            <div className="mb-6">
              <h3 className="font-medium mb-2">Transaction Summary:</h3>
              <ul className="list-disc ml-6 space-y-1">
                <li>Original Transactions: {transactionData.length}</li>
                <li>Added Missing Transactions: {missingTransactions.length}</li>
                <li>Total Verified Transactions: {transactionData.length + missingTransactions.length}</li>
              </ul>
            </div>
            
            <div className="mb-6">
              <h3 className="font-medium mb-2">Month Verification Status:</h3>
              <ul className="list-disc ml-6 space-y-1">
                {Object.entries(months).map(([month, verified]) => (
                  <li key={month} className={verified ? "text-green-600" : "text-red-600"}>
                    {month}: {verified ? "Verified" : "Not Verified"}
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="flex justify-between">
              <button 
                onClick={() => setStep(3)} 
                className="px-4 py-2 bg-gray-200 rounded-md"
              >
                Back
              </button>
              <button 
                onClick={exportData}
                className="px-4 py-2 bg-green-600 text-white rounded-md"
              >
                Export Completed Transactions
              </button>
            </div>
          </div>
        );
        
      default:
        return <div>Unknown step</div>;
    }
  };

  return (
    <div className="max-w-4xl mx-auto my-8">
      <h1 className="text-2xl font-bold mb-6 text-center">2024 Transaction Verification Tool</h1>
      
      {/* Progress Indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          {[1, 2, 3, 4].map(stepNumber => (
            <div 
              key={stepNumber}
              className={`w-8 h-8 rounded-full flex items-center justify-center ${
                step === stepNumber 
                  ? 'bg-blue-600 text-white' 
                  : step > stepNumber 
                    ? 'bg-green-500 text-white' 
                    : 'bg-gray-200 text-gray-600'
              }`}
            >
              {step > stepNumber ? '✓' : stepNumber}
            </div>
          ))}
        </div>
        <div className="relative">
          <div className="absolute top-0 left-0 h-1 bg-gray-200 w-full"></div>
          <div 
            className="absolute top-0 left-0 h-1 bg-blue-600 transition-all duration-300"
            style={{ width: `${(step - 1) * 33.33}%` }}
          ></div>
        </div>
        <div className="flex items-center justify-between mt-2 text-sm text-gray-600">
          <div className={step >= 1 ? 'text-blue-600 font-medium' : ''}>Import Data</div>
          <div className={step >= 2 ? 'text-blue-600 font-medium' : ''}>Paste Statements</div>
          <div className={step >= 3 ? 'text-blue-600 font-medium' : ''}>Categorize</div>
          <div className={step >= 4 ? 'text-blue-600 font-medium' : ''}>Export</div>
        </div>
      </div>
      
      {renderStep()}
      
      <div className="mt-8 text-sm text-gray-500 text-center">
        <p>This tool is designed to help you verify and complete your 2024 transactions for tax preparation.</p>
      </div>
    </div>
  );
}
