#!/bin/bash
set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=======================================${NC}"
echo -e "${BLUE}   CycleBuddy Bahamut Deployment Tool  ${NC}"
echo -e "${BLUE}=======================================${NC}"

# Check if .env file exists in the contracts/bahamut directory
if [ ! -f "contracts/bahamut/.env" ]; then
    echo -e "${YELLOW}Warning: No .env file found in contracts/bahamut directory.${NC}"
    echo -e "${YELLOW}Please create it based on the .env.example template.${NC}"
    echo -e "${YELLOW}Would you like to create a basic .env file now? (y/n)${NC}"
    read answer
    if [ "$answer" = "y" ] || [ "$answer" = "Y" ]; then
        echo "Creating basic .env file..."
        echo -e "# Add your private key here (without 0x prefix)\nPRIVATE_KEY=\n\n# Bahamut RPC URLs\nBAHAMUT_RPC_URL=https://testnet.rpc.bahamut.io\nBAHAMUT_MAINNET_RPC_URL=https://rpc.bahamut.io\n\n# Bahamut Explorer API Key\nBAHAMUT_API_KEY=" > contracts/bahamut/.env
        echo -e "${GREEN}Basic .env file created. Please edit it to add your private key.${NC}"
        exit 1
    else
        echo -e "${RED}Deployment aborted. Please create a .env file first.${NC}"
        exit 1
    fi
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}Error: Node.js is not installed.${NC}"
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo -e "${RED}Error: npm is not installed.${NC}"
    exit 1
fi

# Print which network we're deploying to
if [ "$1" = "mainnet" ]; then
    echo -e "${YELLOW}You are about to deploy to MAINNET.${NC}"
    echo -e "${YELLOW}This is a PRODUCTION environment. Are you sure? (y/n)${NC}"
    read answer
    if [ "$answer" = "y" ] || [ "$answer" = "Y" ]; then
        echo -e "${YELLOW}MAINNET deployment confirmed.${NC}"
        NETWORK="bahamutMainnet"
    else
        echo -e "${GREEN}Deployment aborted.${NC}"
        exit 0
    fi
else
    echo -e "${GREEN}Deploying to Bahamut TESTNET.${NC}"
    NETWORK="bahamut"
fi

# Check required dependencies
echo -e "${BLUE}Checking dependencies...${NC}"
cd contracts/bahamut
npm install

# Compile contracts
echo -e "${BLUE}Compiling contracts...${NC}"
npx hardhat compile

if [ $? -ne 0 ]; then
    echo -e "${RED}Compilation failed. Please fix the errors and try again.${NC}"
    exit 1
fi

# Run tests
echo -e "${BLUE}Running tests...${NC}"
npx hardhat test

if [ $? -ne 0 ]; then
    echo -e "${RED}Tests failed. Please fix the errors and try again.${NC}"
    exit 1
fi

# Deploy contracts
echo -e "${BLUE}Deploying contracts to ${NETWORK}...${NC}"
npx hardhat run scripts/deploy.js --network $NETWORK

if [ $? -ne 0 ]; then
    echo -e "${RED}Deployment failed. Please check the error messages.${NC}"
    exit 1
fi

echo -e "${GREEN}Deployment completed successfully!${NC}"
echo -e "${YELLOW}Contract addresses have been saved to contracts/bahamut/deployed-addresses.json${NC}"

# Verify contracts on explorer (if not on local network)
if [ "$NETWORK" != "localhost" ] && [ "$NETWORK" != "hardhat" ]; then
    echo -e "${BLUE}Would you like to verify contracts on the explorer? (y/n)${NC}"
    read verify_answer
    if [ "$verify_answer" = "y" ] || [ "$verify_answer" = "Y" ]; then
        # Get deployed addresses
        ADDRESSES_FILE="deployed-addresses.json"
        if [ -f "$ADDRESSES_FILE" ]; then
            TOKEN_ADDRESS=$(cat $ADDRESSES_FILE | grep -o '"CycleStreakToken": *"[^"]*"' | grep -o '"[^"]*"$' | tr -d '"')
            REWARDS_ADDRESS=$(cat $ADDRESSES_FILE | grep -o '"DailyRewards": *"[^"]*"' | grep -o '"[^"]*"$' | tr -d '"')
            
            echo -e "${BLUE}Verifying CycleStreakToken at ${TOKEN_ADDRESS}...${NC}"
            npx hardhat verify --network $NETWORK $TOKEN_ADDRESS
            
            echo -e "${BLUE}Verifying DailyRewards at ${REWARDS_ADDRESS}...${NC}"
            npx hardhat verify --network $NETWORK $REWARDS_ADDRESS $TOKEN_ADDRESS
        else
            echo -e "${RED}Could not find deployed addresses file.${NC}"
            exit 1
        fi
    fi
fi

echo -e "${GREEN}Deployment process completed!${NC}"
cd ../..

# Update environment variables for the application
if [ -f ".env" ]; then
    echo -e "${BLUE}Updating application .env file with contract addresses...${NC}"
    # Check if REACT_APP_BAHAMUT_TOKEN_ADDRESS already exists in .env
    if grep -q "REACT_APP_BAHAMUT_TOKEN_ADDRESS" .env; then
        # Update existing values
        sed -i '' "s|REACT_APP_BAHAMUT_TOKEN_ADDRESS=.*|REACT_APP_BAHAMUT_TOKEN_ADDRESS=$TOKEN_ADDRESS|g" .env
        sed -i '' "s|REACT_APP_BAHAMUT_REWARDS_ADDRESS=.*|REACT_APP_BAHAMUT_REWARDS_ADDRESS=$REWARDS_ADDRESS|g" .env
    else
        # Add new values
        echo -e "\n# Bahamut Contract Addresses" >> .env
        echo "REACT_APP_BAHAMUT_TOKEN_ADDRESS=$TOKEN_ADDRESS" >> .env
        echo "REACT_APP_BAHAMUT_REWARDS_ADDRESS=$REWARDS_ADDRESS" >> .env
    fi
    echo -e "${GREEN}Environment variables updated.${NC}"
fi

echo -e "${GREEN}All done! You can now use the Bahamut rewards system.${NC}" 