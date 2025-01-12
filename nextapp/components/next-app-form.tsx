'use client'

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"

export function NextAppForm() {
  const [appName, setAppName] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const handleSubmit = async () => {
    if (!appName.trim()) {
      setError("App name is required")
      return
    }

    setIsLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/createNextApp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.NEXT_PUBLIC_API_KEY || '',
        },
        body: JSON.stringify({
          appName: appName.trim()
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create Next.js app')
      }

      setSuccess(`Successfully created Next.js app! URL: ${data.nextApp.url}`)
      setAppName("")
    } catch (err) {
      setError(err.message || 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-4 w-full">
      <div className="space-y-2">
        <Label htmlFor="appName">Next.js App Name</Label>
        <div className="flex gap-2">
          <Input
            id="appName"
            placeholder="my-next-app"
            value={appName}
            onChange={(e) => setAppName(e.target.value)}
            disabled={isLoading}
          />
          <Button 
            onClick={handleSubmit}
            disabled={isLoading}
          >
            {isLoading ? "Creating..." : "Create App"}
          </Button>
        </div>
      </div>

      {error && (
        <p className="text-sm text-red-500">
          {error}
        </p>
      )}

      {success && (
        <p className="text-sm text-green-500">
          {success}
        </p>
      )}

      {isLoading && (
        <p className="text-sm text-gray-500">
          Creating your Next.js app... This may take a few minutes.
        </p>
      )}
    </div>
  )
} 