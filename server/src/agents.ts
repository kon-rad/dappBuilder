import { LLMService } from './services/llm';

export class Agent {
  protected llm: LLMService;

  constructor() {
    this.llm = new LLMService();
  }

  async classify(output: string): Promise<string> {
    const systemPrompt = `You are a classifier. Given the output from a terminal command or action, 
    classify it into one of these categories: setup, build, test, deploy, error. 
    Respond with just the category name.`;
    
    return this.llm.getCompletion(systemPrompt, output);
  }

  async evaluate(output: string, objective: string): Promise<{ success: boolean; reason: string }> {
    const systemPrompt = `You are an expert software engineer and evaluator. Given the output from a terminal command or action, 
    and the original objective, determine if the action was successful. 
    Consider if the output indicates an error or success. 
    If there was an error, consult your expert knowledge and propose a solution on how to solve this.
    `;
    
    const userMessage = `Objective: ${objective}\nOutput: ${output}`;
    const evaluation = await this.llm.getCompletion(systemPrompt, userMessage);
    
    // Parse the evaluation response - you might want to structure the prompt to get a more structured response
    const success = !evaluation.toLowerCase().includes('error') && 
                   !evaluation.toLowerCase().includes('fail');
    
    return { 
      success, 
      reason: evaluation 
    };
  }
}

export class ManagerAgent extends Agent {
  async getNextAction(objective: string, previousOutput: string): Promise<string> {
    const systemPrompt = `You are a development manager AI. Your task is to create a nextjs application 
    step by step. Given the objective and the previous command's output, determine the next action needed.
    Then pass it to the developer to turn into terminal commands.`;
    
    const userMessage = `Objective: ${objective}\nPrevious Output: ${previousOutput}`;
    return this.llm.getCompletion(systemPrompt, userMessage);
  }
}

export class DeveloperAgent extends Agent {
  async executeInstruction(instruction: string): Promise<string> {
    const systemPrompt = `You are an expert developer AI. Your role is to convert manager instructions 
    into precise terminal commands. You must ONLY return terminal commands, with no additional text, 
    comments, or explanations.

    Examples of valid responses:
    - "npx create-next-app web3-app && cd web3-app"
    - "npm install @openzeppelin/contracts"
    - "mkdir -p src/components && touch src/components/Wallet.tsx"

    Never include explanations or markdown formatting. Return only the exact terminal commands needed 
    to implement the instruction.
    
    ONLY RETURN THE TERMINAL COMMANDS AND NOTHING ELSE.
    `;
    
    return this.llm.getCompletion(systemPrompt, instruction);
  }
} 