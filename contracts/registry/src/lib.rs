#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, Address, Env, Map, Vec, Symbol};

#[derive(Clone)]
#[contracttype]
pub enum DataKey {
    Owner,
    Admin(Address),
    Contract(Symbol),
}

#[derive(Clone)]
#[contracttype]
pub enum ContractType {
    Auth,
    Data,
    Community,
}

#[contract]
pub struct RegistryContract;

#[contractimpl]
impl RegistryContract {
    /// Initialize the contract with the owner
    pub fn initialize(env: Env, owner: Address) -> Result<(), Error> {
        if get_owner(&env).is_some() {
            return Err(Error::AlreadyInitialized);
        }

        owner.require_auth();
        env.storage().set(&DataKey::Owner, &owner);
        
        // Log initialization
        env.events().publish(("initialize", "registry"), owner);
        
        Ok(())
    }
    
    /// Register a contract by its type and address
    pub fn register_contract(env: Env, contract_type: ContractType, address: Address) -> Result<(), Error> {
        // Get owner of this contract
        let owner = get_owner(&env).ok_or(Error::NotInitialized)?;
        
        // Check authorization
        owner.require_auth();
        
        // Convert contract type to symbol
        let contract_type_symbol = match contract_type {
            ContractType::Auth => Symbol::new(&env, "auth"),
            ContractType::Data => Symbol::new(&env, "data"),
            ContractType::Community => Symbol::new(&env, "community"),
        };
        
        // Store contract address
        env.storage().set(&DataKey::Contract(contract_type_symbol.clone()), &address);
        
        // Log event
        env.events().publish(
            ("register_contract", contract_type_symbol), 
            address
        );
        
        Ok(())
    }
    
    /// Get a contract address by type
    pub fn get_contract(env: Env, contract_type: ContractType) -> Result<Address, Error> {
        // Convert contract type to symbol
        let contract_type_symbol = match contract_type {
            ContractType::Auth => Symbol::new(&env, "auth"),
            ContractType::Data => Symbol::new(&env, "data"),
            ContractType::Community => Symbol::new(&env, "community"),
        };
        
        // Get contract address
        env.storage().get(&DataKey::Contract(contract_type_symbol))
            .ok_or(Error::ContractNotFound)
    }
    
    /// Add a new admin
    pub fn add_admin(env: Env, admin: Address) -> Result<(), Error> {
        // Get owner of this contract
        let owner = get_owner(&env).ok_or(Error::NotInitialized)?;
        
        // Check authorization
        owner.require_auth();
        
        // Store admin status
        env.storage().set(&DataKey::Admin(admin.clone()), &true);
        
        // Log event
        env.events().publish(("add_admin"), admin);
        
        Ok(())
    }
    
    /// Remove an admin
    pub fn remove_admin(env: Env, admin: Address) -> Result<(), Error> {
        // Get owner of this contract
        let owner = get_owner(&env).ok_or(Error::NotInitialized)?;
        
        // Check authorization
        owner.require_auth();
        
        // Remove admin status
        env.storage().remove(&DataKey::Admin(admin.clone()));
        
        // Log event
        env.events().publish(("remove_admin"), admin);
        
        Ok(())
    }
    
    /// Check if an address is an admin
    pub fn is_admin(env: Env, address: Address) -> bool {
        env.storage().get(&DataKey::Admin(address)).unwrap_or(false)
    }
}

/// Get the owner of the contract
fn get_owner(env: &Env) -> Option<Address> {
    env.storage().get(&DataKey::Owner)
}

/// Error types for the registry contract
#[derive(Debug, Clone)]
#[contracttype]
pub enum Error {
    AlreadyInitialized,
    NotInitialized,
    Unauthorized,
    ContractNotFound,
}

/// Unit tests for the registry contract
#[cfg(test)]
mod test {
    use super::*;
    use soroban_sdk::testutils::{Address as _, AuthorizedFunction, Events};
    use soroban_sdk::{vec, Symbol};

    #[test]
    fn test_initialize() {
        let env = Env::default();
        let contract_id = env.register_contract(None, RegistryContract);
        let owner = Address::generate(&env);
        
        // Authorize the call
        env.mock_all_auths();
        
        // Initialize the contract
        let client = RegistryContractClient::new(&env, &contract_id);
        assert!(client.initialize(&owner).is_ok());
        
        // Verify event was published
        let events = env.events().all();
        assert_eq!(events.len(), 1);
        assert_eq!(
            events[0],
            (
                contract_id.clone(),
                ("initialize", "registry").into_val(&env),
                owner.into_val(&env)
            )
        );
    }
    
    #[test]
    fn test_register_contract() {
        let env = Env::default();
        let contract_id = env.register_contract(None, RegistryContract);
        let owner = Address::generate(&env);
        let auth_contract = Address::generate(&env);
        
        // Authorize all calls
        env.mock_all_auths();
        
        // Initialize the contract
        let client = RegistryContractClient::new(&env, &contract_id);
        client.initialize(&owner).unwrap();
        
        // Register Auth contract
        client.register_contract(&ContractType::Auth, &auth_contract).unwrap();
        
        // Get Auth contract
        let retrieved_address = client.get_contract(&ContractType::Auth).unwrap();
        assert_eq!(retrieved_address, auth_contract);
    }
} 