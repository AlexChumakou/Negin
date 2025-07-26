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

export async function createAiPost(
  content: string,
  authorId: string
) {
  try {

    console.log("content", content);
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "Take the content and based on the message given, write a clean sql query to get that would match what the message is requesting that I can use in postgres using the prisma client what ever you output will be placed int a raw sql query only and only give me the sql query not any other text with no extra messages or text. Do not include any other text or messages or comments or anything else just the sql query.",
        },
        {
          role: "user",
          content: content,
        },
        {
          role: "user", 
          content : `this is what the schema looks like: 
          // This is your Prisma schema file,
// learn more about it in the docs: https://pris.ly/d/prisma-schema

// Looking for ways to speed up your queries, or scale easily with your serverless or edge functions?
// Try Prisma Accelerate: https://pris.ly/cli/accelerate-init

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String?
  createdAt DateTime @default(now())
  posts     Post[]
}

model Post {
  id        String   @id @default(cuid())
  title     String
  content   String?
  authorId  String
  author    User     @relation(fields: [authorId], references: [id])
  createdAt DateTime @default(now())
}
`
        }

      ],
    });

    console.log("Message", response.choices[0]?.message?.content || "No response from AI");

    const sqlQuery = response.choices[0]?.message?.content || "";
    let result = null;
    try {
      result = await prisma.$queryRawUnsafe(sqlQuery);
    } catch (e) {
      return { error: "SQL execution failed: " + e.message };
    }

    console.log("result", result);

  } catch (error) {
    console.error("Error creating post:", error);
    return { error: "Failed to create post" };
  }
}

