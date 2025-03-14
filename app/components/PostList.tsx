"use client";

import { deletePost } from "@/app/actions/post";
import { cn } from "@/app/lib/utils";
import type { Post, User } from "@prisma/client";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

// Initialize dayjs plugins
dayjs.extend(relativeTime);

type PostWithAuthor = Post & {
  author: User;
};

interface PostListProps {
  posts: PostWithAuthor[];
}

export function PostList({ posts }: PostListProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async (postId: string) => {
    setIsDeleting(postId);
    setError(null);

    try {
      const result = await deletePost(postId);

      if (result.error) {
        setError(result.error);
      } else {
        // Refresh the page to show updated posts
        router.refresh();
      }
    } catch (err) {
      setError("An unexpected error occurred");
      console.error(err);
    } finally {
      setIsDeleting(null);
    }
  };

  if (posts.length === 0) {
    return (
      <div className="text-center py-12 px-4 rounded-lg border border-gray-100 bg-gray-50">
        <p className="text-gray-500 font-medium">
          No posts yet. Create your first post!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 w-full">
      {error && (
        <div className="p-3 text-sm bg-red-50 border border-red-200 text-red-600 rounded-md mb-4">
          {error}
        </div>
      )}

      {posts.map((post) => (
        <div
          key={post.id}
          className={cn(
            "border border-gray-200 rounded-lg p-5",
            "bg-white hover:bg-gray-50 transition-colors duration-150"
          )}
        >
          <div className="flex justify-between items-start mb-3">
            <h2 className="text-lg font-semibold text-gray-900">
              {post.title}
            </h2>
            <button
              onClick={() => handleDelete(post.id)}
              disabled={isDeleting === post.id}
              className={cn(
                "p-1.5 rounded-md transition-colors",
                isDeleting === post.id
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : "text-gray-400 hover:text-red-500 hover:bg-red-50"
              )}
              aria-label="Delete post"
            >
              <Trash2
                size={16}
                className={cn(isDeleting === post.id ? "animate-pulse" : "")}
              />
            </button>
          </div>

          {post.content && (
            <p className="text-gray-700 text-sm mb-3 whitespace-pre-wrap">
              {post.content}
            </p>
          )}

          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>By {post.author.name || "Anonymous"}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
