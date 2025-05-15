#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, Address, Env, Map, String, Vec, BytesN};

#[derive(Clone)]
#[contracttype]
pub enum PoolType {
    MenstrualCycleData,
    SymptomData,
    FertilityData,
    WellnessData,
    MedicalResearch,
    MarketTrends,
}

#[derive(Clone)]
#[contracttype]
pub struct DataPool {
    id: BytesN<32>,
    name: String,
    description: String,
    pool_type: PoolType,
    creator: Address,
    total_contributors: u32,
    total_revenue: i128,
    is_active: bool,
    created_at: u64,
}

#[derive(Clone)]
#[contracttype]
pub struct DataContribution {
    user: Address,
    pool_id: BytesN<32>,
    data_hash: String, // Hash of the data, actual data stored elsewhere
    timestamp: u64,
    shares: u32, // Number of shares/weight in the pool
}

#[derive(Clone)]
#[contracttype]
pub struct DataPurchase {
    buyer: Address,
    pool_id: BytesN<32>,
    amount: i128,
    timestamp: u64,
    access_expiry: u64, // When access expires
}

#[derive(Clone)]
#[contracttype]
pub struct RevenueShare {
    user: Address,
    pool_id: BytesN<32>,
    amount: i128,
    timestamp: u64,
    claimed: bool,
}

#[derive(Clone)]
#[contracttype]
pub struct DataAccess {
    id: BytesN<32>,
    buyer: Address,
    pool_id: BytesN<32>,
    granted_at: u64,
    expires_at: u64,
    api_key: String, // In a real system, this would be securely managed
}

#[contract]
pub struct DataMarketplaceContract {
    admin: Address,
    pools: Map<BytesN<32>, DataPool>,
    user_contributions: Map<Address, Vec<DataContribution>>,
    pool_contributions: Map<BytesN<32>, Vec<DataContribution>>,
    data_purchases: Vec<DataPurchase>,
    user_revenue_shares: Map<Address, Vec<RevenueShare>>,
    data_accesses: Map<Address, Vec<DataAccess>>,
    marketplace_fee: u32, // Basis points (e.g., 250 = 2.5%)
}

#[contractimpl]
impl DataMarketplaceContract {
    // Initialize the contract
    pub fn initialize(env: Env, admin: Address, marketplace_fee: u32) -> Self {
        admin.require_auth();
        
        // Ensure fee is reasonable (max 10%)
        if marketplace_fee > 1000 {
            panic!("Marketplace fee too high");
        }
        
        Self {
            admin,
            pools: Map::new(&env),
            user_contributions: Map::new(&env),
            pool_contributions: Map::new(&env),
            data_purchases: Vec::new(&env),
            user_revenue_shares: Map::new(&env),
            data_accesses: Map::new(&env),
            marketplace_fee,
        }
    }
    
    // Create a new data pool
    pub fn create_data_pool(
        &mut self,
        env: Env,
        creator: Address,
        name: String,
        description: String,
        pool_type: PoolType,
    ) -> BytesN<32> {
        creator.require_auth();
        
        // Create a unique pool ID
        let pool_id = env.crypto().sha256(
            &env.serializer().serialize(&(name.clone(), creator.clone(), env.ledger().timestamp())).unwrap()
        );
        
        // Create the pool
        let pool = DataPool {
            id: pool_id.clone(),
            name,
            description,
            pool_type,
            creator,
            total_contributors: 0,
            total_revenue: 0,
            is_active: true,
            created_at: env.ledger().timestamp(),
        };
        
        // Store the pool
        self.pools.set(pool_id.clone(), pool);
        
        pool_id
    }
    
