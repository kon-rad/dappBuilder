import { NextResponse } from 'next/server';
import Together from "together-ai";
import { SupabaseVectorStore } from "@langchain/community/vectorstores/supabase";
import { createClient } from "@supabase/supabase-js";
import { OpenAIEmbeddings } from "@langchain/openai";

// Supabase configuration
const privateKey = process.env.SUPABASE_SERVICE_KEY;
if (!privateKey) throw new Error(`Expected env var SUPABASE_SERVICE_KEY`);

const url = process.env.SUPABASE_URL;
if (!url) throw new Error(`Expected env var SUPABASE_URL`);

const together = new Together({
  apiKey: process.env.TOGETHER_API_KEY,
});

export const POST = async (request: Request) => {
  try {
    const { message } = await request.json();
    console.log('Received message:', message);
    
    // Initialize Supabase client and vector store
    const client = createClient(url, privateKey);
    const vectorStore = new SupabaseVectorStore(new OpenAIEmbeddings(), {
      client,
      tableName: "dappbuilder",
      queryName: "match_dappbuilder",
    });

    // Query the vector store
    console.log('Querying Supabase...');
    const results = await vectorStore.similaritySearch(message, 20);
    console.log('Supabase results:', results.length, 'items found');

    // Format context from results
    const context = results
      .map(doc => doc.pageContent)
      .join('\n\n');
    console.log('Formatted context length:', context.length, 'characters');
    console.log('Formatted context:', context, '');

    // Get completion from Together AI
    console.log('Requesting completion from Together AI...');
    const completion = await together.chat.completions.create({
      model: "mistralai/Mixtral-8x7B-Instruct-v0.1",
      messages: [
        { 
          role: "system",
          content: `You are a helpful assistant. Use the following context to answer the question: ${context}`,
        },
        { role: "user", content: message },
      ],
    });
    console.log('Received completion response');

    return NextResponse.json({ 
      response: completion.choices[0].message.content 
    });

  } catch (error) {
    console.error('Error details:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 