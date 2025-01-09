import { GithubRepoLoader } from "@langchain/community/document_loaders/web/github"
import { NextResponse } from "next/server"
import { OpenAIEmbeddings } from "@langchain/openai"
import { SupabaseVectorStore } from "@langchain/community/vectorstores/supabase"
import { createClient } from "@supabase/supabase-js"
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter"

// Add GitHub token check
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
if (!GITHUB_TOKEN) {
  throw new Error("Missing GITHUB_TOKEN environment variable");
}

export async function POST(request: Request) {
  try {
    const { url } = await request.json()

    const supabaseUrl = process.env.SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY
    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Missing Supabase credentials")
    }
    const client = createClient(supabaseUrl, supabaseKey)

    const loader = new GithubRepoLoader(url, {
      branch: "main",
      recursive: true,
      unknown: "warn",
      maxConcurrency: 5,
      accessToken: GITHUB_TOKEN, // Add GitHub authentication token
    })

    console.log("Starting to load documents from GitHub repository:", url)
    const docs = await loader.load()
    
    // Create a unique identifier for each file based on its path and content
    const processedDocs = docs.map(doc => ({
      ...doc,
      metadata: {
        ...doc.metadata,
        file_hash: `${url}#${doc.metadata.source}`, // Unique identifier per file
      }
    }))

    // Query Supabase to check which files are already stored
    const { data: existingDocs } = await client
      .from('dappbuilder')
      .select('metadata ->> file_hash')

    const existingHashes = new Set(existingDocs?.map(doc => doc.file_hash))
    
    // Filter out documents that already exist
    const newDocs = processedDocs.filter(doc => !existingHashes.has(doc.metadata.file_hash))

    console.log(`Found ${docs.length} total documents`)
    console.log(`${docs.length - newDocs.length} documents already exist in database`)
    console.log(`Processing ${newDocs.length} new documents`)

    if (newDocs.length === 0) {
      return NextResponse.json({ 
        success: true, 
        totalFiles: docs.length,
        newFiles: 0,
        message: "All documents already exist in database" 
      })
    }

    // Process only new documents
    const textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 2000,
      chunkOverlap: 200,
    })
    const splitDocs = await textSplitter.splitDocuments(newDocs)
    console.log(`Split into ${splitDocs.length} chunks`)

    console.log("Starting vector embedding process...")
    const vectorStore = await SupabaseVectorStore.fromDocuments(
      splitDocs,
      new OpenAIEmbeddings(),
      {
        client,
        tableName: "dappbuilder",
        queryName: "match_dappbuilder",
      }
    )
    console.log("Vector embedding complete")
    console.log("Vector embedding complete newDocs.length", newDocs.length)

    return NextResponse.json({ 
      success: true, 
      totalFiles: docs.length,
      newFiles: newDocs.length,
      documentCount: splitDocs.length,
      files: newDocs.map(doc => doc.metadata.source),
      message: "New documents loaded and embedded successfully" 
    })
  } catch (error) {
    console.error("Error processing GitHub repository:", error)
    return NextResponse.json(
      { error: "Failed to process GitHub repository" },
      { status: 500 }
    )
  }
}