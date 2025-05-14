# CycleBuddy Stellar Contracts Makefile
# Testnet Contract IDs will be displayed after deployment

# Stellar address to use for deployment
STELLAR_ADDRESS = GBUKOFF6FX6767LKKOD3P7KAS43I3Z7CNUBPCH33YZKPPR53ZDHAHCER

# Contract names
CONTRACTS = registry auth data community

# SDK Version
SOROBAN_SDK_VERSION = 20.5.0

.PHONY: build test clean deploy

# Build all contracts
build:
	@echo "Building all contracts..."
	@cd contracts && \
	cargo build --target wasm32-unknown-unknown --release

# Test all contracts
test:
	@echo "Running all tests..."
	@cd contracts && \
	cargo test

# Clean all build artifacts
clean:
	@echo "Cleaning build artifacts..."
	@cd contracts && \
	cargo clean

# Deploy contracts to Soroban testnet (requires soroban CLI to be installed)
deploy: build
	@echo "Deploying contracts to testnet..."
	@mkdir -p .soroban/deployed
	
	@echo "Deploying registry contract..."
	soroban contract deploy \
		--network testnet \
		--source $${SOROBAN_ACCOUNT:-ACCOUNT} \
		--wasm contracts/target/wasm32-unknown-unknown/release/registry_contract.wasm \
		> .soroban/deployed/registry_id.txt
	
	@echo "Deploying auth contract..."
	soroban contract deploy \
		--network testnet \
		--source $${SOROBAN_ACCOUNT:-ACCOUNT} \
		--wasm contracts/target/wasm32-unknown-unknown/release/cyclebuddy_auth_contract.wasm \
		> .soroban/deployed/auth_id.txt
	
	@echo "Deploying data contract..."
	soroban contract deploy \
		--network testnet \
		--source $${SOROBAN_ACCOUNT:-ACCOUNT} \
		--wasm contracts/target/wasm32-unknown-unknown/release/cyclebuddy_data_contract.wasm \
		> .soroban/deployed/data_id.txt
	
	@echo "Deploying community contract..."
	soroban contract deploy \
		--network testnet \
		--source $${SOROBAN_ACCOUNT:-ACCOUNT} \
		--wasm contracts/target/wasm32-unknown-unknown/release/cyclebuddy_community_contract.wasm \
		> .soroban/deployed/community_id.txt
	
	@echo "Contracts deployed to testnet. Contract IDs saved to .soroban/deployed/"

# Generate simulated contract IDs for local development without deployment
setup-dev-env:
	@echo "Setting up development environment with simulated contract IDs..."
	@mkdir -p .soroban/deployed
	
	@# Generate random contract IDs for local development
	@echo "CAUTION: These are simulated contract IDs for development only!"
	@echo "C1BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB" > .soroban/deployed/registry_id.txt
	@echo "C2BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB" > .soroban/deployed/auth_id.txt
	@echo "C3BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB" > .soroban/deployed/data_id.txt
	@echo "C4BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB" > .soroban/deployed/community_id.txt
	
	@echo "Simulated contract IDs created in .soroban/deployed/"
	@echo "Registry ID: $$(cat .soroban/deployed/registry_id.txt)"
	@echo "Auth ID:     $$(cat .soroban/deployed/auth_id.txt)"
	@echo "Data ID:     $$(cat .soroban/deployed/data_id.txt)"
	@echo "Community ID:$$(cat .soroban/deployed/community_id.txt)"

# Call contract initialization (requires deployed contracts)
initialize:
	@echo "Initializing contracts..."
	@[ -f .soroban/deployed/registry_id.txt ] || (echo "Contracts not deployed. Run 'make deploy' first." && exit 1)
	
	@REGISTRY_ID=$$(cat .soroban/deployed/registry_id.txt) && \
	AUTH_ID=$$(cat .soroban/deployed/auth_id.txt) && \
	DATA_ID=$$(cat .soroban/deployed/data_id.txt) && \
	COMMUNITY_ID=$$(cat .soroban/deployed/community_id.txt) && \
	\
	echo "Initializing registry contract..." && \
	soroban contract invoke \
		--network testnet \
		--source $${SOROBAN_ACCOUNT:-ACCOUNT} \
		--id $$REGISTRY_ID \
		-- \
		initialize \
		--owner $${SOROBAN_ACCOUNT:-ACCOUNT} && \
	\
	echo "Initializing auth contract..." && \
	soroban contract invoke \
		--network testnet \
		--source $${SOROBAN_ACCOUNT:-ACCOUNT} \
		--id $$AUTH_ID \
		-- \
		initialize \
		--owner $${SOROBAN_ACCOUNT:-ACCOUNT} && \
	\
	echo "Initializing data contract..." && \
	soroban contract invoke \
		--network testnet \
		--source $${SOROBAN_ACCOUNT:-ACCOUNT} \
		--id $$DATA_ID \
		-- \
		initialize \
		--owner $${SOROBAN_ACCOUNT:-ACCOUNT} \
		--registry_contract $$REGISTRY_ID && \
	\
	echo "Initializing community contract..." && \
	soroban contract invoke \
		--network testnet \
		--source $${SOROBAN_ACCOUNT:-ACCOUNT} \
		--id $$COMMUNITY_ID \
		-- \
		initialize \
		--owner $${SOROBAN_ACCOUNT:-ACCOUNT} \
		--registry_contract $$REGISTRY_ID && \
	\
	echo "Setting contract addresses in registry..." && \
	soroban contract invoke \
		--network testnet \
		--source $${SOROBAN_ACCOUNT:-ACCOUNT} \
		--id $$REGISTRY_ID \
		-- \
		set_auth_contract \
		--auth_contract $$AUTH_ID && \
	\
	soroban contract invoke \
		--network testnet \
		--source $${SOROBAN_ACCOUNT:-ACCOUNT} \
		--id $$REGISTRY_ID \
		-- \
		set_data_contract \
		--data_contract $$DATA_ID && \
	\
	soroban contract invoke \
		--network testnet \
		--source $${SOROBAN_ACCOUNT:-ACCOUNT} \
		--id $$REGISTRY_ID \
		-- \
		set_community_contract \
		--community_contract $$COMMUNITY_ID

