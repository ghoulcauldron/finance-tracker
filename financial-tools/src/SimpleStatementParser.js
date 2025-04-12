import { useState } from 'react';

export default function SimpleStatementParser() {
  const [inputText, setInputText] = useState('');
  const [parseResults, setParseResults] = useState(null);
  const [debugInfo, setDebugInfo] = useState([]);
  
  const parseStatement = () => {
    // Clear previous results
    setParseResults(null);
    setDebugInfo([]);
    
    // Log the input
    addDebugInfo('Starting parse with input length: ' + inputText.length);
    
    // Split into lines
    const lines = inputText.split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);
    
    addDebugInfo(`Found ${lines.length} non-empty lines`);
    if (lines.length > 0) {
      addDebugInfo('First 5 lines:', lines.slice(0, Math.min(5, lines.length)));
    }
    
    // Try to find date patterns
    const datePatterns = [
      { regex: /\*\*(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s(\d{1,2})\*\*/, name: 'Bold Month DD' },
      { regex: /(\d{1,2}\/\d{1,2}\/\d{4})/, name: 'MM/DD/YYYY' },
      { regex: /(\d{1,2}\/\d{1,2})/, name: 'MM/DD' }
    ];
    
    // Try to find amount patterns
    const amountPatterns = [
      { regex: /\*\*\$([\d,]+\.\d{2})\*\*/, name: 'Bold $Amount' },
      { regex: /\$([\d,]+\.\d{2})/, name: '$Amount' },
      { regex: /([\d,]+\.\d{2})/, name: 'Plain Amount' }
    ];
    
    // Check for matches in each line
    const matchResults = {
      dateMatches: [],
      amountMatches: []
    };
    
    lines.forEach((line, index) => {
      // Check for date patterns
      for (const pattern of datePatterns) {
        const match = line.match(pattern.regex);
        if (match) {
          matchResults.dateMatches.push({
            lineNumber: index + 1,
            line,
            pattern: pattern.name,
            match: match[0]
          });
          break;
        }
      }
      
      // Check for amount patterns
      for (const pattern of amountPatterns) {
        const match = line.match(pattern.regex);
        if (match) {
          matchResults.amountMatches.push({
            lineNumber: index + 1,
            line,
            pattern: pattern.name,
            match: match[0],
            value: match[1]
          });
          break;
        }
      }
    });
    
    addDebugInfo(`Found ${matchResults.dateMatches.length} date matches and ${matchResults.amountMatches.length} amount matches`);
    
    // Set the results
    setParseResults(matchResults);
  };
  
  const addDebugInfo = (message, data = null) => {
    setDebugInfo(prev => [
      ...prev, 
      { 
        message, 
        data: data ? (Array.isArray(data) ? data : [data]) : null 
      }
    ]);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Simple Statement Parser</h1>
      
      <div className="mb-6">
        <label className="block text-sm font-medium mb-2">
          Paste Statement Text
        </label>
        <textarea
          className="w-full h-48 p-2 border rounded-md font-mono text-sm"
          placeholder="Paste your statement text here, including any formatting (e.g., **bold text**)"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
        ></textarea>
      </div>
      
      <div className="mb-6">
        <button
          onClick={parseStatement}
          className="px-4 py-2 bg-blue-600 text-white rounded-md"
          disabled={!inputText}
        >
          Parse Statement
        </button>
      </div>
      
      {debugInfo.length > 0 && (
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-2">Debug Information</h2>
          <div className="bg-gray-100 p-4 rounded-md overflow-auto max-h-60">
            {debugInfo.map((item, index) => (
              <div key={index} className="mb-2">
                <div className="font-medium">{item.message}</div>
                {item.data && (
                  <pre className="ml-4 text-xs bg-gray-200 p-2 rounded mt-1 overflow-x-auto">
                    {item.data.map((line, i) => (
                      <div key={i}>{JSON.stringify(line)}</div>
                    ))}
                  </pre>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
      
      {parseResults && (
        <div>
          <h2 className="text-lg font-semibold mb-2">Parsing Results</h2>
          
          <div className="mb-6">
            <h3 className="font-medium mb-2">Date Matches ({parseResults.dateMatches.length})</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white border">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="py-2 px-3 text-left border-b">Line #</th>
                    <th className="py-2 px-3 text-left border-b">Pattern</th>
                    <th className="py-2 px-3 text-left border-b">Matched Text</th>
                    <th className="py-2 px-3 text-left border-b">Full Line</th>
                  </tr>
                </thead>
                <tbody>
                  {parseResults.dateMatches.map((match, index) => (
                    <tr key={index} className="border-b">
                      <td className="py-2 px-3">{match.lineNumber}</td>
                      <td className="py-2 px-3">{match.pattern}</td>
                      <td className="py-2 px-3 font-mono text-sm">{match.match}</td>
                      <td className="py-2 px-3 font-mono text-sm">{match.line}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          
          <div>
            <h3 className="font-medium mb-2">Amount Matches ({parseResults.amountMatches.length})</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white border">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="py-2 px-3 text-left border-b">Line #</th>
                    <th className="py-2 px-3 text-left border-b">Pattern</th>
                    <th className="py-2 px-3 text-left border-b">Matched Text</th>
                    <th className="py-2 px-3 text-left border-b">Value</th>
                    <th className="py-2 px-3 text-left border-b">Full Line</th>
                  </tr>
                </thead>
                <tbody>
                  {parseResults.amountMatches.map((match, index) => (
                    <tr key={index} className="border-b">
                      <td className="py-2 px-3">{match.lineNumber}</td>
                      <td className="py-2 px-3">{match.pattern}</td>
                      <td className="py-2 px-3 font-mono text-sm">{match.match}</td>
                      <td className="py-2 px-3 font-mono text-sm">{match.value}</td>
                      <td className="py-2 px-3 font-mono text-sm">{match.line}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          
          <div className="mt-6 p-4 bg-yellow-50 rounded-md">
            <h3 className="font-medium mb-2">Next Steps:</h3>
            <p>
              Based on the patterns detected above, we can create a custom parser for your
              specific statement format. If you see date and amount patterns being detected,
              but our parser isn't extracting transactions correctly, we'll need to adjust
              the algorithm for connecting dates with amounts and descriptions.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}