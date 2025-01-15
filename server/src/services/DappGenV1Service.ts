import { exec } from 'child_process';
import Together from "together-ai";
import fs from 'fs/promises';
import path from 'path';

export class DappGenV1Service {
  private readonly together: Together;
  private readonly setupScript = `#!/bin/bash
# Exit on error
set -e

# Color codes for output
RED='\\x1b[0;31m'
GREEN='\\x1b[0;32m'
YELLOW='\\x1b[1;33m'
NC='\\x1b[0m' # No Color

# Required environment variables
required_vars=(
    "VERCEL_TOKEN"
)

# Function to check if required environment variables are set
check_env_vars() {
    local missing_vars=()
    for var in "\${required_vars[@]}"; do
        if [[ -z "\${!var}" ]]; then
            missing_vars+=("$var")
        fi
    done
    
    if [[ \${#missing_vars[@]} -ne 0 ]]; then
        echo -e "\${RED}Error: Missing required environment variables:\${NC}"
        printf '%s\\n' "\${missing_vars[@]}"
        exit 1
    fi
}

# Function to check if required tools are installed
check_dependencies() {
    local missing_deps=()
    local deps=("git" "node" "yarn" "vercel")
    
    for dep in "\${deps[@]}"; do
        if ! command -v "$dep" &> /dev/null; then
            missing_deps+=("$dep")
        fi
    done
    
    if [[ \${#missing_deps[@]} -ne 0 ]]; then
        echo -e "\${RED}Error: Missing required dependencies:\${NC}"
        printf '%s\\n' "\${missing_deps[@]}"
        exit 1
    fi
}

# Function to clone and setup repository
setup_repository() {
    local repo_name="$1"
    echo -e "\${YELLOW}Cloning repository...\${NC}"
    
    if [ -d "$repo_name" ]; then
        echo -e "\${RED}Directory $repo_name already exists\${NC}"
        exit 1
    fi
    
    git clone git@github.com:Scaffold-Stark/scaffold-stark-2.git "$repo_name"
    cd "$repo_name"
    
    # Modify scaffold config
    echo -e "\${YELLOW}Modifying scaffold configuration...\${NC}"
    sed -i '' 's/targetNetworks: \\[chains.devnet\\]/targetNetworks: \\[chains.sepolia\\]/' packages/nextjs/scaffold.config.ts
}

# Function to update page.tsx with new UI
update_ui() {
    local page_path="packages/nextjs/app/page.tsx"
    echo -e "\${YELLOW}Updating UI with AI generated content...\${NC}"
    
    # Create new page.tsx content with AI_GENERATED_CONTENT placeholder
    echo "$AI_GENERATED_CONTENT" > "$page_path"
    
    # Verify the file was updated
    if [ ! -f "$page_path" ]; then
        echo -e "\${RED}Failed to update UI file\${NC}"
        exit 1
    fi
}

# Function to deploy to Vercel
deploy_to_vercel() {
    local repo_name="$1"
    
    echo -e "\${YELLOW}Installing root dependencies...\${NC}"
    yarn install
    
    echo -e "\${YELLOW}Installing NextJS package dependencies...\${NC}"
    cd packages/nextjs
    yarn install
    
    echo -e "\${YELLOW}Deploying NextJS package to Vercel...\${NC}"
    # First, link the project to Vercel
    vercel link --confirm --yes --token "$VERCEL_TOKEN"
    
    # Then deploy
    vercel deploy --prod --yes \
        --token "$VERCEL_TOKEN" \
        --cwd . \
        --build-env NEXT_PUBLIC_IGNORE_BUILD_ERROR=true \
        --public
}

main() {
    local repo_name="\${1:-scaffold-stark-demo}"
    
    echo -e "\${YELLOW}Starting deployment process...\${NC}"
    
    # Check prerequisites
    check_dependencies
    check_env_vars
    
    # Execute deployment steps
    setup_repository "$repo_name"
    update_ui
    deploy_to_vercel "$repo_name"
    
    echo -e "\${GREEN}Deployment completed successfully!\${NC}"
}

# Execute main function with provided arguments
main "$@"`;

  constructor() {
    this.together = new Together({
      apiKey: process.env.TOGETHER_API_KEY
    });
  }

