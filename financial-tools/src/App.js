import React from "react";
import "./App.css";
import CustomStatementAnalyzer from "./CustomStatementAnalyzer";

function App() {
  return (
    <div className="App">
      <header className="p-4 bg-blue-600 text-white">
        <h1 className="text-2xl font-bold">2024 Financial Reconciliation Tools</h1>
      </header>

      <div className="max-w-5xl mx-auto">
        <CustomStatementAnalyzer />
      </div>
    </div>
  );
}

export default App;