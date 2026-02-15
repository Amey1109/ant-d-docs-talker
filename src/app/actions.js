"use server";

import fs from "fs";
import path from "path";
import similarity from "compute-cosine-similarity";
import { GoogleGenerativeAI } from "@google/generative-ai";

const DB_FILENAME = "database.json"; 
const GEN_API_KEY = process.env.GEMINI_API_KEY;

const genAI = new GoogleGenerativeAI(GEN_API_KEY);
const embeddingModel = genAI.getGenerativeModel({
  model: "gemini-embedding-001",
});
const chatModel = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

let cachedDb = null;

function getDatabase() {
  if (cachedDb) return cachedDb;

  try {
    const filePath = path.join(process.cwd(), DB_FILENAME);
    if (!fs.existsSync(filePath)) {
      console.error(`❌ Database file not found at ${filePath}`);
      return [];
    }
    const rawData = fs.readFileSync(filePath, "utf-8");
    cachedDb = JSON.parse(rawData);
    console.log(`✅ Loaded ${cachedDb?.length} vectors from cache.`);
    return cachedDb;
  } catch (error) {
    console.error("Error loading DB:", error);
    return [];
  }
}

export async function askGeminiRAG(userQuestion) {
  try {
    const db = getDatabase();

    if (!db || db.length === 0) {
      return {
        success: false,
        message:
          "System Error: Knowledge base (database.json) is missing or empty.",
      };
    }

    const result = await embeddingModel.embedContent(userQuestion);
    const queryVector = result.embedding.values;

    const matches = db.map((record) => ({
      text: record.text,
      score: similarity(queryVector, record.values),
    }));

    matches.sort((a, b) => b.score - a.score);

    const topMatches = matches.slice(0, 5);
    const bestContext = topMatches.map((m) => m.text).join("\n\n---\n\n");

    console.log(`📖 Context Found (Top Score: ${matches[0].score.toFixed(4)})`);


    const prompt = `
      You are an expert developer assistant. Answer the user's question using the Context provided below.
        
        RULES:
        1. Base your answer strictly on the logic and properties found in the Context.
        2. If the Context explains how a feature works but lacks a code example, **you MUST generate a code example** that demonstrates the logic described.
        3. Do not invent new properties that are not mentioned in the context.
        4. If the Context is completely irrelevant to the question, only then say "I don't know based on this document."
        
        --- CONTEXT START ---
        ${bestContext}
        --- CONTEXT END ---

        User Question: "${userQuestion}"
        Answer:
    `;

    const chatResult = await chatModel.generateContent(prompt);
    const answer = chatResult.response.text();

    return { success: true, message: answer };
  } catch (error) {
    console.error("RAG Error:", error);
    return {
      success: false,
      message: "I encountered an error connecting to the AI.",
    };
  }
}
