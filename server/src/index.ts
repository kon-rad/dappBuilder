import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { exec } from 'child_process';
import { PrismaClient } from '@prisma/client';
import { ManagerAgent, DeveloperAgent } from './agents';
import { HelloWorldService } from './services/HelloWorldService';

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

    // Start the event loop asynchronously
    processAgentLoop(dappGen.id, prompt).catch(error => {
      console.error('Agent loop failed:', error);
    });

    // Respond immediately with the dappGen ID
    return res.json({ 
      message: 'DApp generation started',
      dappGenId: dappGen.id
    });

  } catch (error) {
    console.error(`Error: ${error}`);
    return res.status(500).json({ error: 'Server error' });
  }
});

async function processAgentLoop(dappGenId: string, objective: string, previousOutput: string = '') {
  console.log(`Starting agent loop for dappGenId: ${dappGenId}`);
  const manager = new ManagerAgent();
  const developer = new DeveloperAgent();
  
  try {
    // Create new GenStep for this iteration
    console.log('Creating new GenStep...');
    const genStep = await prisma.genSteps.create({
      data: {
        genId: dappGenId,
        stepNumber: await getNextStepNumber(dappGenId),
        status: 'RUNNING',
        startDateTime: new Date(),
        classification: 'agent_execution',
        stepNotes: 'Processing agent action',
      },
    });
    console.log(`Created GenStep with ID: ${genStep.id}`);

    // Get next instruction from manager
    console.log('Getting next instruction from manager...');
    const instruction = await manager.getNextAction(objective, previousOutput);
    console.log('Manager instruction:', instruction);
    
    // Log manager's instruction in Messages
    console.log('Logging manager message...');
    await prisma.messages.create({
      data: {
        genId: dappGenId,
        content: instruction,
        role: 'manager'
      }
    });

    // Get terminal commands from developer
    console.log('Getting terminal commands from developer...');
    const terminalCommands = await developer.executeInstruction(instruction);
    console.log('Developer commands:', terminalCommands);
    
    // Replace the interactive create-next-app command with a non-interactive version
    const modifiedCommands = terminalCommands.replace(
      'npx create-next-app@latest my-app',
      'npx create-next-app@latest my-app --typescript=false --tailwind=false --eslint=false --app=false --src-dir=false --import-alias="@/*" --use-npm'
    );
    
    // Split commands and clean them up
    const commandsArray = modifiedCommands
      .split('&&')
      .map(cmd => cmd.trim().replace(/\\\n/g, ''))
      .filter(cmd => cmd.length > 0);
    
    console.log('Executing commands separately:', commandsArray);
    
    let output = '';
    for (const command of commandsArray) {
      console.log(`Executing command: ${command}`);
      try {
        const commandOutput = await executeAction(command);
        output += `\n${commandOutput}`;
        console.log(`Command output: ${commandOutput}`);
      } catch (error) {
        console.error(`Error executing command ${command}:`, error);
        output += `\nError executing command: ${error.message}`;
      }
    }

    // Add a delay between commands to ensure proper sequencing
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Classify the output
    console.log('Classifying output...');
    const classification = await manager.classify(output);
    console.log('Classification:', classification);
    
    // Update GenStep with results
    await prisma.genSteps.update({
      where: { id: genStep.id },
      data: {
        status: 'COMPLETED',
        output: output,
        terminalCommands: terminalCommands,
        classification: classification,
        endDateTime: new Date(),
      },
    });

    // Log the execution output in Messages
    await prisma.messages.create({
      data: {
        genId: dappGenId,
        content: output,
        role: 'system'
      }
    });

    // Evaluate the result
    console.log('Evaluating result...');
    const evaluation = await manager.evaluate(output, objective);
    console.log('Evaluation result:', evaluation);

    // Continue loop or complete based on evaluation
    if (evaluation.success) {
      console.log('Evaluation successful, continuing loop...');
      await new Promise(resolve => setTimeout(resolve, 1000));
      return processAgentLoop(dappGenId, objective, output);
    } else {
      console.log('Evaluation complete, finishing process...');
      await prisma.dappGen.update({
        where: { id: dappGenId },
        data: {
          status: 'COMPLETED'
        },
      });
    }

  } catch (error) {
    console.error('Agent loop error:', error);
    console.log('Updating DappGen status to ERROR...');
    await prisma.dappGen.update({
      where: { id: dappGenId },
      data: {
        status: 'ERROR'
      },
    });
  }
}

async function getNextStepNumber(dappGenId: string): Promise<number> {
  const lastStep = await prisma.genSteps.findFirst({
    where: { genId: dappGenId },
    orderBy: { stepNumber: 'desc' },
  });
  return (lastStep?.stepNumber ?? 0) + 1;
}

async function executeAction(action: string): Promise<string> {
  // Check for development server commands
  if (action.includes('npm run dev') || action.includes('npm start') || action.includes('yarn dev')) {
    if (process.platform !== 'darwin') {
      return 'Opening dev server in new terminal is only supported on macOS';
    }

    const terminalCommand = `osascript -e 'tell app "Terminal" to do script "cd ${process.cwd()} && ${action}"'`;
    console.log(`Opening dev server in new terminal: ${terminalCommand}`);
    
    return new Promise((resolve, reject) => {
      exec(terminalCommand, (error, stdout, stderr) => {
        console.log('stdout, stderr', stdout, stderr);
        
        if (error) {
          console.error('Error opening dev server:', error);
          reject(error);
        }
        resolve('Development server started in new terminal window');
      });
    });
  }

  // For non-dev server commands, execute normally
  return new Promise((resolve, reject) => {
    exec(action, {
      timeout: 60000,
      maxBuffer: 1024 * 1024 * 10
    }, (error, stdout, stderr) => {
      if (error) {
        reject(error);
      }
      resolve(stdout || stderr);
    });
  });
}

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