"use client";

import { cn } from "@/app/lib/utils";
import { RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function RefreshButton() {
  const router = useRouter();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);

    // Refresh the current route
    router.refresh();

    // Reset the refreshing state after a short delay
    setTimeout(() => {
      setIsRefreshing(false);
    }, 1000);
  };

  return (
    <button
      onClick={handleRefresh}
      disabled={isRefreshing}
      className={cn(
        "p-1.5 rounded-md transition-colors",
        isRefreshing
          ? "bg-gray-100 text-gray-400 cursor-not-allowed"
          : "text-gray-400 hover:text-blue-500 hover:bg-blue-50"
      )}
      aria-label="Refresh posts"
    >
      <RefreshCw size={16} className={cn(isRefreshing ? "animate-spin" : "")} />
    </button>
  );
}