  async generateIndexContent(prompt: string): Promise<string> {
    const systemPrompt = `You are an expert Next.js developer. Modify the following existing page.tsx file based on the user's prompt.
    
    IMPORTANT REQUIREMENTS:
    - Keep the following elements unchanged:
      * The entire top section with "Welcome to Scaffold-Stark 2"
      * The <ConnectedAddress /> component
      * The existing imports at the top of the file
    - Your task is to only modify the content inside the <div className="bg-container"> section
    - Define any new components within the same file
    - Do not add any new imports
    - Return the complete file content without any markdown formatting
    
    EXISTING FILE STRUCTURE TO PRESERVE:
    \`\`\`
    import Link from "next/link";
    import Image from "next/image";
    import { ConnectedAddress } from "~~/components/ConnectedAddress";

    const Home = () => {
      return (
        <div className="flex items-center flex-col flex-grow pt-10">
          <div className="px-5">
            <h1 className="text-center">
              <span className="block text-2xl mb-2">Welcome to</span>
              <span className="block text-4xl font-bold">Scaffold-Stark 2</span>
            </h1>
            <ConnectedAddress />
            <p className="text-center text-lg">
              Edit your smart contract{" "}
              <code className="bg-underline italic text-base font-bold max-w-full break-words break-all inline-block">
                YourContract.cairo
              </code>{" "}
              in{" "}
              <code className="bg-underline italic text-base font-bold max-w-full break-words break-all inline-block">
                packages/snfoundry/contracts/src
              </code>
            </p>
          </div>

          <div className="bg-container flex-grow w-full mt-16 px-8 py-12">
            // MODIFY ONLY THIS SECTION BASED ON THE PROMPT
          </div>
        </div>
      );
    };

    export default Home;
    \`\`\`

    Return ONLY the TypeScript/JSX code without any markdown formatting or code fence blocks.`;

    try {
      const response = await this.together.chat.completions.create({
        model: "meta-llama/Llama-3.3-70B-Instruct-Turbo",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: prompt }
        ],
      });

      if (!response.choices?.[0]?.message?.content) {
        throw new Error('No content generated');
      }

      // More thorough cleaning of the response
      let content = response.choices[0].message.content;
      
      // Remove any markdown code block indicators
      content = content.replace(/```typescript\s*/, '');
      content = content.replace(/```tsx\s*/, '');
      content = content.replace(/```javascript\s*/, '');
      content = content.replace(/```jsx\s*/, '');
      content = content.replace(/```\s*$/, '');
      
      // Remove any leading/trailing whitespace
      content = content.trim();

      // Validate the content structure
      if (!content.startsWith('import')) {
        throw new Error('Invalid response: Must start with imports');
      }

      if (!content.includes('ConnectedAddress')) {
        throw new Error('Invalid response: Must include ConnectedAddress component');
      }

      if (!content.includes('export default Home')) {
        throw new Error('Invalid response: Must include export default Home');
      }

      console.log('Cleaned content:');
      console.log('----------------------------------------');
      console.log(content);
      console.log('----------------------------------------');

      return content;
    } catch (error) {
      console.error('Error in AI generation:', error);
      throw error;
    }
  }

  async executeSetupScript(indexContent: string): Promise<string> {
    // Create temporary script file
    const scriptPath = path.join(process.cwd(), 'temp-setup.sh');
    
    // Create a modified script content with the AI content directly embedded
    const scriptContent = this.setupScript.replace(
      'echo "$AI_GENERATED_CONTENT" > "$page_path"',
      `cat << 'EOF' > "$page_path"
${indexContent}
EOF`
    );

    try {
      console.log('Creating setup script at:', scriptPath);
      await fs.writeFile(scriptPath, scriptContent);
      await fs.chmod(scriptPath, '0755');
      console.log('Script file created and permissions set');

      // Execute script
      return new Promise((resolve, reject) => {
        console.log('Executing setup script...');
        const childProcess = exec(scriptPath, {
          env: { 
            ...process.env,
          },
          timeout: 600000, // 10 minutes
          maxBuffer: 1024 * 1024 * 10
        });

        // Stream stdout in real-time
        childProcess.stdout?.on('data', (data) => {
          console.log(`Script output: ${data}`);
        });

        // Stream stderr in real-time
        childProcess.stderr?.on('data', (data) => {
          console.error(`Script error: ${data}`);
        });

        childProcess.on('close', (code) => {
          console.log(`Script process exited with code ${code}`);
          if (code !== 0) {
            reject(new Error(`Script exited with code ${code}`));
            return;
          }
          resolve(`Script completed successfully`);
        });

        childProcess.on('error', (error) => {
          console.error('Script execution error:', error);
          reject(error);
        });
      });
    } catch (error) {
      console.error('Error during script execution:', error);
      // Clean up script file in case of error
      await fs.unlink(scriptPath).catch(err => 
        console.error('Error cleaning up script file:', err)
      );
      throw error;
    }
  }
} 