# Default target
all: build

update-deps:
	@echo "Updating Soroban SDK dependencies to version $(SOROBAN_SDK_VERSION)..."
	@for contract in $(CONTRACTS); do \
		echo "Updating $$contract contract..."; \
		(cd contracts/$$contract && cargo update -p soroban-sdk) || true; \
	done
	@echo "Dependencies updated!"

fix-contracts: 
	@echo "Fixing contract Cargo.toml files to use compatible SDK version..."
	@for contract in $(CONTRACTS); do \
		echo "Fixing $$contract contract..."; \
		sed -i '' 's/soroban-sdk = ".*"/soroban-sdk = "$(SOROBAN_SDK_VERSION)"/g' contracts/$$contract/Cargo.toml; \
		sed -i '' 's/soroban-sdk = {.*}/soroban-sdk = { version = "$(SOROBAN_SDK_VERSION)", features = ["testutils"] }/g' contracts/$$contract/Cargo.toml; \
	done
	@echo "Contract Cargo.toml files updated!"

optimize: build
	@echo "Optimizing contracts..."
	@for contract in $(CONTRACTS); do \
		echo "Optimizing $$contract contract..."; \
		stellar contract optimize --wasm contracts/$$contract/target/wasm32-unknown-unknown/release/$$contract.wasm; \
	done

deploy-save: optimize
	@echo "Deploying contracts to Stellar testnet and saving IDs to .env..."
	@echo "Using Stellar address: $(STELLAR_ADDRESS)"
	stellar network use testnet
	
	@echo "\nDeploying Registry contract..."
	@REGISTRY_ID=$$(stellar contract deploy --wasm contracts/target/wasm32-unknown-unknown/release/registry_contract.wasm --source $(STELLAR_ADDRESS)); \
	echo "Registry Contract ID: $$REGISTRY_ID"; \
	
	@echo "\nDeploying Auth contract..."
	@AUTH_ID=$$(stellar contract deploy --wasm contracts/target/wasm32-unknown-unknown/release/cyclebuddy_auth_contract.wasm --source $(STELLAR_ADDRESS)); \
	echo "Auth Contract ID: $$AUTH_ID"; \
	
	@echo "\nDeploying Data contract..."
	@DATA_ID=$$(stellar contract deploy --wasm contracts/target/wasm32-unknown-unknown/release/cyclebuddy_data_contract.wasm --source $(STELLAR_ADDRESS)); \
	echo "Data Contract ID: $$DATA_ID"; \
	
	@echo "\nDeploying Community contract..."
	@COMMUNITY_ID=$$(stellar contract deploy --wasm contracts/target/wasm32-unknown-unknown/release/cyclebuddy_community_contract.wasm --source $(STELLAR_ADDRESS)); \
	echo "Community Contract ID: $$COMMUNITY_ID"; \
	
	@echo "\nCreating .env file with contract addresses..."; \
	echo "VITE_STELLAR_NETWORK=testnet" > .env; \
	echo "VITE_STELLAR_RPC_URL=https://soroban-testnet.stellar.org" >> .env; \
	echo "VITE_HORIZON_URL=https://horizon-testnet.stellar.org" >> .env; \
	echo "VITE_REGISTRY_CONTRACT_ID=$$REGISTRY_ID" >> .env; \
	echo "VITE_AUTH_CONTRACT_ID=$$AUTH_ID" >> .env; \
	echo "VITE_DATA_CONTRACT_ID=$$DATA_ID" >> .env; \
	echo "VITE_COMMUNITY_CONTRACT_ID=$$COMMUNITY_ID" >> .env; \
	echo "VITE_RP_ID=localhost" >> .env; \
	echo "VITE_RP_NAME=CycleBuddy" >> .env; \
	echo "VITE_RP_ORIGIN=http://localhost:3000" >> .env; \
	
	@echo "\nDeployment complete! Contract IDs have been saved to .env file."

bindings: build
	@echo "Generating TypeScript bindings..."
	@mkdir -p bindings
	@for contract in $(CONTRACTS); do \
		echo "Generating bindings for $$contract..."; \
		stellar contract bindings typescript \
			--wasm contracts/$$contract/target/wasm32-unknown-unknown/release/$$contract.wasm \
			--output-dir ./bindings/$$contract \
			--overwrite; \
	done

# Set up simulated contract IDs for local testing
setup-test-env:
	@echo "Setting up test environment with simulated contract IDs..."
	@chmod +x scripts/create-test-env.sh
	@./scripts/create-test-env.sh

# Download token contract for deployment
get-token-contract:
	@echo "Downloading Soroban token contract..."
	@curl -sL https://github.com/stellar/soroban-examples/raw/main/token/target/wasm32-unknown-unknown/release/soroban_token_contract.wasm -o soroban_token_contract.wasm
	@echo "Token contract downloaded successfully."

# Deploy using token contract
deploy-token:
	@echo "Deploying using Soroban token contract..."
	@chmod +x scripts/deploy-contracts.sh
	@./scripts/deploy-contracts.sh

fmt:
	cargo fmt --all 