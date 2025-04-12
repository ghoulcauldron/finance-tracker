import { useState } from 'react';
import Papa from 'papaparse';

export default function CustomStatementAnalyzer() {
  const [statements, setStatements] = useState([]);
  const [existingTransactions, setExistingTransactions] = useState([]);
  const [matchResults, setMatchResults] = useState(null);
  const [statementText, setStatementText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState('November 2024');
  const [selectedCard, setSelectedCard] = useState('');
  const [debugOutput, setDebugOutput] = useState([]);
  const [debugMode, setDebugMode] = useState(false);
  const [transactionOwner, setTransactionOwner] = useState('Shaeffer');
  // Store the column headers from the uploaded CSV
  const [csvHeaders, setCsvHeaders] = useState([]);
  
  // Clear debug logs
  const clearDebugLogs = () => {
    setDebugOutput([]);
  };
  
  // Debug logging function
  const debugLog = (message, data = null) => {
    if (debugMode) {
      const logItem = {
        timestamp: new Date().toLocaleTimeString(),
        message,
        data
      };
      setDebugOutput(prev => [...prev, logItem]);
      console.log(message, data);
    }
  };
  
  // Credit card options based on your actual data
  const creditCardOptions = [
    { value: 'amex-blue', label: 'Amex Blue' },
    { value: 'amex-gold', label: 'Amex Gold' },
    { value: 'amex-delta', label: 'Amex Delta' },
    { value: 'chase-amazon', label: 'Chase Amazon Prime' },
    { value: 'citi-premier', label: 'Citi Premier' },
    { value: 'discover', label: 'Discover' },
    { value: 'capital-one', label: 'Capital One' },
    { value: 'other', label: 'Other Credit Card' }
  ];
  
  // Common merchants/payees from your data
  const commonPayees = [
    'AMAZON', 'WHOLE FOODS', 'NETFLIX', 'NYCT PAYGO', 'APLPAY',
    'OUR DAILY BREAD', 'HP INSTANT INK', 'HULU', 'PATREON',
    'OPTIMUM', 'BIRCH COFFEE', 'SPOTIFY', 'GOOGLE', 'YOUTUBE'
  ];
  
  // Process pasted credit card statement
  const processStatement = () => {
    debugLog("processStatement function called");
    clearDebugLogs();
    setIsProcessing(true);
    
    // Split the text into lines
    const lines = statementText.split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);
    
    debugLog(`Lines to process: ${lines.length}`);
    
    if (lines.length > 0) {
      debugLog("Sample lines:", lines.slice(0, Math.min(5, lines.length)));
    }
    
    // Define the transaction patterns based on your actual format
    // Month name followed by a day (e.g., "Nov 28")
    const datePattern = /^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(\d{1,2})$/;
    // Dollar amount (e.g., "$8.00")
    const amountPattern = /^\$(\d+\.\d{2})$/;
    // Negative dollar amount (e.g., "-$30.99")
    const negativeAmountPattern = /^-\$(\d+\.\d{2})$/;
    
    // Extract transactions by grouping lines
    const transactions = [];
    
    // Skip the header lines
    let i = 0;
    while (i < lines.length && 
           (lines[i] === "Date sorted descending" || 
            lines[i] === "Description" || 
            lines[i] === "Amount")) {
      i++;
    }
    
    // Process the remaining lines
    while (i < lines.length) {
      // Look for a date line
      if (lines[i].match(datePattern)) {
        const date = lines[i];
        i++;
        
        // Find the description (should be the next line)
        let description = '';
        if (i < lines.length && !lines[i].match(datePattern) && 
            !lines[i].match(amountPattern) && !lines[i].match(negativeAmountPattern)) {
          description = lines[i];
          i++;
          
          // Special case: handle additional description lines
          if (i < lines.length && lines[i] === 'Credit') {
            i++;
            if (i < lines.length && !lines[i].match(datePattern) && 
                !lines[i].match(amountPattern) && !lines[i].match(negativeAmountPattern)) {
              description += ' - ' + lines[i];
              i++;
            }
          }
        }
        
        // Find the amount (should be the next line)
        let amount = '';
        let isNegative = false;
        if (i < lines.length) {
          const amountMatch = lines[i].match(amountPattern);
          const negativeAmountMatch = lines[i].match(negativeAmountPattern);
          
          if (amountMatch) {
            amount = amountMatch[1];
            i++;
          } else if (negativeAmountMatch) {
            amount = negativeAmountMatch[1];
            isNegative = true;
            i++;
          }
        }
        
        // Add the transaction if we have all parts
        if (date && description && amount) {
          transactions.push({
            date,
            description,
            amount: isNegative ? '-' + amount : amount,
            owner: transactionOwner // Add owner from the dropdown
          });
          debugLog("Extracted transaction:", { 
            date, 
            description, 
            amount: isNegative ? '-' + amount : amount,
            owner: transactionOwner
          });
        } else {
          debugLog("Incomplete transaction:", { date, description, amount });
        }
      } else {
        // Skip any unrecognized lines
        i++;
      }
    }
    
    debugLog(`Found ${transactions.length} transactions`);
    
    // Clean up descriptions
    const cleanedTransactions = transactions.map(tx => {
      let description = tx.description || '';
      
      // Check for common payees to standardize descriptions
      const matchedPayee = commonPayees.find(payee => 
        description.toUpperCase().includes(payee.toUpperCase())
      );
      
      // If a common payee is found, highlight it
      if (matchedPayee) {
        description = description.replace(
          new RegExp(matchedPayee, 'i'), 
          match => `[${match}]`
        );
      }
      
      return {
        ...tx,
        description,
        // Flag for potential duplicates (same date and amount)
        potentialDuplicate: false
      };
    });
    
    // Check for potential duplicates (same date and amount)
    for (let i = 0; i < cleanedTransactions.length; i++) {
      for (let j = i + 1; j < cleanedTransactions.length; j++) {
        if (cleanedTransactions[i].date === cleanedTransactions[j].date && 
            Math.abs(parseFloat(cleanedTransactions[i].amount) - parseFloat(cleanedTransactions[j].amount)) < 0.01) {
          cleanedTransactions[i].potentialDuplicate = true;
          cleanedTransactions[j].potentialDuplicate = true;
        }
      }
    }
    
    debugLog(`Final processed transactions: ${cleanedTransactions.length}`);
    setStatements(cleanedTransactions);
    setIsProcessing(false);
  };
  
  // Handle file upload for existing transactions
  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    Papa.parse(file, {
      header: true,
      complete: (results) => {
        // Store the original headers from the CSV
        setCsvHeaders(results.meta.fields || []);
        
        // Transform data to match your format
        const transformedData = results.data.map(row => {
          // Look for date and description in primary columns
          let date = row['Date'] || row['Date_1'] || row['Date_2'] || '';
          let description = row['Description'] || row['Description_1'] || row['Description_2'] || '';
          let amount = row['Amount (00.00)'] || row['Amount (00.00)_1'] || row['Amount (00.00)_2'] || '';
          
          return {
            date,
            description,
            amount,
            category: row['Expense Category (Choose 1)'] || row['Joint Expense Category'] || row['Income Category (Choose 1)'] || '',
            originalRow: row // Store the original row data for CSV export
          };
        }).filter(item => item.date && item.amount); // Remove empty entries
        
        setExistingTransactions(transformedData);
        debugLog("Loaded CSV with headers:", results.meta.fields);
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
        // Handle "Mon DD" format (e.g., "Nov 30")
        if (/^[A-Za-z]{3}\s\d{1,2}$/.test(dateStr)) {
          const parts = dateStr.split(' ');
          const month = parts[0];
          const day = parseInt(parts[1], 10);
          const year = new Date().getFullYear(); // Assume current year
          
          // Convert month name to month number
          const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", 
                             "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
          const monthIndex = monthNames.findIndex(m => 
            m.toLowerCase() === month.toLowerCase());
          
          if (monthIndex !== -1) {
            return `${year}-${(monthIndex + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
          }
        }
        
        // Handle MM/DD/YYYY format
        const parts = dateStr.split('/');
        if (parts.length === 3) {
          const month = parseInt(parts[0], 10);
          const day = parseInt(parts[1], 10);
          const year = parseInt(parts[2], 10);
          return `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
        }
        
        // Fallback to standard Date parsing
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
        // Get transaction date
        const txDate = normalizeDate(transaction.date || '');
        
        // Get transaction amount
        const txAmount = parseFloat(transaction.amount || 0);
        
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
  
  // Export unmatched transactions as CSV in the same format as the original
  const exportUnmatched = () => {
    if (!matchResults || !matchResults.unmatched.length) return;
    
    // Create CSV data in the same format as the original file
    let csvData = [];
    
    if (csvHeaders.length > 0) {
      // We have headers from the original file, so use that format
      csvData = matchResults.unmatched.map(tx => {
        // Start with an object with all the original headers
        const row = {};
        csvHeaders.forEach(header => {
          row[header] = ''; // Initialize all fields to empty
        });
        
        // Determine which fields to populate based on owner
        const isShaeffer = tx.owner === 'Shaeffer';
        
        // Common fields
        row['Timestamp'] = new Date().toLocaleString();
        row['Income or Expense'] = 'Expense';
        
        if (row.hasOwnProperty('Expense Type')) {
          row['Expense Type'] = 'Individual';
        }
        
        // Set owner-specific fields
        if (isShaeffer) {
          // Shaeffer's columns
          if (row.hasOwnProperty('Shaeffer or Gil_1')) {
            row['Shaeffer or Gil_1'] = 'Shaeffer';
          }
          if (row.hasOwnProperty('Date_1')) {
            row['Date_1'] = tx.date;
          }
          if (row.hasOwnProperty('Amount (00.00)_1')) {
            row['Amount (00.00)_1'] = tx.amount;
          }
          if (row.hasOwnProperty('Description_1')) {
            row['Description_1'] = tx.description.replace(/\[|\]/g, '');
          }
        } else {
          // Gil's columns
          if (row.hasOwnProperty('Shaeffer or Gil_2')) {
            row['Shaeffer or Gil_2'] = 'Gil';
          }
          if (row.hasOwnProperty('Date_2')) {
            row['Date_2'] = tx.date;
          }
          if (row.hasOwnProperty('Amount (00.00)_2')) {
            row['Amount (00.00)_2'] = tx.amount;
          }
          if (row.hasOwnProperty('Description_2')) {
            row['Description_2'] = tx.description.replace(/\[|\]/g, '');
          }
        }
        
        return row;
      });
    } else {
      // Fallback format if we don't have the original headers
      csvData = matchResults.unmatched.map(tx => {
        // Clean up the description - remove brackets from payee highlighting
        const cleanDescription = tx.description.replace(/\[|\]/g, '');
        
        return {
          "Timestamp": new Date().toLocaleString(),
          "Income or Expense": "Expense",
          "Expense Type": "Individual",
          [`Shaeffer or Gil_${tx.owner === 'Shaeffer' ? '1' : '2'}`]: tx.owner,
          [`Date_${tx.owner === 'Shaeffer' ? '1' : '2'}`]: tx.date,
          [`Amount (00.00)_${tx.owner === 'Shaeffer' ? '1' : '2'}`]: tx.amount,
          [`Description_${tx.owner === 'Shaeffer' ? '1' : '2'}`]: cleanDescription,
          "Expense Category (Choose 1)": ""
        };
      });
    }
    
    // Convert to CSV
    const csv = Papa.unparse(csvData);
    
    // Create download link
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `transactions_${selectedMonth.replace(' ', '_')}_${selectedCard}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Credit Card Statement Analyzer</h1>
      
      <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Month
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
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Credit Card
          </label>
          <select
            value={selectedCard}
            onChange={(e) => setSelectedCard(e.target.value)}
            className="w-full p-2 border rounded-md"
          >
            <option value="">Select a card</option>
            {creditCardOptions.map(card => (
              <option key={card.value} value={card.value}>{card.label}</option>
            ))}
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Transaction Owner
          </label>
          <select
            value={transactionOwner}
            onChange={(e) => setTransactionOwner(e.target.value)}
            className="w-full p-2 border rounded-md"
          >
            <option value="Shaeffer">Shaeffer</option>
            <option value="Gil">Gil</option>
          </select>
        </div>
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
          <div className="mt-2">
            <button
              onClick={processStatement}
              disabled={isProcessing || !statementText || !selectedCard}
              className="px-4 py-2 bg-blue-600 text-white rounded-md disabled:bg-blue-300"
            >
              {isProcessing ? 'Processing...' : 'Process Statement'}
            </button>
            
            <label className="inline-flex items-center ml-4">
              <input
                type="checkbox"
                checked={debugMode}
                onChange={(e) => setDebugMode(e.target.checked)}
                className="rounded text-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">Debug Mode</span>
            </label>
            
            {/* Debug info */}
            <div className="mt-2 text-xs text-gray-500">
              Button State: {(isProcessing || !statementText || !selectedCard) ? 'Disabled' : 'Enabled'}
              <br />
              {!selectedCard && <span className="text-red-500">Please select a card</span>}
              {!statementText && <span className="text-red-500">{!selectedCard ? ' and ' : 'Please '}enter statement text</span>}
            </div>
          </div>
        </div>
      </div>
      
      {/* Debug output */}
      {debugMode && debugOutput.length > 0 && (
        <div className="mb-6 bg-gray-100 p-4 rounded-md overflow-auto max-h-64">
          <h3 className="text-sm font-semibold mb-2">Debug Output</h3>
          {debugOutput.map((log, index) => (
            <div key={index} className="text-xs font-mono mb-1">
              <span className="text-gray-500">[{log.timestamp}]</span> {log.message}
              {log.data && (
                <pre className="ml-6 text-xs bg-gray-200 p-1 rounded">
                  {typeof log.data === 'string' ? log.data : JSON.stringify(log.data, null, 2)}
                </pre>
              )}
            </div>
          ))}
        </div>
      )}
      
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
                  <th className="py-2 px-3 text-left border-b">Owner</th>
                  <th className="py-2 px-3 text-left border-b">Status</th>
                </tr>
              </thead>
              <tbody>
                {statements.map((tx, index) => (
                  <tr key={index} className={tx.potentialDuplicate ? "border-b bg-yellow-50" : "border-b"}>
                    <td className="py-2 px-3">{tx.date || ''}</td>
                    <td className="py-2 px-3" dangerouslySetInnerHTML={{ __html: tx.description.replace(/\[([^\]]+)\]/g, '<span class="font-semibold text-blue-600">$1</span>') || '' }}></td>
                    <td className="py-2 px-3">${parseFloat(tx.amount || 0).toFixed(2)}</td>
                    <td className="py-2 px-3">{tx.owner}</td>
                    <td className="py-2 px-3">
                      {tx.potentialDuplicate && (
                        <span className="text-yellow-600 text-sm">Possible duplicate</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
                      <th className="py-2 px-3 text-left border-b">Owner</th>
                    </tr>
                  </thead>
                  <tbody>
                    {matchResults.unmatched.map((tx, index) => (
                      <tr key={index} className="border-b">
                        <td className="py-2 px-3">{tx.date || ''}</td>
                        <td className="py-2 px-3" dangerouslySetInnerHTML={{ __html: tx.description.replace(/\[([^\]]+)\]/g, '<span class="font-semibold text-blue-600">$1</span>') || '' }}></td>
                        <td className="py-2 px-3">${parseFloat(tx.amount || 0).toFixed(2)}</td>
                        <td className="py-2 px-3">{tx.owner}</td>
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
          <li>Select the month, credit card, and transaction owner</li>
          <li>Export your existing transactions as CSV from your budget spreadsheet</li>
          <li>Upload that CSV file using the import button</li>
          <li>Copy and paste your credit card statement text</li>
          <li>Click "Process Statement" to extract transactions</li>
          <li>Review the extracted transactions - common merchants are highlighted</li>
          <li>Click "Compare with Existing Transactions" to find missing entries</li>
          <li>Export missing transactions in a format ready for your budget tracker</li>
        </ol>
      </div>
    </div>
  );
}