"use client";

import type { User } from "@prisma/client";
import { useRouter } from "next/navigation";
import { PostForm } from "./PostForm";

interface PostContainerProps {
  user: User;
}

export function PostContainer({ user }: PostContainerProps) {
  const router = useRouter();

  const handlePostSuccess = () => {
    // Refresh the current route to fetch updated data
    router.refresh();
  };

  return <PostForm userId={user.id} onSuccess={handlePostSuccess} />;
}
