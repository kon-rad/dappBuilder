#!/bin/bash
# Exit on error
set -e

# Color codes for output
RED='\x1b[0;31m'
GREEN='\x1b[0;32m'
YELLOW='\x1b[1;33m'
NC='\x1b[0m' # No Color

# Required environment variables
required_vars=(
    "VERCEL_TOKEN"
)

# Function to check if required environment variables are set
check_env_vars() {
    local missing_vars=()
    for var in "${required_vars[@]}"; do
        if [[ -z "${!var}" ]]; then
            missing_vars+=("$var")
        fi
    done
    
    if [[ ${#missing_vars[@]} -ne 0 ]]; then
        echo -e "${RED}Error: Missing required environment variables:${NC}"
        printf '%s\n' "${missing_vars[@]}"
        exit 1
    fi
}

# Function to check if required tools are installed
check_dependencies() {
    local missing_deps=()
    local deps=("git" "node" "yarn" "vercel")
    
    for dep in "${deps[@]}"; do
        if ! command -v "$dep" &> /dev/null; then
            missing_deps+=("$dep")
        fi
    done
    
    if [[ ${#missing_deps[@]} -ne 0 ]]; then
        echo -e "${RED}Error: Missing required dependencies:${NC}"
        printf '%s\n' "${missing_deps[@]}"
        exit 1
    fi
}

# Function to clone and setup repository
setup_repository() {
    local repo_name="$1"
    echo -e "${YELLOW}Cloning repository...${NC}"
    
    if [ -d "$repo_name" ]; then
        echo -e "${RED}Directory $repo_name already exists${NC}"
        exit 1
    fi
    
    git clone git@github.com:Scaffold-Stark/scaffold-stark-2.git "$repo_name"
    cd "$repo_name"
    
    # Modify scaffold config
    echo -e "${YELLOW}Modifying scaffold configuration...${NC}"
    sed -i '' 's/targetNetworks: \[chains.devnet\]/targetNetworks: \[chains.sepolia\]/' packages/nextjs/scaffold.config.ts
}

# Function to update page.tsx with new UI
update_ui() {
    local page_path="packages/nextjs/app/page.tsx"
    echo -e "${YELLOW}Updating UI with AI generated content...${NC}"
    
    # Create new page.tsx content with AI_GENERATED_CONTENT placeholder
    cat << 'EOF' > "$page_path"
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

      <div className="bg-container flex-grow w-full mt-16 px-8 py-12 flex justify-center items-center">
        <div className="flex w-full justify-center items-center">
          <Opponent side="left" />
          <ChessBoard />
          <Opponent side="right" />
        </div>
      </div>
    </div>
  );
};

const ChessBoard = () => {
  const rows = 8;
  const cols = 8;
  const board = [];

  for (let i = 0; i < rows; i++) {
    const row = [];
    for (let j = 0; j < cols; j++) {
      row.push(`${i},${j}`);
    }
    board.push(row);
  }

  return (
    <div className="chess-board border border-gray-400 w-1/3 h-1/3">
      {board.map((row, rowIndex) => (
        <div key={rowIndex} className="flex">
          {row.map((cell, cellIndex) => (
            <div
              key={cell}
              className={`border border-gray-400 w-12 h-12 ${
                (rowIndex + cellIndex) % 2 === 0 ? "bg-gray-100" : "bg-gray-200"
              }`}
            />
          ))}
        </div>
      ))}
    </div>
  );
};

const Opponent = ({ side }: { side: "left" | "right" }) => {
  return (
    <div className={`opponent ${side} w-1/3 h-1/3 flex justify-center items-center`}>
      <h2 className="text-2xl font-bold">
        {side === "left" ? "Player 1" : "Player 2"}
      </h2>
    </div>
  );
};

export default Home;
EOF
    
    # Verify the file was updated
    if [ ! -f "$page_path" ]; then
        echo -e "${RED}Failed to update UI file${NC}"
        exit 1
    fi
}

# Function to deploy to Vercel
deploy_to_vercel() {
    local repo_name="$1"
    
    echo -e "${YELLOW}Installing root dependencies...${NC}"
    yarn install
    
    echo -e "${YELLOW}Installing NextJS package dependencies...${NC}"
    cd packages/nextjs
    yarn install
    
    echo -e "${YELLOW}Deploying NextJS package to Vercel...${NC}"
    # First, link the project to Vercel
    vercel link --confirm --yes --token "$VERCEL_TOKEN"
    
    # Then deploy
    vercel deploy --prod --yes         --token "$VERCEL_TOKEN"         --cwd .         --build-env NEXT_PUBLIC_IGNORE_BUILD_ERROR=true         --public
}

main() {
    local repo_name="${1:-scaffold-stark-demo}"
    
    echo -e "${YELLOW}Starting deployment process...${NC}"
    
    # Check prerequisites
    check_dependencies
    check_env_vars
    
    # Execute deployment steps
    setup_repository "$repo_name"
    update_ui
    deploy_to_vercel "$repo_name"
    
    echo -e "${GREEN}Deployment completed successfully!${NC}"
}

# Execute main function with provided arguments
main "$@"