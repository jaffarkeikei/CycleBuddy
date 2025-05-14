#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, Address, BytesN, Env, Map, Symbol, Vec, vec};

/// Data storage keys
#[derive(Clone)]
#[contracttype]
pub enum DataKey {
    Owner,
    RegistryContract,
    UserData(Address, BytesN<32>), // User address and data ID
    DataIndex(Address),            // Maps user to their data IDs
    Permission(Address, Address),  // Grantor, grantee
}

/// Permission levels for data access
#[derive(Clone, PartialEq)]
#[contracttype]
pub enum AccessLevel {
    None,
    ReadOnly,
    ReadWrite,
    Owner,
}

/// Encrypted data structure with metadata
#[derive(Clone)]
#[contracttype]
pub struct EncryptedData {
    pub data: Vec<u8>,          // Encrypted data
    pub id: BytesN<32>,         // Unique identifier
    pub created_at: u64,        // Timestamp
    pub updated_at: u64,        // Timestamp
    pub data_type: Symbol,      // Type of data (e.g., "cycle", "symptom")
    pub nonce: Vec<u8>,         // Encryption nonce
}

#[contract]
pub struct DataContract;

#[contractimpl]
impl DataContract {
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
        env.events().publish(("initialize", "data"), owner);
        
        Ok(())
    }
    
    /// Store encrypted data
    pub fn store_data(
        env: Env,
        user: Address,
        encrypted_data: Vec<u8>,
        data_id: BytesN<32>,
        data_type: Symbol,
        nonce: Vec<u8>,
    ) -> Result<(), Error> {
        // Require authorization from the user
        user.require_auth();
        
        let now = env.ledger().timestamp();
        
        // Check if data already exists
        let data_exists = env.storage().has(&DataKey::UserData(user.clone(), data_id.clone()));
        
        // Create or update the data
        let encrypted_data_obj = if data_exists {
            // Get existing data
            let mut existing_data: EncryptedData = env.storage()
                .get(&DataKey::UserData(user.clone(), data_id.clone()))
                .ok_or(Error::DataNotFound)?;
            
            // Update fields
            existing_data.data = encrypted_data;
            existing_data.updated_at = now;
            existing_data.nonce = nonce;
            
            existing_data
        } else {
            // Create new data entry
            EncryptedData {
                data: encrypted_data,
                id: data_id.clone(),
                created_at: now,
                updated_at: now,
                data_type,
                nonce,
            }
        };
        
        // Store the data
        env.storage().set(&DataKey::UserData(user.clone(), data_id.clone()), &encrypted_data_obj);
        
        // If new data, add to user's data index
        if !data_exists {
            let mut data_index: Vec<BytesN<32>> = env.storage()
                .get(&DataKey::DataIndex(user.clone()))
                .unwrap_or_else(|| Vec::new(&env));
            
            data_index.push_back(data_id.clone());
            env.storage().set(&DataKey::DataIndex(user.clone()), &data_index);
        }
        
        // Log data storage event
        env.events().publish(
            ("store_data", data_type), 
            (user, data_id)
        );
        
        Ok(())
    }
    
    /// Retrieve encrypted data
    pub fn get_data(
        env: Env,
        user: Address,
        data_id: BytesN<32>,
        requester: Address,
    ) -> Result<EncryptedData, Error> {
        // Check access permission
        let access_level = self.check_permission(env.clone(), user.clone(), requester.clone())?;
        
        // Verify read access
        if access_level == AccessLevel::None {
            return Err(Error::Unauthorized);
        }
        
        // Get the data
        env.storage().get(&DataKey::UserData(user, data_id))
            .ok_or(Error::DataNotFound)
    }
    
    /// List all data IDs for a user
    pub fn list_data(
        env: Env,
        user: Address,
        requester: Address,
    ) -> Result<Vec<BytesN<32>>, Error> {
        // Check access permission
        let access_level = self.check_permission(env.clone(), user.clone(), requester.clone())?;
        
        // Verify read access
        if access_level == AccessLevel::None {
            return Err(Error::Unauthorized);
        }
        
        // Get the data index
        let data_index: Vec<BytesN<32>> = env.storage()
            .get(&DataKey::DataIndex(user))
            .unwrap_or_else(|| Vec::new(&env));
        
        Ok(data_index)
    }
    
    /// Delete data
    pub fn delete_data(
        env: Env,
        user: Address,
        data_id: BytesN<32>,
        requester: Address,
    ) -> Result<(), Error> {
        // Check access permission
        let access_level = self.check_permission(env.clone(), user.clone(), requester.clone())?;
        
        // Verify write access
        if access_level != AccessLevel::ReadWrite && access_level != AccessLevel::Owner {
            return Err(Error::Unauthorized);
        }
        
        // Check if data exists
        if !env.storage().has(&DataKey::UserData(user.clone(), data_id.clone())) {
            return Err(Error::DataNotFound);
        }
        
        // Get the data to check type (for event)
        let data: EncryptedData = env.storage()
            .get(&DataKey::UserData(user.clone(), data_id.clone()))
            .ok_or(Error::DataNotFound)?;
        
        // Remove the data
        env.storage().remove(&DataKey::UserData(user.clone(), data_id.clone()));
        
        // Update the data index
        let mut data_index: Vec<BytesN<32>> = env.storage()
            .get(&DataKey::DataIndex(user.clone()))
            .unwrap_or_else(|| Vec::new(&env));
        
        // Find and remove the data_id
        let mut index_to_remove = None;
        for (i, id) in data_index.iter().enumerate() {
            if *id == data_id {
                index_to_remove = Some(i);
                break;
            }
        }
        
        if let Some(idx) = index_to_remove {
            let mut new_index = Vec::new(&env);
            for (i, id) in data_index.iter().enumerate() {
                if i != idx {
                    new_index.push_back(id.clone());
                }
            }
            env.storage().set(&DataKey::DataIndex(user.clone()), &new_index);
        }
        
        // Log data deletion event
        env.events().publish(
            ("delete_data", data.data_type), 
            (user, data_id)
        );
        
        Ok(())
    }
    
    /// Grant permission to another user
    pub fn grant_permission(
        env: Env,
        grantor: Address,
        grantee: Address,
        level: AccessLevel,
    ) -> Result<(), Error> {
        // Require authorization from the grantor
        grantor.require_auth();
        
        // Store the permission
        env.storage().set(&DataKey::Permission(grantor.clone(), grantee.clone()), &level);
        
        // Log permission granted event
        env.events().publish(
            ("grant_permission"), 
            (grantor, grantee, level)
        );
        
        Ok(())
    }
    
    /// Check permission level
    pub fn check_permission(
        env: Env,
        data_owner: Address,
        requester: Address,
    ) -> Result<AccessLevel, Error> {
        // If requester is the data owner, grant owner access
        if data_owner == requester {
            return Ok(AccessLevel::Owner);
        }
        
        // Otherwise, check granted permissions
        let permission: AccessLevel = env.storage()
            .get(&DataKey::Permission(data_owner, requester))
            .unwrap_or(AccessLevel::None);
        
        Ok(permission)
    }
}

