"use client";

import { useState, useEffect } from "react";
import { generateSQLQuery, executeSQLQuery } from "@/app/actions/sql";

export default function SQLQueryGenerator() {
  const [userInput, setUserInput] = useState("");
  const [sqlQuery, setSqlQuery] = useState("");
  const [queryResults, setQueryResults] = useState<any[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userInput.trim()) return;
    
    setIsLoading(true);
    setError(null);
    setSqlQuery("");
    setQueryResults(null);

    try {
      // Generate SQL query using AI
      const generateResponse = await generateSQLQuery(userInput);
      
      if (!generateResponse.success) {
        throw new Error(generateResponse.error || "Failed to generate SQL query");
      }

      setSqlQuery(generateResponse.query || "");

      // Execute the generated SQL query
      const executeResponse = await executeSQLQuery(generateResponse.query || "");
      
      if (!executeResponse.success) {
        throw new Error(executeResponse.error || "Failed to execute SQL query");
      }

      setQueryResults(executeResponse.results || []);
    } catch (err: any) {
      setError(err.message || "An error occurred");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // Add keyboard shortcut (Ctrl+Enter or Cmd+Enter) to submit
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        const form = document.getElementById('sqlQueryForm') as HTMLFormElement;
        if (form && !isLoading && userInput.trim()) form.requestSubmit();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isLoading, userInput]);

  return (
    <div className="space-y-6">
      <form id="sqlQueryForm" onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="userInput" className="block text-sm font-medium text-gray-700 mb-2">
            Describe what data you want to query
          </label>
          <textarea
            id="userInput"
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="e.g., Show me all posts by Demo User ordered by date"
            rows={3}
            required
          />
          <p className="mt-1 text-xs text-gray-500">
            Pro tip: Use Ctrl+Enter (or Cmd+Enter on Mac) to submit quickly
          </p>
        </div>
        
        <div className="flex justify-center">
          <button
            type="submit"
            disabled={isLoading || !userInput.trim()}
            className="w-full md:w-2/3 lg:w-1/2 px-6 py-3 text-base font-semibold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-300 disabled:cursor-not-allowed transition-colors duration-200 ease-in-out shadow-md rounded-md"
          >
            {isLoading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Generating...
              </span>
            ) : (
              "Generate SQL Query"
            )}
          </button>
        </div>
      </form>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-md">
          <h3 className="text-lg font-semibold text-red-700">Error</h3>
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {sqlQuery && (
        <div className="p-4 bg-gray-50 border border-gray-200 rounded-md">
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Generated SQL Query</h3>
          <pre className="bg-gray-100 p-3 rounded-md overflow-x-auto text-sm">{sqlQuery}</pre>
        </div>
      )}

      {queryResults && (
        <div className="p-4 bg-white border border-gray-200 rounded-md">
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Query Results</h3>
          {queryResults.length === 0 ? (
            <p className="text-gray-500">No results found</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {Object.keys(queryResults[0]).map((key) => (
                      <th
                        key={key}
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        {key}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {queryResults.map((result, index) => (
                    <tr key={index}>
                      {Object.values(result).map((value: any, valueIndex) => (
                        <td
                          key={valueIndex}
                          className="px-6 py-4 whitespace-nowrap text-sm text-gray-500"
                        >
                          {typeof value === 'object' 
                            ? JSON.stringify(value)
                            : String(value)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
} 