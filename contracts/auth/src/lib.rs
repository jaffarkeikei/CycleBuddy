#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, Address, BytesN, Env, Map, Symbol, Vec};

/// Data storage keys
#[derive(Clone)]
#[contracttype]
pub enum DataKey {
    Owner,
    RegistryContract,
    Passkey(Address),
    Nonce(Address),
    RecoveryKey(Address, u32),
    RecoveryKeyCount(Address),
}

/// Types of data that may be signed
#[derive(Clone)]
#[contracttype]
pub enum SignatureType {
    Authentication,
    Transaction,
    Recovery,
}

/// Passkey information
#[derive(Clone)]
#[contracttype]
pub struct Passkey {
    pub public_key: BytesN<32>,
    pub registered_at: u64,
    pub last_used: u64,
}

#[contract]
pub struct AuthContract;

#[contractimpl]
impl AuthContract {
    /// Initialize the contract with registry address
    pub fn initialize(env: Env, owner: Address, registry_contract: Address) -> Result<(), Error> {
        if get_owner(&env).is_some() {
            return Err(Error::AlreadyInitialized);
        }

        owner.require_auth();
        
        // Set owner and registry address
        env.storage().set(&DataKey::Owner, &owner);
        env.storage().set(&DataKey::RegistryContract, &registry_contract);
        
        // Log initialization
        env.events().publish(("initialize", "auth"), owner);
        
        Ok(())
    }
    
    /// Register a passkey for a user
    pub fn register_passkey(
        env: Env, 
        user: Address, 
        public_key: BytesN<32>
    ) -> Result<(), Error> {
        // Check if the user already has a passkey
        if env.storage().has(&DataKey::Passkey(user.clone())) {
            return Err(Error::PasskeyAlreadyExists);
        }
        
        // Require authorization from the user
        user.require_auth();
        
        let now = env.ledger().timestamp();
        
        // Create passkey record
        let passkey = Passkey {
            public_key,
            registered_at: now,
            last_used: now,
        };
        
        // Store the passkey
        env.storage().set(&DataKey::Passkey(user.clone()), &passkey);
        
        // Initialize nonce
        env.storage().set(&DataKey::Nonce(user.clone()), &0u64);
        
        // Log event
        env.events().publish(("register_passkey"), user);
        
        Ok(())
    }
    
    /// Get the passkey for a user
    pub fn get_passkey(env: Env, user: Address) -> Result<Passkey, Error> {
        env.storage().get(&DataKey::Passkey(user))
            .ok_or(Error::PasskeyNotFound)
    }
    
    /// Verify a signature
    pub fn verify_signature(
        env: Env,
        user: Address,
        signature: BytesN<64>,
        message: BytesN<32>,
        sig_type: SignatureType,
    ) -> Result<bool, Error> {
        // Get the user's passkey
        let passkey = self.get_passkey(env.clone(), user.clone())?;
        
        // Verify the signature
        let is_valid = env.crypto().ed25519_verify(&passkey.public_key, &message, &signature);
        
        // If valid and it's an authentication, update last used time
        if is_valid && matches!(sig_type, SignatureType::Authentication) {
            let now = env.ledger().timestamp();
            let mut updated_passkey = passkey.clone();
            updated_passkey.last_used = now;
            env.storage().set(&DataKey::Passkey(user.clone()), &updated_passkey);
            
            // Log authentication
            env.events().publish(("authenticate"), user);
        }
        
        Ok(is_valid)
    }
    
    /// Get current nonce for a user
    pub fn get_nonce(env: Env, user: Address) -> Result<u64, Error> {
        env.storage().get(&DataKey::Nonce(user))
            .ok_or(Error::NonceNotFound)
    }
    
    /// Increment nonce for a user
    pub fn increment_nonce(env: Env, user: Address) -> Result<u64, Error> {
        // Require authorization
        user.require_auth();
        
        // Get current nonce
        let current_nonce = self.get_nonce(env.clone(), user.clone())?;
        
        // Increment nonce
        let new_nonce = current_nonce + 1;
        env.storage().set(&DataKey::Nonce(user), &new_nonce);
        
        Ok(new_nonce)
    }
    