    // Contribute data to a pool
    pub fn contribute_data(
        &mut self,
        env: Env,
        user: Address,
        pool_id: BytesN<32>,
        data_hash: String,
    ) -> Result<(), String> {
        user.require_auth();
        
        // Check if pool exists
        let mut pool = self.pools.get(pool_id.clone())
            .ok_or(String::from_str(&env, "Pool not found"))?;
        
        // Check if pool is active
        if !pool.is_active {
            return Err(String::from_str(&env, "Pool is not active"));
        }
        
        // Create the contribution
        let contribution = DataContribution {
            user: user.clone(),
            pool_id: pool_id.clone(),
            data_hash,
            timestamp: env.ledger().timestamp(),
            shares: 1, // Simple model: each contribution is worth 1 share
        };
        
        // Update user's contributions
        let mut user_contribs = self.user_contributions.get(user.clone()).unwrap_or(Vec::new(&env));
        user_contribs.push_back(contribution.clone());
        self.user_contributions.set(user, user_contribs);
        
        // Update pool's contributions
        let mut pool_contribs = self.pool_contributions.get(pool_id.clone()).unwrap_or(Vec::new(&env));
        pool_contribs.push_back(contribution);
        self.pool_contributions.set(pool_id.clone(), pool_contribs);
        
        // Update pool stats
        pool.total_contributors += 1;
        self.pools.set(pool_id, pool);
        
        Ok(())
    }
    
    // Purchase access to a data pool
    pub fn purchase_data_access(
        &mut self,
        env: Env,
        buyer: Address,
        pool_id: BytesN<32>,
        amount: i128,
        access_duration: u64,
    ) -> Result<DataAccess, String> {
        buyer.require_auth();
        
        // Check if pool exists and is active
        let mut pool = self.pools.get(pool_id.clone())
            .ok_or(String::from_str(&env, "Pool not found"))?;
        
        if !pool.is_active {
            return Err(String::from_str(&env, "Pool is not active"));
        }
        
        // In a real implementation, this would handle the payment
        // For the prototype, we'll just record the purchase
        
        // Record the purchase
        let purchase = DataPurchase {
            buyer: buyer.clone(),
            pool_id: pool_id.clone(),
            amount,
            timestamp: env.ledger().timestamp(),
            access_expiry: env.ledger().timestamp() + access_duration,
        };
        
        self.data_purchases.push_back(purchase);
        
        // Calculate revenue shares
        self.distribute_revenue_shares(&env, &pool_id, amount);
        
        // Update pool total revenue
        pool.total_revenue += amount;
        self.pools.set(pool_id.clone(), pool);
        
        // Create data access
        let access_id = env.crypto().sha256(
            &env.serializer().serialize(&(buyer.clone(), pool_id.clone(), env.ledger().timestamp())).unwrap()
        );
        
        let access = DataAccess {
            id: access_id,
            buyer: buyer.clone(),
            pool_id: pool_id.clone(),
            granted_at: env.ledger().timestamp(),
            expires_at: env.ledger().timestamp() + access_duration,
            api_key: self.generate_api_key(&env, &buyer, &pool_id),
        };
        
        // Store buyer's access
        let mut user_accesses = self.data_accesses.get(buyer.clone()).unwrap_or(Vec::new(&env));
        user_accesses.push_back(access.clone());
        self.data_accesses.set(buyer, user_accesses);
        
        Ok(access)
    }
    
    // Distribute revenue shares to contributors
    fn distribute_revenue_shares(
        &mut self,
        env: &Env,
        pool_id: &BytesN<32>,
        amount: i128,
    ) {
        // Get pool contributions
        if let Some(contributions) = self.pool_contributions.get(pool_id.clone()) {
            // Calculate total shares
            let mut total_shares: u32 = 0;
            for contribution in contributions.iter() {
                total_shares += contribution.shares;
            }
            
            if total_shares == 0 {
                return; // No contributors yet
            }
            
            // Calculate marketplace fee
            let fee_amount = (amount * (self.marketplace_fee as i128)) / 10000;
            let distribute_amount = amount - fee_amount;
            
            // Create a map to aggregate shares by user
            let mut user_shares: Map<Address, u32> = Map::new(env);
            
            for contribution in contributions.iter() {
                let current_shares = user_shares.get(contribution.user.clone()).unwrap_or(0);
                user_shares.set(contribution.user.clone(), current_shares + contribution.shares);
            }
            
            // Distribute revenue based on shares
            for (user, shares) in user_shares.iter() {
                let user_amount = (distribute_amount * (shares as i128)) / (total_shares as i128);
                
                if user_amount > 0 {
                    // Create revenue share
                    let share = RevenueShare {
                        user: user.clone(),
                        pool_id: pool_id.clone(),
                        amount: user_amount,
                        timestamp: env.ledger().timestamp(),
                        claimed: false,
                    };
                    
                    // Add to user's revenue shares
                    let mut user_shares = self.user_revenue_shares.get(user.clone()).unwrap_or(Vec::new(env));
                    user_shares.push_back(share);
                    self.user_revenue_shares.set(user, user_shares);
                }
            }
        }
    }
    
