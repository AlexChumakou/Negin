"use client";

import { getAIGreeting } from "@/app/actions/sql";
import { useEffect, useState } from "react";
import { PostAiForm } from "./PostFormWithAI";

type AIWidgetProps = {
  user: { id: string };
};

export default function AIWidget({ user }: AIWidgetProps) {
  const [greeting, setGreeting] = useState<string>("Loading AI greeting...");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchGreeting = async () => {
      try {
        const response = await getAIGreeting();

        if (response.success) {
          setGreeting(response.message || "No message received");
        } else {
          setError(response.error || "Something went wrong");
        }
      } catch (err) {
        setError("Failed to fetch AI greeting");
        console.error(err);
      }
    };

    fetchGreeting();
  }, []);

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-md">
        <h2 className="text-lg font-semibold text-red-700">Error</h2>
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  const handleAiCall = () => {
    
  };

  return (
    <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
      <h2 className="text-lg font-semibold text-blue-700">AI Greeting</h2>
      <p className="text-blue-600">{greeting}</p>
      <PostAiForm userId={user.id} onSuccess={handleAiCall}/>
    </div>

    
  );
}
