import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { exec } from 'child_process';
import path from 'path';
import fs from 'fs';
import { PrismaClient } from '@prisma/client';

// Define interfaces
interface CreateDappRequest extends Request {
  body: {
    prompt: string;
    userId: string;
  };
}

dotenv.config();

const app = express();
const port = process.env.PORT || 3010;

// Use cors middleware properly
app.use(cors());

// Enable CORS for all origins (for development only)
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, PUT, POST, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, x-api-key');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  return next();
});

app.use(express.json());

const prisma = new PrismaClient();

// Add API key middleware
const validateApiKey = (
  req: Request,
  res: Response,
  next: NextFunction
): Response | void => {
  const apiKey = req.headers['x-api-key'];
  const validApiKey = process.env.API_KEY;
  
  if (!apiKey || apiKey !== validApiKey) {
    return res.status(401).json({ error: 'Invalid API key' });
  }
  return next();
};

app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok' });
});

// Add new POST endpoint
app.post('/api/create-dapp', validateApiKey, async (req: CreateDappRequest, res: Response) => {
  const { prompt, userId } = req.body;
  
  if (!prompt) {
    return res.status(400).json({ error: 'Prompt is required' });
  }

  const serverDir = path.join(__dirname);
  const dappDir = path.join(serverDir, 'dapp1');

  try {
    // Create dapp in database
    const dappGen = await prisma.dappGen.create({
      data: {
        userId,
        prompt1: prompt,
        messages: {
          create: {
            content: prompt,
            role: 'user'
          }
        }
      },
    });

    // Create initial GenSteps record with RUNNING status
    const genStep = await prisma.genSteps.create({
      data: {
        stepNumber: 1,
        command: 'Clone repository',
        status: 'RUNNING',
        startDateTime: new Date(),
        classification: 'setup',
        stepNotes: 'Initial repository setup',
        terminalCommands: `git clone https://github.com/parketh/scaffold-stark.git ${dappDir}`,
        genId: dappGen.id,
      },
    });

    // Create dapp1 directory if it doesn't exist
    if (!fs.existsSync(dappDir)) {
      fs.mkdirSync(dappDir, { recursive: true });
    }

    const cloneCommand = `git clone https://github.com/parketh/scaffold-stark.git ${dappDir}`;

    // Return the exec promise to ensure all paths return
    return new Promise<void>((resolve) => {
      exec(cloneCommand, async (error, stdout, _stderr) => {
        if (error) {
          await prisma.genSteps.update({
            where: { id: genStep.id },
            data: {
              status: 'ERROR',
              output: error.message,
              endDateTime: new Date(),
            },
          });
          console.error(`Error: ${error}`);
          res.status(500).json({ error: 'Failed to clone repository' });
          return resolve();
        }

        const updatedGenStep = await prisma.genSteps.update({
          where: { id: genStep.id },
          data: {
            status: 'COMPLETED',
            output: stdout || 'Repository cloned successfully',
            endDateTime: new Date(),
          },
        });

        res.json({ 
          message: 'Repository cloned successfully',
          directory: dappDir,
          dappGen,
          genStep: updatedGenStep
        });
        return resolve();
      });
    });
  } catch (error) {
    console.error(`Error: ${error}`);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Add new POST endpoint for fetching GenSteps
app.post('/api/gendapp', validateApiKey, async (req: Request, res: Response) => {
  const { dappId } = req.body;
  
  if (!dappId) {
    return res.status(400).json({ error: 'dappId is required' });
  }

  try {
    const [steps, messages] = await Promise.all([
      prisma.genSteps.findMany({
        where: { genId: dappId },
        orderBy: { stepNumber: 'asc' }
      }),
      prisma.messages.findMany({
        where: { genId: dappId },
        orderBy: { createdAt: 'asc' }
      })
    ]);

    return res.json({ steps, messages });
  } catch (error) {
    console.error(`Error: ${error}`);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Test database connection
prisma.$connect()
  .then(() => {
    console.log('Successfully connected to database');
  })
  .catch((error) => {
    console.error('Failed to connect to database:', error);
  });

process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
}); 