    // Generate API key for data access
    fn generate_api_key(
        &self,
        env: &Env,
        user: &Address,
        pool_id: &BytesN<32>,
    ) -> String {
        // In a real implementation, this would be a secure API key generation
        // For the prototype, we'll create a simple hash-based key
        let key_data = env.crypto().sha256(
            &env.serializer().serialize(&(user.clone(), pool_id.clone(), env.ledger().timestamp())).unwrap()
        );
        
        // Convert first 16 bytes to hex string
        let mut key_str = String::from_str(env, "cb_");
        for i in 0..8 {
            let byte = key_data.get_byte(i).unwrap();
            key_str = env.string_utils().concat(&key_str, &env.string_utils().from_number(byte as u64, 16));
        }
        
        key_str
    }
    
    // Claim revenue shares
    pub fn claim_revenue(
        &mut self,
        env: Env,
        user: Address,
    ) -> Result<i128, String> {
        user.require_auth();
        
        let mut total_claimed: i128 = 0;
        
        // Get user's revenue shares
        if let Some(mut shares) = self.user_revenue_shares.get(user.clone()) {
            let mut updated_shares = Vec::new(&env);
            
            for mut share in shares.iter() {
                if !share.claimed {
                    // In a real implementation, this would handle the payment
                    // For the prototype, we'll just mark it as claimed
                    
                    total_claimed += share.amount;
                    
                    // Update the share
                    let mut updated_share = share;
                    updated_share.claimed = true;
                    updated_shares.push_back(updated_share);
                } else {
                    updated_shares.push_back(share);
                }
            }
            
            // Update user's shares
            self.user_revenue_shares.set(user, updated_shares);
        }
        
        if total_claimed == 0 {
            return Err(String::from_str(&env, "No revenue to claim"));
        }
        
        Ok(total_claimed)
    }
    
    // Get all data pools
    pub fn list_data_pools(
        &self,
        env: Env,
    ) -> Vec<DataPool> {
        let mut result = Vec::new(&env);
        
        for (_, pool) in self.pools.iter() {
            if pool.is_active {
                result.push_back(pool);
            }
        }
        
        result
    }
    
    // Get pool details
    pub fn get_pool(
        &self,
        env: Env,
        pool_id: BytesN<32>,
    ) -> Option<DataPool> {
        self.pools.get(pool_id)
    }
    
    // Get user's contributions
    pub fn get_user_contributions(
        &self,
        env: Env,
        user: Address,
    ) -> Vec<DataContribution> {
        self.user_contributions.get(user).unwrap_or(Vec::new(&env))
    }
    
    // Get user's revenue shares
    pub fn get_user_revenue_shares(
        &self,
        env: Env,
        user: Address,
    ) -> Vec<RevenueShare> {
        self.user_revenue_shares.get(user).unwrap_or(Vec::new(&env))
    }
    
    // Get user's data accesses
    pub fn get_user_data_accesses(
        &self,
        env: Env,
        user: Address,
    ) -> Vec<DataAccess> {
        let mut result = Vec::new(&env);
        
        if let Some(accesses) = self.data_accesses.get(user) {
            // Only return active accesses
            let current_time = env.ledger().timestamp();
            
            for access in accesses.iter() {
                if access.expires_at > current_time {
                    result.push_back(access);
                }
            }
        }
        
        result
    }
    