    /// Add a recovery key for a user
    pub fn add_recovery_key(
        env: Env,
        user: Address,
        recovery_key: Address
    ) -> Result<(), Error> {
        // Require authorization
        user.require_auth();
        
        // Get the current recovery key count
        let count: u32 = env.storage()
            .get(&DataKey::RecoveryKeyCount(user.clone()))
            .unwrap_or(0);
        
        // Add the recovery key
        env.storage().set(&DataKey::RecoveryKey(user.clone(), count), &recovery_key);
        
        // Increment the count
        env.storage().set(&DataKey::RecoveryKeyCount(user.clone()), &(count + 1));
        
        // Log event
        env.events().publish(("add_recovery_key"), (user, recovery_key));
        
        Ok(())
    }
    
    /// Get all recovery keys for a user
    pub fn get_recovery_keys(env: Env, user: Address) -> Vec<Address> {
        let count: u32 = env.storage()
            .get(&DataKey::RecoveryKeyCount(user.clone()))
            .unwrap_or(0);
        
        let mut keys = Vec::new(&env);
        
        for i in 0..count {
            if let Some(key) = env.storage().get(&DataKey::RecoveryKey(user.clone(), i)) {
                keys.push_back(key);
            }
        }
        
        keys
    }
    
    /// Recover a passkey using a recovery key
    pub fn recover_passkey(
        env: Env,
        user: Address,
        recovery_key: Address,
        new_public_key: BytesN<32>
    ) -> Result<(), Error> {
        // Require authorization from the recovery key
        recovery_key.require_auth();
        
        // Check if the recovery key is valid
        let recovery_keys = self.get_recovery_keys(env.clone(), user.clone());
        if !recovery_keys.contains(&recovery_key) {
            return Err(Error::InvalidRecoveryKey);
        }
        
        // Update the passkey
        let passkey = self.get_passkey(env.clone(), user.clone())?;
        let now = env.ledger().timestamp();
        
        let updated_passkey = Passkey {
            public_key: new_public_key,
            registered_at: passkey.registered_at,
            last_used: now,
        };
        
        // Store updated passkey
        env.storage().set(&DataKey::Passkey(user.clone()), &updated_passkey);
        
        // Reset nonce
        env.storage().set(&DataKey::Nonce(user.clone()), &0u64);
        
        // Log recovery event
        env.events().publish(("recover_passkey"), (user, recovery_key));
        
        Ok(())
    }
}

/// Get the owner of the contract
fn get_owner(env: &Env) -> Option<Address> {
    env.storage().get(&DataKey::Owner)
}

/// Error types for the auth contract
#[derive(Debug, Clone)]
#[contracttype]
pub enum Error {
    AlreadyInitialized,
    NotInitialized,
    Unauthorized,
    PasskeyNotFound,
    PasskeyAlreadyExists,
    NonceNotFound,
    InvalidSignature,
    InvalidRecoveryKey,
}

/// Unit tests for the auth contract
#[cfg(test)]
mod test {
    use super::*;
    use soroban_sdk::testutils::{Address as _, AuthorizedFunction, Events};
    use soroban_sdk::{vec, BytesN, Env};

    #[test]
    fn test_initialize() {
        let env = Env::default();
        let contract_id = env.register_contract(None, AuthContract);
        let owner = Address::generate(&env);
        let registry = Address::generate(&env);
        
        // Authorize the call
        env.mock_all_auths();
        
        // Initialize the contract
        let client = AuthContractClient::new(&env, &contract_id);
        assert!(client.initialize(&owner, &registry).is_ok());
        
        // Verify event was published
        let events = env.events().all();
        assert_eq!(events.len(), 1);
        assert_eq!(
            events[0],
            (
                contract_id.clone(),
                ("initialize", "auth").into_val(&env),
                owner.into_val(&env)
            )
        );
    }
    
    #[test]
    fn test_register_passkey() {
        let env = Env::default();
        let contract_id = env.register_contract(None, AuthContract);
        let owner = Address::generate(&env);
        let registry = Address::generate(&env);
        let user = Address::generate(&env);
        
        // Create a dummy public key
        let public_key = BytesN::from_array(&env, &[0; 32]);
        
        // Authorize all calls
        env.mock_all_auths();
        
        // Initialize the contract
        let client = AuthContractClient::new(&env, &contract_id);
        client.initialize(&owner, &registry).unwrap();
        
        // Register a passkey
        client.register_passkey(&user, &public_key).unwrap();
        
        // Get the passkey
        let passkey = client.get_passkey(&user).unwrap();
        assert_eq!(passkey.public_key, public_key);
    }
} 