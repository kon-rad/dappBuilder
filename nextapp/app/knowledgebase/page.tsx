'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function KnowledgeBasePage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    // Add user message
    const userMessage: Message = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      // Call your API endpoint
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: input }),
      });

      const data = await response.json();
      
      // Add assistant message
      const assistantMessage: Message = { role: 'assistant', content: data.response };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
      setInput('');
    }
  };

  return (
    <div className="container mx-auto max-w-4xl p-4 mt-24">
      <h1 className="text-3xl font-bold mb-8">Starknet Knowledge Base</h1>
      
      <div className="bg-gray-50 rounded-lg p-4 min-h-[400px] mb-4">
        {messages.map((message, index) => (
          <Card key={index} className={`mb-4 ${message.role === 'assistant' ? 'bg-blue-50' : ''}`}>
            <CardContent className="p-4">
              <div className="font-semibold mb-2">
                {message.role === 'assistant' ? 'AI Assistant' : 'You'}:
              </div>
              <div>{message.content}</div>
            </CardContent>
          </Card>
        ))}
        {isLoading && <div className="text-gray-500">AI is thinking...</div>}
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask a question..."
          className="flex-1"
          disabled={isLoading}
        />
        <Button type="submit" disabled={isLoading}>
          Send
        </Button>
      </form>
    </div>
  );
} 