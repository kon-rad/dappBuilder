import { PromptForm } from "@/components/prompt-form"

export default function Home() {
  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col gap-8 row-start-2 items-center sm:items-start">
        <div className="flex flex-col items-center gap-4">
          <h1 className="text-4xl font-bold">DappBuilder</h1>
          <p className="text-xl text-gray-600 dark:text-gray-400">text-to-dapp generator</p>
        </div>

        <div className="flex flex-col gap-6 w-full max-w-2xl">
          <div className="flex flex-col gap-4">
            <a 
              href="https://github.com/Scaffold-Stark/scaffold-stark-2"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 hover:text-blue-600 transition-colors"
            >
              Scaffold-Stark-2 GitHub Repository
            </a>
            
            <div className="flex gap-4 text-sm">
              <a 
                href="https://docs.scaffoldstark.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 hover:text-blue-600 transition-colors"
              >
                Documentation
              </a>
              <span>|</span>
              <a 
                href="https://scaffoldstark.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 hover:text-blue-600 transition-colors"
              >
                Website
              </a>
              <span>|</span>
              <a 
                href="https://scaffold-stark-demo.vercel.app/debug"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 hover:text-blue-600 transition-colors"
              >
                Demo
              </a>
            </div>

            <p className="text-gray-600 dark:text-gray-400">
              🧪 An open-source, up-to-date toolkit for building decentralized applications (dapps) on Starknet blockchain. It's designed to make it easier for developers to create and deploy smart contracts and build user interfaces that interact with those contracts.
            </p>
            
            <p className="text-gray-600 dark:text-gray-400">
              ⚙️ Built using NextJS, Starknet.js, Scarb, Starknet-React, Starknet Foundry and Typescript.
            </p>
          </div>

          <PromptForm />
        </div>
      </main>
      <footer className="row-start-3 flex gap-6 flex-wrap items-center justify-center">
      </footer>
    </div>
  )
}
