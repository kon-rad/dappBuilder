"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useState } from "react"

export default function AdminPage() {
  const [githubUrl, setGithubUrl] = useState("")

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

  return (
    <div className="p-8 max-w-2xl mx-auto mt-26">
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
      </div>
    </div>
  )
}
