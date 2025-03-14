"use server";

import { prisma } from "@/app/lib/prisma";
import OpenAI from "openai";

export type SQLResponse = {
  sqlQuery?: string;
  results?: Record<string, unknown>[];
  success: boolean;
  error?: string;
};

// Function to sanitize and fix common SQL errors
function sanitizeSQLQuery(query: string): string {
  let sanitized = query.trim();

  // Remove any markdown formatting that might have been included
  sanitized = sanitized.replace(/```sql/g, "");
  sanitized = sanitized.replace(/```/g, "");

  // Fix empty double quotes that can cause "zero-length delimited identifier" errors
  sanitized = sanitized.replace(/""/g, '"');

  // Replace unquoted table names with quoted ones - only if they're used as table names
  // Use word boundaries and negative lookahead to avoid replacing function names
  sanitized = sanitized.replace(/\bfrom\s+User\b/gi, 'from "User"');
  sanitized = sanitized.replace(/\bjoin\s+User\b/gi, 'join "User"');
  sanitized = sanitized.replace(/\bfrom\s+Post\b/gi, 'from "Post"');
  sanitized = sanitized.replace(/\bjoin\s+Post\b/gi, 'join "Post"');

  // Replace lowercase table names
  sanitized = sanitized.replace(/\bfrom\s+user\b/gi, 'from "User"');
  sanitized = sanitized.replace(/\bjoin\s+user\b/gi, 'join "User"');
  sanitized = sanitized.replace(/\bfrom\s+post\b/gi, 'from "Post"');
  sanitized = sanitized.replace(/\bjoin\s+post\b/gi, 'join "Post"');

  // Fix table name references in WHERE, GROUP BY, ORDER BY clauses
  sanitized = sanitized.replace(/\bUser\.\b/g, '"User".');
  sanitized = sanitized.replace(/\bPost\.\b/g, '"Post".');
  sanitized = sanitized.replace(/\buser\.\b/gi, '"User".');
  sanitized = sanitized.replace(/\bpost\.\b/gi, '"Post".');

  // Fix INSERT and UPDATE statements
  sanitized = sanitized.replace(
    /\binsert\s+into\s+User\b/gi,
    'insert into "User"'
  );
  sanitized = sanitized.replace(/\bupdate\s+User\b/gi, 'update "User"');
  sanitized = sanitized.replace(
    /\binsert\s+into\s+Post\b/gi,
    'insert into "Post"'
  );
  sanitized = sanitized.replace(/\bupdate\s+Post\b/gi, 'update "Post"');

  // Fix INSERT and UPDATE statements with lowercase
  sanitized = sanitized.replace(
    /\binsert\s+into\s+user\b/gi,
    'insert into "User"'
  );
  sanitized = sanitized.replace(/\bupdate\s+user\b/gi, 'update "User"');
  sanitized = sanitized.replace(
    /\binsert\s+into\s+post\b/gi,
    'insert into "Post"'
  );
  sanitized = sanitized.replace(/\bupdate\s+post\b/gi, 'update "Post"');

  // Remove any trailing semicolons (Prisma doesn't need them)
  sanitized = sanitized.replace(/;\s*$/, "");

  return sanitized;
}

export async function getAIGreeting() {
  try {
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are a helpful assistant with a good sense of humor.",
        },
        {
          role: "user",
          content: "Say hello world and tell me a short, clean joke!",
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

export async function generateSQLFromPrompt(
  prompt: string
): Promise<SQLResponse> {
  try {
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    // The actual Prisma schema content
    const prismaSchema = `
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
`;

    // Extract model definitions for clearer explanation to the AI
    const schemaInfo = `
      Database has the following tables with their exact PostgreSQL names:
      
      "User" {
        id: String (primary key, cuid)
        email: String (unique)
        name: String (optional)
        createdAt: DateTime
        posts: Relation to Post[]
      }
      
      "Post" {
        id: String (primary key, cuid)
        title: String
        content: String (optional)
        authorId: String (foreign key to User.id)
        author: Relation to User
        createdAt: DateTime
      }
      
      IMPORTANT: PostgreSQL is case-sensitive with table names. Always use double quotes around table names:
      - Use "User" (with quotes) not user or User without quotes
      - Use "Post" (with quotes) not post or Post without quotes
    `;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are a SQL query generator for PostgreSQL. Given a natural language prompt, generate a valid SQL query that can be executed against a PostgreSQL database.
          
          Here is the complete Prisma schema that defines the database structure:
          
          \`\`\`prisma
          ${prismaSchema}
          \`\`\`
          
          ${schemaInfo}
          
          IMPORTANT RULES:
          1. Always use double quotes around table names: "User", "Post"
          2. Return ONLY the SQL query without any explanation or markdown formatting
          3. The query should be executable as-is
          4. Make sure to handle joins properly when needed
          5. Use proper PostgreSQL syntax for all operations
          6. Never use empty double quotes like "" - this causes syntax errors
          7. Use the exact column names as defined in the schema`,
        },
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    let sqlQuery = response.choices[0]?.message?.content || "";

    // Sanitize the SQL query to fix common errors
    sqlQuery = sanitizeSQLQuery(sqlQuery);

    // Log the generated query for debugging
    console.log("Generated SQL query:", sqlQuery);

    // Check if the query is empty or contains only whitespace
    if (!sqlQuery.trim()) {
      return {
        error: "Generated SQL query is empty. Please try a different prompt.",
        success: false,
      };
    }

    // Execute the SQL query using Prisma's $queryRawUnsafe
    const results = await prisma.$queryRawUnsafe(sqlQuery);

    return {
      sqlQuery,
      results: results as Record<string, unknown>[],
      success: true,
    };
  } catch (error) {
    console.error("Error generating or executing SQL:", error);

    // If there's an error, try to generate a more specific error message
    let errorMessage = "Failed to generate or execute SQL query";
    if (error instanceof Error) {
      errorMessage = `${errorMessage}: ${error.message}`;

      // Add more specific guidance for common errors
      if (
        error.message.includes("relation") &&
        error.message.includes("does not exist")
      ) {
        errorMessage +=
          ". This might be due to incorrect table names. Make sure to use double quotes around table names.";
      } else if (
        error.message.includes("column") &&
        error.message.includes("does not exist")
      ) {
        errorMessage +=
          ". This might be due to incorrect column names. Please check the column names in your query.";
      } else if (error.message.includes("zero-length delimited identifier")) {
        errorMessage +=
          ". This is caused by empty double quotes in the SQL query. Please try a different prompt.";
      } else if (error.message.includes("syntax error")) {
        errorMessage +=
          ". There's a syntax error in the generated SQL. Please try rephrasing your prompt.";
      }
    }

    return {
      error: errorMessage,
      success: false,
    };
  }
}
