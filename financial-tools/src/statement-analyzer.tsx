import { useState } from 'react';
import Papa from 'papaparse';

export default function StatementAnalyzer() {
  const [statements, setStatements] = useState([]);
  const [existingTransactions, setExistingTransactions] = useState([]);
  const [matchResults, setMatchResults] = useState(null);
  const [statementText, setStatementText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState('December 2024');
  
  // Common credit card statement patterns
  const datePatterns = [
    /(\d{1,2}\/\d{1,2}\/\d{2,4})/,  // MM/DD/YYYY or MM/DD/YY
    /(\d{1,2}-\d{1,2}-\d{2,4})/,    // MM-DD-YYYY or MM-DD-YY
    /(\w{3}\s\d{1,2},?\s\d{4})/     // MMM DD, YYYY or MMM DD YYYY
  ];
  
  const amountPatterns = [
    /\$([\d,]+\.\d{2})/,             // $1,234.56
    /([\d,]+\.\d{2})/,               // 1,234.56
    /\$?([\d,]+\.\d{2})-/,           // $1,234.56- (negative)
    /-([\d,]+\.\d{2})/              // -1,234.56 (negative)
  ];
  
  // Process pasted credit card statement
  const processStatement = () => {
    setIsProcessing(true);
    
    // Split the text into lines
    const lines = statementText.split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);
    
    // Extract transactions
    const extractedTransactions = [];
    let currentTransaction = {};
    
    lines.forEach(line => {
      // Try to find date
      const dateMatch = datePatterns.some(pattern => {
        const match = line.match(pattern);
        if (match) {
          if (Object.keys(currentTransaction).length > 0) {
            extractedTransactions.push({...currentTransaction});
            currentTransaction = {};
          }
          currentTransaction.date = match[1];
          return true;
        }
        return false;
      });
      
      // Try to find amount
      const amountMatch = amountPatterns.some(pattern => {
        const match = line.match(pattern);
        if (match) {
          currentTransaction.amount = match[1].replace(/,/g, '');
          return true;
        }
        return false;
      });
      
      // If line has no date or amount, assume it's a description
      if (!dateMatch && !amountMatch && currentTransaction.date) {
        currentTransaction.description = currentTransaction.description 
          ? `${currentTransaction.description} ${line}` 
          : line;
      }
      
      // If we have a date and amount, save it
      if (currentTransaction.date && currentTransaction.amount && currentTransaction.description) {
        extractedTransactions.push({...currentTransaction});
        currentTransaction = {};
      }
    });
    
    // Add any remaining transaction
    if (Object.keys(currentTransaction).length > 0) {
      extractedTransactions.push(currentTransaction);
    }
    
    setStatements(extractedTransactions);
    setIsProcessing(false);
  };
  
  // Handle file upload for existing transactions
  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    Papa.parse(file, {
      header: true,
      complete: (results) => {
        setExistingTransactions(results.data);
      },
      error: (error) => {
        console.error('Error parsing CSV:', error);
        alert('Error parsing the CSV file. Please check the format.');
      }
    });
  };
  
  // Match statements against existing transactions
  const findMatches = () => {
    const results = {
      matched: [],
      unmatched: [],
      summary: { total: 0, matched: 0, unmatched: 0 }
    };
    
    // Function to normalize dates for comparison
    const normalizeDate = (dateStr) => {
      try {
        const date = new Date(dateStr);
        return date.toISOString().split('T')[0]; // YYYY-MM-DD
      } catch (e) {
        return dateStr;
      }
    };
    
    // Match each statement against existing transactions
    statements.forEach(statement => {
      const statementDate = normalizeDate(statement.date);
      const statementAmount = parseFloat(statement.amount || 0);
      
      // Look for matching transactions
      const matchingTransaction = existingTransactions.find(transaction => {
        // Get transaction date (could be in different fields)
        const txDate = normalizeDate(
          transaction.date || transaction.Date || transaction.Timestamp || ''
        );
        
        // Get transaction amount (could be in different fields)
        const txAmount = parseFloat(
          transaction.amount || transaction.Amount || 0
        );
        
        // Calculate date difference in days
        const date1 = new Date(statementDate);
        const date2 = new Date(txDate);
        const diffTime = Math.abs(date2 - date1);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        // Match if date is within 2 days and amount is the same
        return diffDays <= 2 && Math.abs(txAmount - statementAmount) < 0.01;
      });
      
      if (matchingTransaction) {
        results.matched.push({
          statement,
          matchingTransaction
        });
      } else {
        results.unmatched.push(statement);
      }
    });
    
    // Update summary
    results.summary.total = statements.length;
    results.summary.matched = results.matched.length;
    results.summary.unmatched = results.unmatched.length;
    
    setMatchResults(results);
  };
  
  // Export unmatched transactions as CSV
  const exportUnmatched = () => {
    if (!matchResults || !matchResults.unmatched.length) return;
    
    // Format for CSV export
    const csvData = matchResults.unmatched.map(tx => ({
      Date: tx.date,
      Description: tx.description,
      Amount: tx.amount,
      Month: selectedMonth,
      Category: '',
      Notes: 'Added during reconciliation'
    }));
    
    // Convert to CSV
    const csv = Papa.unparse(csvData);
    
    // Create download link
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `unmatched_transactions_${selectedMonth.replace(' ', '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Credit Card Statement Analyzer</h1>
      
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select Month for Analysis
        </label>
        <select
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
          className="w-full p-2 border rounded-md"
        >
          <option value="November 2024">November 2024</option>
          <option value="December 2024">December 2024</option>
        </select>
      </div>
      
      <div className="grid grid-cols-1 gap-6 mb-6 md:grid-cols-2">
        <div>
          <h2 className="text-lg font-semibold mb-3">Step 1: Import Existing Transactions</h2>
          <p className="mb-4 text-sm text-gray-600">
            Upload your CSV of existing transactions to compare against
          </p>
          <input
            type="file"
            accept=".csv"
            onChange={handleFileUpload}
            className="block w-full text-sm text-gray-500
              file:mr-4 file:py-2 file:px-4
              file:rounded-md file:border-0
              file:text-sm file:font-semibold
              file:bg-blue-50 file:text-blue-700
              hover:file:bg-blue-100"
          />
          {existingTransactions.length > 0 && (
            <p className="mt-2 text-sm text-green-600">
              Loaded {existingTransactions.length} transactions
            </p>
          )}
        </div>
        
        <div>
          <h2 className="text-lg font-semibold mb-3">Step 2: Paste Credit Card Statement</h2>
          <p className="mb-2 text-sm text-gray-600">
            Copy and paste your credit card statement text below
          </p>
          <textarea
            className="w-full h-40 p-2 border rounded-md"
            placeholder="Paste your credit card statement here..."
            value={statementText}
            onChange={(e) => setStatementText(e.target.value)}
          ></textarea>
          <button
            onClick={processStatement}
            disabled={isProcessing || !statementText}
            className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-md disabled:bg-blue-300"
          >
            {isProcessing ? 'Processing...' : 'Process Statement'}
          </button>
        </div>
      </div>
      
      {statements.length > 0 && (
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-3">
            Extracted Transactions ({statements.length})
          </h2>
          <div className="overflow-x-auto">
            <table className="min-w-full border">
              <thead>
                <tr className="bg-gray-100">
                  <th className="py-2 px-3 text-left border-b">Date</th>
                  <th className="py-2 px-3 text-left border-b">Description</th>
                  <th className="py-2 px-3 text-left border-b">Amount</th>
                </tr>
              </thead>
              <tbody>
                {statements.slice(0, 10).map((tx, index) => (
                  <tr key={index} className="border-b">
                    <td className="py-2 px-3">{tx.date || ''}</td>
                    <td className="py-2 px-3">{tx.description || ''}</td>
                    <td className="py-2 px-3">${parseFloat(tx.amount || 0).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {statements.length > 10 && (
              <p className="mt-2 text-sm text-gray-600">
                Showing 10 of {statements.length} transactions
              </p>
            )}
          </div>
          
          <div className="mt-4">
            <button
              onClick={findMatches}
              disabled={!existingTransactions.length}
              className="px-4 py-2 bg-green-600 text-white rounded-md disabled:bg-green-300"
            >
              Compare with Existing Transactions
            </button>
          </div>
        </div>
      )}
      
      {matchResults && (
        <div className="mt-8">
          <div className="bg-gray-50 p-4 rounded-lg mb-6">
            <h2 className="text-lg font-semibold mb-2">Match Results</h2>
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-white p-3 rounded shadow">
                <div className="text-2xl font-bold">{matchResults.summary.total}</div>
                <div className="text-gray-600">Total Transactions</div>
              </div>
              <div className="bg-white p-3 rounded shadow">
                <div className="text-2xl font-bold text-green-600">{matchResults.summary.matched}</div>
                <div className="text-gray-600">Matched</div>
              </div>
              <div className="bg-white p-3 rounded shadow">
                <div className="text-2xl font-bold text-red-600">{matchResults.summary.unmatched}</div>
                <div className="text-gray-600">Unmatched</div>
              </div>
            </div>
          </div>
          
          {matchResults.unmatched.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3 text-red-600">Missing Transactions</h3>
              <p className="mb-4 text-sm">
                These transactions from your statement were not found in your existing records.
                These may need to be added to your budget tracker.
              </p>
              
              <div className="overflow-x-auto">
                <table className="min-w-full border">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="py-2 px-3 text-left border-b">Date</th>
                      <th className="py-2 px-3 text-left border-b">Description</th>
                      <th className="py-2 px-3 text-left border-b">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {matchResults.unmatched.map((tx, index) => (
                      <tr key={index} className="border-b">
                        <td className="py-2 px-3">{tx.date || ''}</td>
                        <td className="py-2 px-3">{tx.description || ''}</td>
                        <td className="py-2 px-3">${parseFloat(tx.amount || 0).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              <button
                onClick={exportUnmatched}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md"
              >
                Export Missing Transactions (CSV)
              </button>
            </div>
          )}
        </div>
      )}
      
      <div className="mt-8 p-4 bg-blue-50 rounded-md">
        <h2 className="text-lg font-semibold mb-2">How to Use This Tool</h2>
        <ol className="list-decimal ml-5 space-y-2">
          <li>Export your existing transactions as CSV from your budget spreadsheet</li>
          <li>Upload that CSV file using the import button</li>
          <li>Copy and paste your credit card statement text (try to include dates and amounts)</li>
          <li>Click "Process Statement" to extract transactions</li>
          <li>Review the extracted transactions for accuracy</li>
          <li>Click "Compare with Existing Transactions" to find missing entries</li>
          <li>Export missing transactions as CSV for easy import into your budget</li>
        </ol>
      </div>
    </div>
  );
}