"use server";

import { prisma } from "@/app/lib/prisma";
import OpenAI from "openai";

export async function getPosts() {
  try {
    const posts = await prisma.post.findMany({
      include: {
        author: true,
      },
      orderBy: {
        id: "desc",
      },
    });

    return { posts };
  } catch (error) {
    console.error("Error fetching posts:", error);
    return { error: "Failed to fetch posts" };
  }
}

export async function getAIGreeting() {
  try {
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are a helpful assistant.",
        },
        {
          role: "user",
          content: "Say hello world!",
        },
      ],
    });

    return {
      message: response.choices[0]?.message?.content || "No response from AI",
      success: true,
    };
  } catch (error) {
    console.error("Error calling AI:", error);
    return { error: "Failed to get AI response", success: false };
  }
}

export async function createPost(
  title: string,
  content: string,
  authorId: string
) {
  try {
    const post = await prisma.post.create({
      data: {
        title,
        content,
        authorId,
      },
    });

    return { post };
  } catch (error) {
    console.error("Error creating post:", error);
    return { error: "Failed to create post" };
  }
}

export async function deletePost(postId: string) {
  try {
    await prisma.post.delete({
      where: {
        id: postId,
      },
    });

    return { success: true };
  } catch (error) {
    console.error("Error deleting post:", error);
    return { error: "Failed to delete post" };
  }
}
