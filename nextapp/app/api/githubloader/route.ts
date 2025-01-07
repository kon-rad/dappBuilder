import { GithubRepoLoader } from "@langchain/community/document_loaders/web/github"
import { NextResponse } from "next/server"
import { OpenAIEmbeddings } from "@langchain/openai"
import { getVectraClient } from "@/lib/vectra"

export async function POST(request: Request) {
  try {
    const { url } = await request.json()

    const loader = new GithubRepoLoader(url, {
      branch: "main",
      recursive: false,
      unknown: "warn",
      maxConcurrency: 5,
    })

    const docs = await loader.load()
    console.log("Loaded documents:", docs)

    const embeddings = new OpenAIEmbeddings()
    const vectraClient = await getVectraClient()
    
    // Process each document individually
    for (const doc of docs) {
      const embedding = await embeddings.embedQuery(doc.pageContent)
      await vectraClient.addDocuments({
        embeddings: [embedding],
        documents: [doc.pageContent],
        metadata: [doc.metadata]
      })
    }

    return NextResponse.json({ 
      success: true, 
      documentCount: docs.length,
      message: "Documents loaded and embedded successfully" 
    })
  } catch (error) {
    console.error("Error processing GitHub repository:", error)
    return NextResponse.json(
      { error: "Failed to process GitHub repository" },
      { status: 500 }
    )
  }
}