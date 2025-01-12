"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useState } from "react"

export default function AdminPage() {
  const [githubUrl, setGithubUrl] = useState("")
  const [datasetId, setDatasetId] = useState("")

  const handleSubmit = async () => {
    try {
      const response = await fetch("/api/github-loader", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url: githubUrl }),
      })
      
      if (!response.ok) {
        throw new Error("Failed to load GitHub repository")
      }
      
      const data = await response.json()
      console.log("Response:", data)
    } catch (error) {
      console.error("Error:", error)
    }
  }

  const handleApifySubmit = async () => {
    try {
      const response = await fetch("/api/apify-loader", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ datasetId }),
      })
      
      if (!response.ok) {
        throw new Error("Failed to load Apify dataset")
      }
      
      const data = await response.json()
      console.log("Response:", data)
    } catch (error) {
      console.error("Error:", error)
    }
  }

  return (
    <div className="p-8 max-w-2xl mx-auto mt-24">
      <div className="space-y-4 pt-26">
        <div className="space-y-2 mt-24">
          <Label htmlFor="github-url">GitHub Repository URL</Label>
          <Input
            id="github-url"
            placeholder="https://github.com/username/repository"
            value={githubUrl}
            onChange={(e) => setGithubUrl(e.target.value)}
          />
        </div>
        <Button onClick={handleSubmit}>Load Repository</Button>

        <div className="space-y-2 mt-4">
          <Label htmlFor="dataset-id">Apify Run ID</Label>
          <Input
            id="dataset-id"
            placeholder="Enter Apify dataset ID"
            value={datasetId}
            onChange={(e) => setDatasetId(e.target.value)}
          />
        </div>
        <Button onClick={handleApifySubmit}>Load Dataset</Button>
      </div>
    </div>
  )
}