/// Get the owner of the contract
fn get_owner(env: &Env) -> Option<Address> {
    env.storage().get(&DataKey::Owner)
}

/// Error types for the data contract
#[derive(Debug, Clone)]
#[contracttype]
pub enum Error {
    AlreadyInitialized,
    NotInitialized,
    Unauthorized,
    DataNotFound,
    InvalidData,
}

/// Unit tests for the data contract
#[cfg(test)]
mod test {
    use super::*;
    use soroban_sdk::testutils::{Address as _, AuthorizedFunction, Events};
    use soroban_sdk::{vec, BytesN, Env, Symbol};

    #[test]
    fn test_store_and_retrieve_data() {
        let env = Env::default();
        let contract_id = env.register_contract(None, DataContract);
        let owner = Address::generate(&env);
        let registry = Address::generate(&env);
        let user = Address::generate(&env);
        
        // Create test data
        let data_id = BytesN::from_array(&env, &[1; 32]);
        let encrypted_data = vec![&env, 1, 2, 3, 4, 5];
        let data_type = Symbol::new(&env, "cycle");
        let nonce = vec![&env, 10, 11, 12];
        
        // Authorize all calls
        env.mock_all_auths();
        
        // Initialize the contract
        let client = DataContractClient::new(&env, &contract_id);
        client.initialize(&owner, &registry).unwrap();
        
        // Store data
        client.store_data(&user, &encrypted_data, &data_id, &data_type, &nonce).unwrap();
        
        // Retrieve data
        let retrieved_data = client.get_data(&user, &data_id, &user).unwrap();
        assert_eq!(retrieved_data.data, encrypted_data);
        assert_eq!(retrieved_data.id, data_id);
        assert_eq!(retrieved_data.data_type, data_type);
        assert_eq!(retrieved_data.nonce, nonce);
    }
    
    #[test]
    fn test_permissions() {
        let env = Env::default();
        let contract_id = env.register_contract(None, DataContract);
        let owner = Address::generate(&env);
        let registry = Address::generate(&env);
        let user1 = Address::generate(&env);
        let user2 = Address::generate(&env);
        
        // Create test data
        let data_id = BytesN::from_array(&env, &[1; 32]);
        let encrypted_data = vec![&env, 1, 2, 3, 4, 5];
        let data_type = Symbol::new(&env, "cycle");
        let nonce = vec![&env, 10, 11, 12];
        
        // Authorize all calls
        env.mock_all_auths();
        
        // Initialize the contract
        let client = DataContractClient::new(&env, &contract_id);
        client.initialize(&owner, &registry).unwrap();
        
        // Store data for user1
        client.store_data(&user1, &encrypted_data, &data_id, &data_type, &nonce).unwrap();
        
        // User2 should not have access
        let permission = client.check_permission(&user1, &user2).unwrap();
        assert_eq!(permission, AccessLevel::None);
        
        // Grant read-only permission to user2
        client.grant_permission(&user1, &user2, &AccessLevel::ReadOnly).unwrap();
        
        // User2 should now have read-only access
        let permission = client.check_permission(&user1, &user2).unwrap();
        assert_eq!(permission, AccessLevel::ReadOnly);
        
        // User2 should be able to read the data
        let retrieved_data = client.get_data(&user1, &data_id, &user2).unwrap();
        assert_eq!(retrieved_data.data, encrypted_data);
    }
} 