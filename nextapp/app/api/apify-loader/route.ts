import { ApifyDatasetLoader } from "@langchain/community/document_loaders/web/apify_dataset"
import { NextResponse } from "next/server"
import { OpenAIEmbeddings } from "@langchain/openai"
import { SupabaseVectorStore } from "@langchain/community/vectorstores/supabase"
import { createClient } from "@supabase/supabase-js"
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter"
import { ApifyClient } from 'apify-client'
import { Document } from "@langchain/core/documents"

const APIFY_API_TOKEN = process.env.APIFY_API_TOKEN
if (!APIFY_API_TOKEN) {
  throw new Error("Missing APIFY_API_TOKEN environment variable")
}

export async function POST(request: Request) {
  try {
    const { datasetId } = await request.json()

    const supabaseUrl = process.env.SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY
    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Missing Supabase credentials")
    }
    const client = createClient(supabaseUrl, supabaseKey)

    // Initialize the Apify loader
    const loader = new ApifyDatasetLoader(
      datasetId,
      {
        datasetMappingFunction: (item) =>
          new Document({
            pageContent: (item.text || "") as string,
            metadata: { source: item.url },
          }),
        clientOptions: {
          token: APIFY_API_TOKEN,
        },
        client: new ApifyClient({
          token: APIFY_API_TOKEN,
        }),
      }
    )

    console.log("Starting to load documents from Apify dataset:", datasetId)
    const docs = await loader.load()

    // Create unique identifiers for documents
    const processedDocs = docs.map(doc => ({
      ...doc,
      metadata: {
        ...doc.metadata,
        file_hash: `apify-${datasetId}-${doc.metadata.source || Math.random().toString(36)}`,
      }
    }))

    // Check for existing documents
    const { data: existingDocs } = await client
      .from('dappbuilder')
      .select('metadata ->> file_hash')

    const existingHashes = new Set(existingDocs?.map(doc => doc.file_hash))
    console.log("existingHashes: ", existingHashes.length)
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

    // Split documents into chunks
    const textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 2000,
      chunkOverlap: 200,
    })
    const splitDocs = await textSplitter.splitDocuments(newDocs)
    console.log(`Split into ${splitDocs.length} chunks`)

    // Create embeddings and store in Supabase
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

    return NextResponse.json({ 
      success: true, 
      totalFiles: docs.length,
      newFiles: newDocs.length,
      documentCount: splitDocs.length,
      message: "Dataset loaded and embedded successfully" 
    })
  } catch (error) {
    console.error("Error processing Apify dataset:", error)
    return NextResponse.json(
      { error: "Failed to process Apify dataset" },
      { status: 500 }
    )
  }
} 