import { useState } from 'react';
import Papa from 'papaparse';

export default function SimpleStatementAnalyzer() {
  const [statements, setStatements] = useState([]);
  const [statementText, setStatementText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState('December 2024');
  
  // Process pasted credit card statement
  const processStatement = () => {
    setIsProcessing(true);
    
    // Split the text into lines
    const lines = statementText.split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);
    
    // Simple extraction - looking for patterns in each line
    const transactions = lines.map(line => {
      // Try to find date (MM/DD/YYYY or similar)
      const dateMatch = line.match(/(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4})/);
      
      // Try to find amount ($123.45 or similar)
      const amountMatch = line.match(/\$([\d,]+\.\d{2})/);
      
      // Description is everything else
      let description = line;
      if (dateMatch) description = description.replace(dateMatch[0], '');
      if (amountMatch) description = description.replace(amountMatch[0], '');
      
      return {
        date: dateMatch ? dateMatch[1] : '',
        amount: amountMatch ? amountMatch[1] : '',
        description: description.trim()
      };
    }).filter(tx => tx.date && tx.amount);
    
    setStatements(transactions);
    setIsProcessing(false);
  };
  
  // Export transactions as CSV
  const exportTransactions = () => {
    if (!statements.length) return;
    
    // Format for CSV export
    const csvData = statements.map(tx => ({
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
    link.setAttribute('download', `statement_transactions_${selectedMonth.replace(' ', '_')}.csv`);
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
      
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-3">Paste Credit Card Statement</h2>
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
                {statements.map((tx, index) => (
                  <tr key={index} className="border-b">
                    <td className="py-2 px-3">{tx.date}</td>
                    <td className="py-2 px-3">{tx.description}</td>
                    <td className="py-2 px-3">${tx.amount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <button
            onClick={exportTransactions}
            className="mt-4 px-4 py-2 bg-green-600 text-white rounded-md"
          >
            Export Transactions (CSV)
          </button>
        </div>
      )}
      
      <div className="mt-8 p-4 bg-blue-50 rounded-md">
        <h2 className="text-lg font-semibold mb-2">How to Use This Tool</h2>
        <ol className="list-decimal ml-5 space-y-2">
          <li>Copy and paste your credit card statement text</li>
          <li>Click "Process Statement" to extract transactions</li>
          <li>Review the extracted transactions for accuracy</li>
          <li>Export transactions as CSV for easy import into your budget</li>
        </ol>
      </div>
    </div>
  );
}