    // Set marketplace fee (admin only)
    pub fn set_marketplace_fee(
        &mut self,
        env: Env,
        admin: Address,
        fee: u32,
    ) -> Result<(), String> {
        admin.require_auth();
        
        if admin != self.admin {
            return Err(String::from_str(&env, "Only admin can set fees"));
        }
        
        // Ensure fee is reasonable (max 10%)
        if fee > 1000 {
            return Err(String::from_str(&env, "Fee too high (max 10%)"));
        }
        
        self.marketplace_fee = fee;
        
        Ok(())
    }
    
    // Deactivate a pool (admin or creator only)
    pub fn deactivate_pool(
        &mut self,
        env: Env,
        caller: Address,
        pool_id: BytesN<32>,
    ) -> Result<(), String> {
        caller.require_auth();
        
        // Get the pool
        let mut pool = self.pools.get(pool_id.clone())
            .ok_or(String::from_str(&env, "Pool not found"))?;
        
        // Check permissions
        if caller != self.admin && caller != pool.creator {
            return Err(String::from_str(&env, "Only admin or creator can deactivate pool"));
        }
        
        // Deactivate the pool
        pool.is_active = false;
        self.pools.set(pool_id, pool);
        
        Ok(())
    }
}

#[cfg(test)]
mod test {
    use super::*;
    use soroban_sdk::{testutils::Address as _, Env};
    
    #[test]
    fn test_data_marketplace_flow() {
        let env = Env::default();
        let admin = Address::generate(&env);
        let user1 = Address::generate(&env);
        let user2 = Address::generate(&env);
        let buyer = Address::generate(&env);
        
        // Initialize contract with 5% marketplace fee
        let mut contract = DataMarketplaceContract::initialize(env.clone(), admin, 500);
        
        // Create a data pool
        let pool_id = contract.create_data_pool(
            env.clone(),
            admin.clone(),
            String::from_str(&env, "Menstrual Health Research"),
            String::from_str(&env, "Anonymized menstrual cycle data for research"),
            PoolType::MenstrualCycleData,
        );
        
        // User1 contributes data
        contract.contribute_data(
            env.clone(),
            user1.clone(),
            pool_id.clone(),
            String::from_str(&env, "hash123"),
        ).unwrap();
        
        // User2 contributes data
        contract.contribute_data(
            env.clone(),
            user2.clone(),
            pool_id.clone(),
            String::from_str(&env, "hash456"),
        ).unwrap();
        
        // Check user contributions
        let user1_contribs = contract.get_user_contributions(env.clone(), user1.clone());
        assert_eq!(user1_contribs.len(), 1);
        
        // Buyer purchases access
        let amount = 1000;
        let access_duration = 86400 * 30; // 30 days
        
        let access = contract.purchase_data_access(
            env.clone(),
            buyer.clone(),
            pool_id.clone(),
            amount,
            access_duration,
        ).unwrap();
        
        // Check buyer's access
        let buyer_accesses = contract.get_user_data_accesses(env.clone(), buyer.clone());
        assert_eq!(buyer_accesses.len(), 1);
        
        // Check revenue shares were created
        let user1_shares = contract.get_user_revenue_shares(env.clone(), user1.clone());
        let user2_shares = contract.get_user_revenue_shares(env.clone(), user2.clone());
        
        assert_eq!(user1_shares.len(), 1);
        assert_eq!(user2_shares.len(), 1);
        
        // Each user should get 47.5% of the amount (5% goes to marketplace)
        let expected_share = (amount * 475) / 1000; // 47.5%
        assert_eq!(user1_shares[0].amount, expected_share);
        assert_eq!(user2_shares[0].amount, expected_share);
        
        // User1 claims revenue
        let claimed = contract.claim_revenue(env.clone(), user1.clone()).unwrap();
        assert_eq!(claimed, expected_share);
        
        // Check that shares were marked as claimed
        let updated_shares = contract.get_user_revenue_shares(env.clone(), user1.clone());
        assert_eq!(updated_shares[0].claimed, true);
    }
} 