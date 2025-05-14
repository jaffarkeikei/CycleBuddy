#!/bin/bash
set -e

echo "CycleBuddy - Stellar Contract Deployment (Using Soroban Token Contracts)"
echo "======================================================="
echo ""

# Check if stellar CLI is installed
if ! command -v stellar &> /dev/null; then
    echo "Error: stellar CLI is not installed. Please install it first."
    echo "Installation instructions: https://developers.stellar.org/docs/tools/developer-tools/stellar-cli"
    exit 1
fi

# Activate testnet network
stellar network use testnet
echo "Using Stellar testnet..."

# Use the provided address
USER_PUBLIC_KEY="GBUKOFF6FX6767LKKOD3P7KAS43I3Z7CNUBPCH33YZKPPR53ZDHAHCER"
echo "Using Stellar address: $USER_PUBLIC_KEY"

echo ""
echo "Deploying token contract from Soroban examples..."

# Download the token contract WASM file if not present
TOKEN_WASM="soroban_token_contract.wasm"
if [ ! -f "$TOKEN_WASM" ]; then
    echo "Downloading the Soroban token contract..."
    curl -sL https://github.com/stellar/soroban-examples/raw/main/token/target/wasm32-unknown-unknown/release/soroban_token_contract.wasm -o $TOKEN_WASM
fi

# Deploy token contracts for each of our modules using the official token contract
echo "Deploying Registry contract (using token)..."
REGISTRY_ID=$(stellar contract deploy \
    --wasm $TOKEN_WASM \
    --source $USER_PUBLIC_KEY \
    --network testnet)

echo "Registry Contract ID: $REGISTRY_ID"

echo "Deploying Auth contract (using token)..."
AUTH_ID=$(stellar contract deploy \
    --wasm $TOKEN_WASM \
    --source $USER_PUBLIC_KEY \
    --network testnet)

echo "Auth Contract ID: $AUTH_ID"

echo "Deploying Data contract (using token)..."
DATA_ID=$(stellar contract deploy \
    --wasm $TOKEN_WASM \
    --source $USER_PUBLIC_KEY \
    --network testnet)

echo "Data Contract ID: $DATA_ID"

echo "Deploying Community contract (using token)..."
COMMUNITY_ID=$(stellar contract deploy \
    --wasm $TOKEN_WASM \
    --source $USER_PUBLIC_KEY \
    --network testnet)

echo "Community Contract ID: $COMMUNITY_ID"

# Create .env file with contract addresses
echo ""
echo "Creating .env file with contract addresses..."
cat > .env << EOL
VITE_STELLAR_NETWORK=testnet
VITE_STELLAR_RPC_URL=https://soroban-testnet.stellar.org
VITE_HORIZON_URL=https://horizon-testnet.stellar.org
VITE_REGISTRY_CONTRACT_ID=$REGISTRY_ID
VITE_AUTH_CONTRACT_ID=$AUTH_ID
VITE_DATA_CONTRACT_ID=$DATA_ID
VITE_COMMUNITY_CONTRACT_ID=$COMMUNITY_ID
VITE_RP_ID=localhost
VITE_RP_NAME=CycleBuddy
VITE_RP_ORIGIN=http://localhost:3000
# Added simulation mode flag for local testing
VITE_SIMULATION_MODE=true
EOL

echo ""
echo "Deployment complete! Contract IDs have been saved to .env file."
echo "Registry Contract ID: $REGISTRY_ID"
echo "Auth Contract ID: $AUTH_ID"
echo "Data Contract ID: $DATA_ID"
echo "Community Contract ID: $COMMUNITY_ID"
echo ""
echo "These token contracts are placeholders. Replace with real contracts when they're ready."
echo "To use these contracts with the app, restart the application with: npm run dev"
echo ""
echo "IMPORTANT: Simulation mode is enabled in .env for local testing without actual blockchain."
echo "Set VITE_SIMULATION_MODE=false when you're ready to use real contracts." 