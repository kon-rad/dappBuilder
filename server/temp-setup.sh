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
update_contract() {
          local contract_path="packages/snfoundry/contracts/src/YourContract.cairo"
          echo -e "${YELLOW}Updating smart contract with AI generated content...${NC}"
          
          cat << 'EOF' > "$contract_path"
#[starknet::interface]
pub trait ITicTacToe {
    fn get_board(self: @ContractState) -> [felt252; 9];
    fn get_scores(self: @ContractState) -> (u256, u256);
    fn make_move(ref self: ContractState, position: felt252, player: felt252);
    fn reset_game(ref self: ContractState);
}

#[starknet::contract]
mod TicTacToe {
    use openzeppelin_access::ownable::OwnableComponent;
    use starknet::storage::Map;
    use starknet::{ContractAddress, contract_address_const};
    use starknet::{get_caller_address, get_contract_address};
    use super::{ITicTacToe};

    component!(path: OwnableComponent, storage: ownable, event: OwnableEvent);

    #[abi(embed_v0)]
    impl OwnableImpl = OwnableComponent::OwnableImpl<ContractState>;
    impl OwnableInternalImpl = OwnableComponent::InternalImpl<ContractState>;

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        #[flat]
        OwnableEvent: OwnableComponent::Event,
        MoveMade: MoveMade,
        GameReset: GameReset,
    }

    #[derive(Drop, starknet::Event)]
    struct MoveMade {
        #[key]
        player: felt252,
        #[key]
        position: felt252,
    }

    #[derive(Drop, starknet::Event)]
    struct GameReset {
        #[key]
        player: felt252,
    }

    #[storage]
    struct Storage {
        board: [felt252; 9],
        scores: (u256, u256),
        current_player: felt252,
        game_over: bool,
        #[substorage(v0)]
        ownable: OwnableComponent::Storage,
    }

    #[constructor]
    fn constructor(ref self: ContractState, owner: ContractAddress) {
        self.board = [0; 9];
        self.scores = (0, 0);
        self.current_player = 1;
        self.game_over = false;
        self.ownable.initializer(owner);
    }

    #[abi(embed_v0)]
    impl ITicTacToeImpl of ITicTacToe<ContractState> {
        fn get_board(self: @ContractState) -> [felt252; 9] {
            self.board
        }
        fn get_scores(self: @ContractState) -> (u256, u256) {
            self.scores
        }
        fn make_move(ref self: ContractState, position: felt252, player: felt252) {
            assert!(!self.game_over);
            assert!(player == self.current_player);
            assert!(position >= 0 && position < 9);
            assert!(self.board[position as usize] == 0);
            self.board[position as usize] = player;
            self.emit(MoveMade { player, position });
            self.check_game_over();
            self.current_player = if player == 1 { 2 } else { 1 };
        }
        fn reset_game(ref self: ContractState) {
            self.board = [0; 9];
            self.game_over = false;
            self.current_player = 1;
            self.emit(GameReset { player: 0 });
        }
    }

    fn check_game_over(ref self: ContractState) {
        let winning_combinations = [
            [0, 1, 2],
            [3, 4, 5],
            [6, 7, 8],
            [0, 3, 6],
            [1, 4, 7],
            [2, 5, 8],
            [0, 4, 8],
            [2, 4, 6],
        ];
        for combination in winning_combinations {
            if self.board[combination[0] as usize] != 0
                && self.board[combination[0] as usize] == self.board[combination[1] as usize]
                && self.board[combination[0] as usize] == self.board[combination[2] as usize]
            {
                self.game_over = true;
                if self.board[combination[0] as usize] == 1 {
                    self.scores.0 += 1;
                } else {
                    self.scores.1 += 1;
                }
                return;
            }
        }
        if self.board.iter().all(|x| *x != 0) {
            self.game_over = true;
        }
    }
}
EOF
          
          if [ ! -f "$contract_path" ]; then
              echo -e "${RED}Failed to update contract file${NC}"
              exit 1
          fi
        }

        update_ui() {
    local page_path="packages/nextjs/app/page.tsx"
    echo -e "${YELLOW}Updating UI with AI generated content...${NC}"
    
    # Create new page.tsx content with AI_GENERATED_CONTENT placeholder
    cat << 'EOF' > "$page_path"
import Link from "next/link";
import Image from "next/image";
import { ConnectedAddress } from "~~/components/ConnectedAddress";

const Home = () => {
  const handleSquareClick = (index: number) => {
    console.log(`Square ${index} clicked`);
  };

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
        <div className="flex justify-center items-center">
          <div className="text-3xl font-bold mr-10">User Score: 0</div>
          <div className="grid grid-cols-3 gap-4 w-96 h-96">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((index) => (
              <div
                key={index}
                className="bg-gray-200 hover:bg-gray-300 p-10 flex justify-center items-center cursor-pointer"
                onClick={() => handleSquareClick(index)}
              >
                {index}
              </div>
            ))}
          </div>
          <div className="text-3xl font-bold ml-10">Computer Score: 0</div>
        </div>
      </div>
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