"use server";

import OpenAI from "openai";
import { prisma } from "@/app/lib/prisma";

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

export async function generateSQLQuery(userInput: string) {
  try {
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    // Provide schema information to the AI
    const schemaInfo = `
Database Schema:
- User model: id (string, primary key), email (string, unique), name (string, nullable), createdAt (datetime), posts (relation to Post)
- Post model: id (string, primary key), title (string), content (string, nullable), authorId (string, foreign key to User.id), createdAt (datetime), author (relation to User)
    `;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: 
            "You are an AI assistant that generates Prisma queries based on natural language descriptions. " +
            "Output ONLY the query part inside prisma method calls WITHOUT any variable declarations, await keywords, or semicolons. " +
            "For example, instead of returning: `const posts = await prisma.post.findMany({ where: { title: { contains: 'test' } } });` " +
            "You should return ONLY: `prisma.post.findMany({ where: { title: { contains: 'test' } } })` " +
            "Keep your response focused only on the prisma method call itself. " +
            "Do not include any explanations, backticks, or comments in your response."
        },
        {
          role: "user",
          content: `${schemaInfo}\n\nGenerate a Prisma query for the following request: "${userInput}"`
        },
      ],
    });

    let query = response.choices[0]?.message?.content?.trim() || "";
    
    // Extra processing to remove any remaining JavaScript code artifacts
    // Remove variable declarations, await keywords, and trailing semicolons
    query = query.replace(/^(const|let|var)\s+\w+\s*=\s*await\s+/i, '')
                 .replace(/^await\s+/i, '')
                 .replace(/;$/g, '');
    
    // If the query still doesn't start with 'prisma', something is wrong
    if (!query.startsWith('prisma.')) {
      console.warn('Generated query does not start with "prisma.":', query);
      // Try to extract just the prisma part if possible
      const match = query.match(/prisma\.\w+\.\w+\([\s\S]*\)/);
      if (match) {
        query = match[0];
      }
    }
    
    return {
      query,
      success: true
    };
  } catch (error) {
    console.error("Error generating SQL query:", error);
    return { error: "Failed to generate SQL query", success: false };
  }
}

export async function executeSQLQuery(prismaQuery: string) {
  try {
    // Security check - only allow certain operations to prevent unsafe queries
    const lowerQuery = prismaQuery.toLowerCase();
    
    if (
      lowerQuery.includes("delete") || 
      lowerQuery.includes("update") || 
      lowerQuery.includes("create") ||
      lowerQuery.includes("upsert") ||
      lowerQuery.includes("exec") ||
      lowerQuery.includes("$executeraw")
    ) {
      return { 
        error: "Only read operations are allowed for security reasons", 
        success: false 
      };
    }

    // Make sure the query starts with prisma.
    if (!prismaQuery.trim().startsWith('prisma.')) {
      return {
        error: "Invalid query format. Query must start with 'prisma.'",
        success: false
      };
    }

    // Add safety by wrapping in a function to evaluate
    const dynamicQueryFunction = new Function('prisma', `
      try {
        return ${prismaQuery};
      } catch (error) {
        throw new Error(\`Query execution error: \${error.message}\`);
      }
    `);

    // Execute the query
    const results = await dynamicQueryFunction(prisma);
    
    return {
      results: Array.isArray(results) ? results : [results],
      success: true
    };
  } catch (error: any) {
    console.error("Error executing query:", error);
    return { 
      error: `Failed to execute query: ${error.message}`, 
      success: false 
    };
  }
}
