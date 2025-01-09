'use client'
import { useEffect, useState } from 'react'
import ChatMessage from '../../components/ChatMessage'

interface GenStep {
  id: string
  stepNumber: number
  command: string
  terminalCommands: string
  status: string
  startDateTime: string
  endDateTime: string | null
  classification: string
  stepNotes: string
  output: string | null
}

interface Message {
  id: string;
  content: string;
  role: string;
  createdAt: string;
}

export default function DappPage({ params }: { params: { id: string } }) {
  const [steps, setSteps] = useState<GenStep[]>([])
  const [messages, setMessages] = useState<Message[]>([])
  const [error, setError] = useState<string>('')

  useEffect(() => {
    const fetchData = async () => {
      try {
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3010'
        const response = await fetch(`${backendUrl}/api/gendapp`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': process.env.NEXT_PUBLIC_API_KEY || ''
          },
          body: JSON.stringify({ dappId: params.id })
        })
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json()
        setSteps(data.steps)
        setMessages(data.messages)
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
        console.error('Failed to fetch data:', errorMessage)
        setError(errorMessage)
      }
    }

    fetchData()
  }, [params.id])

  const formatDateTime = (dateString: string | null) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleString()
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="text-red-500">Error: {error}</div>
      </div>
    )
  }

  return (
    <div className="flex h-screen mt-26">
      {/* Chat Panel - 1/3 width */}
      <div className="w-1/3 border-r p-4 bg-gray-50">
        <h2 className="text-2xl font-bold mb-4">Chat</h2>
        <div className="h-[calc(100vh-8rem)] overflow-y-auto">
          {messages.map((message) => (
            <ChatMessage
              key={message.id}
              content={message.content}
              role={message.role}
              createdAt={message.createdAt}
            />
          ))}
        </div>
      </div>

      {/* Steps Display - 2/3 width */}
      <div className="w-2/3 p-8">
        <h1 className="text-4xl font-bold mb-6">Dapp Builder</h1>
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border">
            <thead>
              <tr className="bg-gray-100">
                <th className="px-4 py-2 border">Step</th>
                <th className="px-4 py-2 border">Command</th>
                <th className="px-4 py-2 border">Terminal Commands</th>
                <th className="px-4 py-2 border">Output</th>
                <th className="px-4 py-2 border">Status</th>
                <th className="px-4 py-2 border">Start Time</th>
                <th className="px-4 py-2 border">End Time</th>
                <th className="px-4 py-2 border">Notes</th>
              </tr>
            </thead>
            <tbody>
              {steps.map((step) => (
                <tr key={step.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2 border text-center">{step.stepNumber}</td>
                  <td className="px-4 py-2 border">
                    <div className="font-medium">{step.command}</div>
                    <div className="text-sm text-gray-500">{step.classification}</div>
                  </td>
                  <td className="px-4 py-2 border">
                    <code className="bg-gray-100 px-2 py-1 rounded text-sm">
                      {step.terminalCommands}
                    </code>
                  </td>
                  <td className="px-4 py-2 border">
                    <div className="max-h-32 overflow-y-auto">
                      <code className="whitespace-pre-wrap break-words text-sm text-gray-600">
                        {step.output || 'No output'}
                      </code>
                    </div>
                  </td>
                  <td className="px-4 py-2 border">
                    <span className={`px-2 py-1 rounded text-sm ${
                      step.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                      step.status === 'ERROR' ? 'bg-red-100 text-red-800' :
                      step.status === 'RUNNING' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {step.status}
                    </span>
                  </td>
                  <td className="px-4 py-2 border text-sm">
                    {formatDateTime(step.startDateTime)}
                  </td>
                  <td className="px-4 py-2 border text-sm">
                    {formatDateTime(step.endDateTime)}
                  </td>
                  <td className="px-4 py-2 border">
                    <div className="text-sm">{step.stepNotes}</div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}