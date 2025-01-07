import { NextResponse } from 'next/server';
import { Configuration, OpenAIApi } from 'openai';
import { getVectraClient } from '@/lib/vectra';

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});

const openai = new OpenAIApi(configuration);

export async function POST(request: Request) {
  try {
    const { message } = await request.json();
    
    // Get embedding for the query
    const response = await openai.createEmbedding({
      model: "text-embedding-ada-002",
      input: message,
    });
    const embedding = response.data.data[0].embedding;

    // Get Vectra client and query
    const vectraClient = await getVectraClient();
    const results = await vectraClient.queryItems(embedding, 3);

    // Format context from results
    const context = results
      .map(result => result.item.metadata.text)
      .join('\n\n');

    // Get completion from OpenAI
    const completion = await openai.createChatCompletion({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: `You are a helpful assistant. Use the following context to answer the question: ${context}`,
        },
        { role: "user", content: message },
      ],
    });

    return NextResponse.json({ 
      response: completion.data.choices[0].message?.content 
    });

  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 