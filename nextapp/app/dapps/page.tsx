import Link from 'next/link';
import { prisma } from '@/lib/prisma';

async function getDappGens() {
  return await prisma.dappGen.findMany({
    include: {
      steps: {
        orderBy: {
          stepNumber: 'asc'
        }
      }
    }
  });
}

export default async function DappsPage() {
  const dappGens = await getDappGens();

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Dapps</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {dappGens.map((dapp) => (
          <div key={dapp.id} className="border rounded-lg p-4 shadow-md">
            <Link 
              href={`/dapps/${dapp.id}`}
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              {dapp.id}
            </Link>
            
            <p className="mt-2 text-gray-700">{dapp.prompt1}</p>
            
            <div className="mt-4 space-y-2">
              {dapp.steps.map((step) => (
                <div key={step.id} className="text-sm">
                  <span className="font-medium">{step.stepNumber}. </span>
                  <span className="text-gray-600">{step.command}</span>
                  <p className="text-gray-500 text-[14px] ml-4">{step.output}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
