#!/bin/bash
set -e

# Print message
echo "Building CycleBuddy Stellar contracts..."

# Install Rust if not already installed
if ! command -v rustc &> /dev/null; then
    echo "Rust not found! Installing Rust..."
    curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
    source "$HOME/.cargo/env"
fi

# Install wasm target if not already installed
if ! rustup target list --installed | grep wasm32-unknown-unknown &> /dev/null; then
    echo "Installing wasm32-unknown-unknown target..."
    rustup target add wasm32-unknown-unknown
fi

# Install soroban-cli if not already installed
if ! command -v soroban &> /dev/null; then
    echo "Installing soroban-cli..."
    cargo install --locked soroban-cli
fi

# Build each contract
echo "Building contracts..."

cd contracts

# Build registry contract
echo "Building registry contract..."
cd registry
cargo build --target wasm32-unknown-unknown --release
cd ..

# Build auth contract
echo "Building auth contract..."
cd auth
cargo build --target wasm32-unknown-unknown --release
cd ..

# Build data contract
echo "Building data contract..."
cd data
cargo build --target wasm32-unknown-unknown --release
cd ..

# Build community contract
echo "Building community contract..."
cd community
cargo build --target wasm32-unknown-unknown --release
cd ..

# Create wasm directory if it doesn't exist
mkdir -p ../wasm

# Copy the compiled contracts to the wasm directory
echo "Copying contracts to wasm directory..."
cp registry/target/wasm32-unknown-unknown/release/cyclebuddy_registry_contract.wasm ../wasm/registry.wasm
cp auth/target/wasm32-unknown-unknown/release/cyclebuddy_auth_contract.wasm ../wasm/auth.wasm
cp data/target/wasm32-unknown-unknown/release/cyclebuddy_data_contract.wasm ../wasm/data.wasm
cp community/target/wasm32-unknown-unknown/release/cyclebuddy_community_contract.wasm ../wasm/community.wasm

echo "Contracts built successfully!"

# Return to the root directory
cd ..

# Make the script executable
chmod +x scripts/deploy-contracts.sh

echo "Build completed. You can deploy the contracts with scripts/deploy-contracts.sh" 