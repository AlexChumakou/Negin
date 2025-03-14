"use server";

import OpenAI from "openai";

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
