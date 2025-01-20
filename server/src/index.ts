import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { HelloWorldService } from './services/HelloWorldService';
import { DappGenV1Service } from './services/DappGenV1Service';

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

  try {
    // Create initial dapp record
    const dappGen = await prisma.dappGen.create({
      data: {
        userId,
        prompt1: prompt,
        status: 'RUNNING',
        messages: {
          create: {
            content: prompt,
            role: 'user'
          }
        }
      },
    });

    // Initialize DappGenV1Service
    const dappGenService = new DappGenV1Service();
    
    // Generate both index and contract content using AI
    const [indexContent, contractContent] = await Promise.all([
      dappGenService.generateIndexContent(prompt),
      dappGenService.generateSmartContract(prompt)
    ]);
    
    console.log('indexContent: ', indexContent);
    console.log('contractContent: ', contractContent);
    
    // Execute bash script with both generated contents
    const result = await dappGenService.executeSetupScript(indexContent, contractContent);

    // Update dapp status
    await prisma.dappGen.update({
      where: { id: dappGen.id },
      data: {
        status: 'COMPLETED',
        messages: {
          create: {
            content: result,
            role: 'system'
          }
        }
      }
    });

    return res.json({ 
      message: 'DApp generation completed',
      dappGenId: dappGen.id,
      result
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

// Add new POST endpoint for Next.js app creation
app.post('/api/createNextApp', validateApiKey, async (req: Request, res: Response) => {
  try {
    const { appName } = req.body;

    if (!appName) {
      return res.status(400).json({ error: 'appName is required' });
    }

    // Debug environment variables (sanitized)
    console.log('Environment variables check:', {
      hasDropletIP: !!process.env.DROPLET_IP,
      hasUsername: !!process.env.SSH_USERNAME,
      hasPassword: !!process.env.SSH_PASSWORD,
      dropletIPLength: process.env.DROPLET_IP?.length,
      usernameLength: process.env.SSH_USERNAME?.length,
      passwordLength: process.env.SSH_PASSWORD?.length
    });

    // Initialize HelloWorld service
    const helloWorldService = new HelloWorldService({
      dropletIp: process.env.DROPLET_IP || "",
      sshUsername: process.env.SSH_USERNAME || "",
      sshPrivateKey: process.env.SSH_PRIVATE_KEY || "",
    });

    try {
      // Run hello world test
      console.log('Running Hello World test...');
      const helloWorldOutput = await helloWorldService.createAndRunHelloWorld();
      
      return res.json({
        success: true,
        output: helloWorldOutput,
        nextApp: {
          id: 123,
          name: appName,
          status: 'TESTED',
          logs: helloWorldOutput
        }
      });

    } catch (error) {
      console.error('Hello World test failed:', error);
      return res.status(500).json({ 
        error: 'Failed to connect to Digital Ocean',
        details: error.message 
      });
    }

  } catch (error) {
    console.error('Error in createNextApp:', error);
    return res.status(500).json({ 
      error: 'Server error',
      details: error.message 
    });
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