"use client";

import { generateSQLFromPrompt, type SQLResponse } from "@/app/actions/sql";
import { cn } from "@/app/lib/utils";
import { useState } from "react";

const EXAMPLE_QUERIES = [
  "Show me all posts with their authors",
  "Find all users who have written more than 1 post",
  "List the most recent 5 posts with their author names",
  "Count how many posts each user has written",
  "Find all posts that contain the word 'hello' in their content",
];

export default function AIWidget() {
  const [prompt, setPrompt] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [result, setResult] = useState<SQLResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showTips, setShowTips] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!prompt.trim()) {
      setError("Please enter a query");
      return;
    }

    setIsLoading(true);
    setError(null);
    setShowTips(false);

    try {
      const response = await generateSQLFromPrompt(prompt);

      if (response.success) {
        setResult(response);
      } else {
        setError(response.error || "Something went wrong");
        setResult(null);
        setShowTips(true);
      }
    } catch (err) {
      setError("Failed to generate SQL query");
      setResult(null);
      setShowTips(true);
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const setExampleQuery = (query: string) => {
    setPrompt(query);
    setShowTips(false);
  };

  return (
    <div className="space-y-4">
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
        <h2 className="text-lg font-semibold text-blue-700 mb-2">
          AI SQL Generator
        </h2>

        <p className="text-sm text-blue-600 mb-4">
          Ask questions about users and posts in natural language, and the AI
          will generate and execute SQL queries for you.
        </p>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label
              htmlFor="prompt"
              className="block text-sm font-medium text-blue-700 mb-1"
            >
              Enter your query in natural language
            </label>
            <textarea
              id="prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g., Show me all posts with their authors"
              className={cn(
                "w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2",
                "focus:ring-blue-500 placeholder-gray-400 text-gray-900"
              )}
              rows={3}
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <p className="text-xs text-blue-700 w-full">Example queries:</p>
            {EXAMPLE_QUERIES.map((query, index) => (
              <button
                key={index}
                type="button"
                onClick={() => setExampleQuery(query)}
                className="text-xs px-2 py-1 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-md"
              >
                {query}
              </button>
            ))}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className={cn(
              "px-4 py-2 rounded-md text-white font-medium",
              isLoading
                ? "bg-blue-400 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700"
            )}
          >
            {isLoading ? "Generating..." : "Generate SQL & Results"}
          </button>
        </form>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-md">
          <h2 className="text-lg font-semibold text-red-700">Error</h2>
          <p className="text-red-600">{error}</p>

          {showTips && (
            <div className="mt-3 text-sm text-red-600">
              <p className="font-medium">Tips to improve your query:</p>
              <ul className="list-disc pl-5 mt-1 space-y-1">
                <li>Try using one of the example queries</li>
                <li>Be more specific about what data you want to retrieve</li>
                <li>Mention table names explicitly (User, Post)</li>
                <li>Simplify your query if it&apos;s complex</li>
                <li>Avoid asking for operations not supported by SQL</li>
              </ul>
            </div>
          )}
        </div>
      )}

      {result && result.sqlQuery && result.results && (
        <div className="space-y-4">
          <div className="p-4 bg-gray-50 border border-gray-200 rounded-md">
            <h2 className="text-lg font-semibold text-gray-700 mb-2">
              Generated SQL Query
            </h2>
            <pre className="bg-gray-800 text-gray-100 p-3 rounded-md overflow-x-auto">
              {result.sqlQuery}
            </pre>
          </div>

          <div className="p-4 bg-green-50 border border-green-200 rounded-md">
            <h2 className="text-lg font-semibold text-green-700 mb-2">
              Query Results
            </h2>
            {Array.isArray(result.results) && result.results.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      {Object.keys(result.results[0]).map((key) => (
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
                    {result.results.map((row, rowIndex) => (
                      <tr key={rowIndex}>
                        {Object.values(row).map(
                          (value: unknown, valueIndex) => (
                            <td
                              key={valueIndex}
                              className="px-6 py-4 whitespace-nowrap text-sm text-gray-500"
                            >
                              {typeof value === "object" && value !== null
                                ? JSON.stringify(value)
                                : String(value)}
                            </td>
                          )
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-600">No results found</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
