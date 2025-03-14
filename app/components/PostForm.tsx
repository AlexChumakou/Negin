"use client";

import { createPost } from "@/app/actions/post";
import { cn } from "@/app/lib/utils";
import { Loader2, Send } from "lucide-react";
import { useState } from "react";

interface PostFormProps {
  userId: string;
  onSuccess?: () => void;
}

export function PostForm({ userId, onSuccess }: PostFormProps) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    

    if (!title.trim()) {
      setError("Title is required");
      return;
    }

    if (title.trim().length < 5) {
      setError("Title must be at least 5 characters long");
      return;
    }


    setIsSubmitting(true);
    setError(null);

    try {
      const result = await createPost(title, content, userId);

      if (result.error) {
        setError(result.error);
      } else {
        setTitle("");
        setContent("");
        if (onSuccess) {
          onSuccess();
        }
      }
    } catch (err) {
      setError("An unexpected error occurred");
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 w-full">
      <div>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Post title"
          className={cn(
            "w-full px-3 py-2 text-sm bg-transparent border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors",
            error && !title.trim()
              ? "border-red-300 focus:border-red-500 focus:ring-red-500"
              : "border-gray-200 focus:border-blue-500"
          )}
          disabled={isSubmitting}
        />
      </div>

      <div>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Post content (optional)"
          className={cn(
            "w-full px-3 py-2 text-sm bg-transparent border border-gray-200 rounded-md",
            "focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors",
            "min-h-[100px] resize-y"
          )}
          disabled={isSubmitting}
        />
      </div>

      {error && <div className="text-red-500 text-xs px-1">{error}</div>}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isSubmitting}
          className={cn(
            "py-2 px-4 rounded-md text-sm font-medium transition-colors inline-flex items-center gap-2",
            isSubmitting
              ? "bg-gray-100 text-gray-400 cursor-not-allowed"
              : "bg-blue-600 text-white hover:bg-blue-700"
          )}
        >
          {isSubmitting ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              <span>Creating...</span>
            </>
          ) : (
            <>
              <Send size={16} />
              <span>Create Post</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}
