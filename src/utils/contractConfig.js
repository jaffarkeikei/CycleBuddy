/**
 * Contract configuration utility for CycleBuddy
 * Provides contract IDs for the application's smart contracts
 */

// Default simulated contract IDs (for development without blockchain)
const SIMULATED_CONTRACT_IDS = {
  registryId: 'C1BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB',
  authId: 'C2BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB',
  dataId: 'C3BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB',
  communityId: 'C4BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB',
};

/**
 * Configuration for contract connectivity
 * @typedef {Object} ContractConfig
 * @property {boolean} useSimulation - Whether to use simulated contracts
 * @property {string} network - Network to connect to ('testnet', 'mainnet', 'local')
 */

/**
 * Get contract IDs for the application
 * @param {ContractConfig} config - Configuration options
 * @returns {Object} Object with contract IDs
 */
export const getContractIds = async (config = { useSimulation: true, network: 'testnet' }) => {
  // In simulation mode, use the simulated IDs
  if (config.useSimulation) {
    console.log('Using simulated contract IDs for development');
    return SIMULATED_CONTRACT_IDS;
  }

  try {
    // In production, load from actual deployed contracts
    // This would typically involve fetching from some API or a locally stored config
    // For now, we're using mock data
    if (config.network === 'testnet') {
      // These would normally be fetched from .soroban/deployed/
      return SIMULATED_CONTRACT_IDS;
    }

    throw new Error(`Network '${config.network}' not supported`);
  } catch (error) {
    console.error('Error loading contract IDs:', error);
    // Fall back to simulated IDs if there's an error
    return SIMULATED_CONTRACT_IDS;
  }
};

/**
 * Initialize the blockchain clients with the proper contract IDs
 * @param {Object} sdk - The Stellar SDK or client library
 * @param {ContractConfig} config - Configuration options
 * @returns {Object} Object with initialized contract clients
 */
export const initializeContracts = async (sdk, config = { useSimulation: true, network: 'testnet' }) => {
  const contractIds = await getContractIds(config);

  // If in simulation mode and no SDK provided, return mock contract clients
  if (config.useSimulation && !sdk) {
    return {
      registryClient: createMockClient('registry'),
      authClient: createMockClient('auth'),
      dataClient: createMockClient('data'),
      communityClient: createMockClient('community'),
      contractIds,
    };
  }

  // If SDK is provided, create real clients
  if (sdk) {
    return {
      registryClient: new sdk.RegistryClient(contractIds.registryId),
      authClient: new sdk.AuthClient(contractIds.authId),
      dataClient: new sdk.DataClient(contractIds.dataId),
      communityClient: new sdk.CommunityClient(contractIds.communityId),
      contractIds,
    };
  }

  throw new Error('SDK required for non-simulation mode');
};

/**
 * Create a mock client for simulation mode
 * @param {string} type - The type of client to create
 * @returns {Object} A mock client object
 */
function createMockClient(type) {
  // Implement basic mock functionality based on the contract type
  const mockFunctions = {
    registry: {
      initialize: async () => true,
      registerUser: async () => true,
      isRegistered: async () => true,
      getUsers: async () => [],
    },
    auth: {
      registerPasskey: async () => true,
      generateChallenge: async () => Math.floor(Math.random() * 1000000),
      addRecoveryKey: async () => true,
    },
    data: {
      storeData: async () => 'mock-data-id-' + Math.random().toString(36).substring(2, 9),
      getData: async () => ({ encrypted_content: 'mock-data', timestamp: Date.now() }),
      listData: async () => [],
      grantAccess: async () => true,
    },
    community: {
      createPost: async () => 'mock-post-id-' + Math.random().toString(36).substring(2, 9),
      getPosts: async () => [],
      vote: async () => true,
    },
  };

  return mockFunctions[type] || {};
}

// Export configuration
export const defaultConfig = {
  useSimulation: true,  // Default to simulation mode for safer development
  network: 'testnet',
}; 