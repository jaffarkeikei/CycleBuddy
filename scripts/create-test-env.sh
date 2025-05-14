#!/bin/bash
set -e

echo "CycleBuddy - Creating Test Environment with Simulated Contract IDs"
echo "=================================================================="
echo ""

# Generate random-looking contract IDs
generate_id() {
    # Generate a 56-character random ID that looks like a Stellar contract ID
    LC_ALL=C tr -dc 'A-Z0-9' < /dev/urandom | head -c 56
}

# Generate contract IDs for each contract
REGISTRY_ID=$(generate_id)
AUTH_ID=$(generate_id)
DATA_ID=$(generate_id)
COMMUNITY_ID=$(generate_id)

# Display the generated contract IDs
echo "Generated simulated contract IDs for testing:"
echo "Registry Contract ID: $REGISTRY_ID"
echo "Auth Contract ID: $AUTH_ID"
echo "Data Contract ID: $DATA_ID"
echo "Community Contract ID: $COMMUNITY_ID"

# Create .env file with simulated contract addresses
echo ""
echo "Creating .env file with simulated contract addresses..."
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
# Enabled simulation mode for local testing
VITE_SIMULATION_MODE=true
EOL

echo ""
echo "Test environment setup complete! Simulated contract IDs have been saved to .env file."
echo ""
echo "IMPORTANT: This setup is only for local testing with simulation mode enabled."
echo "Your app will run in simulation mode without connecting to the actual blockchain."
echo "To use these simulated contracts with the app, restart the application with: npm run dev" 