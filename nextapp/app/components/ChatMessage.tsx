interface ChatMessageProps {
  content: string;
  role: string;
  createdAt: string;
}

export default function ChatMessage({ content, role, createdAt }: ChatMessageProps) {
  return (
    <div className={`flex ${role === 'user' ? 'justify-end' : 'justify-start'} mb-4`}>
      <div className={`max-w-[70%] rounded-lg p-4 ${
        role === 'user' ? 'bg-blue-500 text-white' : 'bg-gray-200'
      }`}>
        <p className="text-sm">{content}</p>
        <p className="text-xs mt-2 text-gray-500">
          {new Date(createdAt).toLocaleTimeString()}
        </p>
      </div>
    </div>
  );
} 