import Link from 'next/link'
import { GoCode } from 'react-icons/go'

export default function Header() {
  return (
    <header className="fixed top-4 left-1/2 -translate-x-1/2 w-[95%] max-w-7xl">
      <div className="bg-white/80 backdrop-blur-sm border border-gray-200 rounded-full px-6 py-3 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-2">
          <GoCode className="w-6 h-6" />
        </div>
        
        <nav>
          <ul className="flex gap-6">
            <li>
              <Link href="/" className="hover:text-gray-600 transition-colors">
                Home
              </Link>
            </li>
            <li>
              <Link href="/knowledgebase" className="hover:text-gray-600 transition-colors">
                Knowledge Base
              </Link>
            </li>
            <li>
              <Link href="/dapps" className="hover:text-gray-600 transition-colors">
                dApps
              </Link>
            </li>
            <li>
              <Link href="/admin" className="hover:text-gray-600 transition-colors">
                Admin
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  )
}