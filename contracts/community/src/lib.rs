#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, Address, BytesN, Env, Map, Symbol, Vec, vec};

/// Data storage keys
#[derive(Clone)]
#[contracttype]
pub enum DataKey {
    Owner,
    RegistryContract,
    Post(BytesN<32>),         // Post ID -> Post
    PostIndex,                // Vector of all post IDs
    UserPosts(Address),       // User -> Vector of post IDs
    Moderator(Address),       // Address -> bool
    Reward(Address),          // Address -> Balance
    Category(Symbol),         // Category -> Vector of post IDs
    Vote(BytesN<32>, Address), // (Post ID, User) -> Vote
}

/// Post status enum
#[derive(Clone, PartialEq)]
#[contracttype]
pub enum PostStatus {
    Pending,
    Approved,
    Rejected,
}

/// Voting enum
#[derive(Clone, PartialEq)]
#[contracttype]
pub enum Vote {
    Up,
    Down,
    None,
}

/// A community post
#[derive(Clone)]
#[contracttype]
pub struct Post {
    pub id: BytesN<32>,          // Unique identifier
    pub author: Address,         // Author's address
    pub content_hash: BytesN<32>, // IPFS hash of content
    pub category: Symbol,        // Category (e.g., "education", "question")
    pub created_at: u64,         // Timestamp
    pub status: PostStatus,      // Moderation status
    pub up_votes: u32,           // Number of up votes
    pub down_votes: u32,         // Number of down votes
    pub is_anonymous: bool,      // Whether the post is anonymous
}

#[contract]
pub struct CommunityContract;

#[contractimpl]
impl CommunityContract {
    /// Initialize the contract with registry address
    pub fn initialize(env: Env, owner: Address, registry_contract: Address) -> Result<(), Error> {
        if get_owner(&env).is_some() {
            return Err(Error::AlreadyInitialized);
        }

        owner.require_auth();
        
        // Set owner and registry address
        env.storage().set(&DataKey::Owner, &owner);
        env.storage().set(&DataKey::RegistryContract, &registry_contract);
        
        // Initialize post index
        env.storage().set(&DataKey::PostIndex, &Vec::<BytesN<32>>::new(&env));
        
        // Make owner a moderator
        env.storage().set(&DataKey::Moderator(owner.clone()), &true);
        
        // Log initialization
        env.events().publish(("initialize", "community"), owner);
        
        Ok(())
    }
    
    /// Create a new post
    pub fn create_post(
        env: Env,
        author: Address,
        content_hash: BytesN<32>,
        category: Symbol,
        is_anonymous: bool,
    ) -> Result<BytesN<32>, Error> {
        // Require authorization from the author
        author.require_auth();
        
        // Generate a unique post ID using hash of inputs and timestamp
        let now = env.ledger().timestamp();
        let post_id_preimage = (author.clone(), content_hash.clone(), now);
        let post_id = env.crypto().sha256(&env.obj_to_bytes(&post_id_preimage));
        
        // Create the post
        let post = Post {
            id: post_id.clone(),
            author: author.clone(),
            content_hash,
            category,
            created_at: now,
            status: PostStatus::Pending, // All posts start as pending for moderation
            up_votes: 0,
            down_votes: 0,
            is_anonymous,
        };
        
        // Store the post
        env.storage().set(&DataKey::Post(post_id.clone()), &post);
        
        // Add to post index
        let mut post_index: Vec<BytesN<32>> = env.storage()
            .get(&DataKey::PostIndex)
            .unwrap_or_else(|| Vec::new(&env));
        post_index.push_back(post_id.clone());
        env.storage().set(&DataKey::PostIndex, &post_index);
        
        // Add to user's posts
        let mut user_posts: Vec<BytesN<32>> = env.storage()
            .get(&DataKey::UserPosts(author.clone()))
            .unwrap_or_else(|| Vec::new(&env));
        user_posts.push_back(post_id.clone());
        env.storage().set(&DataKey::UserPosts(author.clone()), &user_posts);
        
        // Add to category
        let mut category_posts: Vec<BytesN<32>> = env.storage()
            .get(&DataKey::Category(category.clone()))
            .unwrap_or_else(|| Vec::new(&env));
        category_posts.push_back(post_id.clone());
        env.storage().set(&DataKey::Category(category.clone()), &category_posts);
        
        // Log post creation
        env.events().publish(
            ("create_post", category), 
            (author, post_id.clone())
        );
        
        Ok(post_id)
    }
    
    /// Moderate a post (approve or reject)
    pub fn moderate_post(
        env: Env,
        moderator: Address,
        post_id: BytesN<32>,
        approve: bool,
    ) -> Result<(), Error> {
        // Check if moderator is authorized
        let is_moderator: bool = env.storage()
            .get(&DataKey::Moderator(moderator.clone()))
            .unwrap_or(false);
            
        if !is_moderator {
            return Err(Error::Unauthorized);
        }
        
        // Require authorization from the moderator
        moderator.require_auth();
        
        // Get the post
        let mut post: Post = env.storage()
            .get(&DataKey::Post(post_id.clone()))
            .ok_or(Error::PostNotFound)?;
            
        // Update post status
        post.status = if approve { PostStatus::Approved } else { PostStatus::Rejected };
        
        // Save updated post
        env.storage().set(&DataKey::Post(post_id.clone()), &post);
        
        // If approved, award the author
        if approve {
            self.award_author(env.clone(), post.author.clone())?;
        }
        
        // Log moderation action
        env.events().publish(
            if approve { ("approve_post") } else { ("reject_post") }, 
            (moderator, post_id)
        );
        
        Ok(())
    }
    
    /// Add a moderator
    pub fn add_moderator(
        env: Env,
        owner: Address,
        new_moderator: Address,
    ) -> Result<(), Error> {
        // Check if caller is the owner
        let contract_owner = get_owner(&env).ok_or(Error::NotInitialized)?;
        if owner != contract_owner {
            return Err(Error::Unauthorized);
        }
        
        // Require authorization from the owner
        owner.require_auth();
        
        // Set the new moderator
        env.storage().set(&DataKey::Moderator(new_moderator.clone()), &true);
        
        // Log event
        env.events().publish(("add_moderator"), (owner, new_moderator));
        
        Ok(())
    }
    
    /// Remove a moderator
    pub fn remove_moderator(
        env: Env,
        owner: Address,
        moderator: Address,
    ) -> Result<(), Error> {
        // Check if caller is the owner
        let contract_owner = get_owner(&env).ok_or(Error::NotInitialized)?;
        if owner != contract_owner {
            return Err(Error::Unauthorized);
        }
        
        // Require authorization from the owner
        owner.require_auth();
        
        // Remove the moderator
        env.storage().remove(&DataKey::Moderator(moderator.clone()));
        
        // Log event
        env.events().publish(("remove_moderator"), (owner, moderator));
        
        Ok(())
    }
    
    /// Vote on a post
    pub fn vote(
        env: Env,
        user: Address,
        post_id: BytesN<32>,
        vote: Vote,
    ) -> Result<(), Error> {
        // Require authorization from the user
        user.require_auth();
        
        // Get the post
        let mut post: Post = env.storage()
            .get(&DataKey::Post(post_id.clone()))
            .ok_or(Error::PostNotFound)?;
            
        // Check if post is approved
        if post.status != PostStatus::Approved {
            return Err(Error::PostNotApproved);
        }
        
        // Get previous vote (if any)
        let previous_vote: Vote = env.storage()
            .get(&DataKey::Vote(post_id.clone(), user.clone()))
            .unwrap_or(Vote::None);
            
        // Update vote counts
        match (previous_vote, vote.clone()) {
            (Vote::None, Vote::Up) => post.up_votes += 1,
            (Vote::None, Vote::Down) => post.down_votes += 1,
            (Vote::Up, Vote::None) => post.up_votes -= 1,
            (Vote::Up, Vote::Down) => {
                post.up_votes -= 1;
                post.down_votes += 1;
            },
            (Vote::Down, Vote::None) => post.down_votes -= 1,
            (Vote::Down, Vote::Up) => {
                post.down_votes -= 1;
                post.up_votes += 1;
            },
            _ => (), // No change for same vote
        }
        
        // Save updated post
        env.storage().set(&DataKey::Post(post_id.clone()), &post);
        
        // Save user's vote
        if vote == Vote::None {
            env.storage().remove(&DataKey::Vote(post_id.clone(), user.clone()));
        } else {
            env.storage().set(&DataKey::Vote(post_id.clone(), user.clone()), &vote);
        }
        
        // Log vote event
        env.events().publish(("vote"), (user, post_id, vote));
        
        Ok(())
    }
    
    /// Get a post by ID
    pub fn get_post(
        env: Env,
        post_id: BytesN<32>,
    ) -> Result<Post, Error> {
        // Get the post
        env.storage().get(&DataKey::Post(post_id))
            .ok_or(Error::PostNotFound)
    }
    
    /// List all approved posts
    pub fn list_approved_posts(env: Env) -> Vec<BytesN<32>> {
        let post_index: Vec<BytesN<32>> = env.storage()
            .get(&DataKey::PostIndex)
            .unwrap_or_else(|| Vec::new(&env));
            
        let mut approved_posts = Vec::new(&env);
        
        for post_id in post_index.iter() {
            if let Some(post) = env.storage().get::<BytesN<32>, Post>(&DataKey::Post(post_id.clone())) {
                if post.status == PostStatus::Approved {
                    approved_posts.push_back(post_id.clone());
                }
            }
        }
        
        approved_posts
    }
    
    /// List posts by category
    pub fn list_posts_by_category(env: Env, category: Symbol) -> Vec<BytesN<32>> {
        env.storage()
            .get(&DataKey::Category(category))
            .unwrap_or_else(|| Vec::new(&env))
    }
    
    /// List posts by user
    pub fn list_posts_by_user(env: Env, user: Address) -> Vec<BytesN<32>> {
        env.storage()
            .get(&DataKey::UserPosts(user))
            .unwrap_or_else(|| Vec::new(&env))
    }
    
    /// Award tokens to an author (internal function)
    fn award_author(
        &self,
        env: Env,
        author: Address,
    ) -> Result<(), Error> {
        // Get current reward balance
        let current_reward: i128 = env.storage()
            .get(&DataKey::Reward(author.clone()))
            .unwrap_or(0);
            
        // Add reward (10 tokens per approved post)
        let new_reward = current_reward + 10;
        
        // Store updated reward
        env.storage().set(&DataKey::Reward(author.clone()), &new_reward);
        
        // Log reward event
        env.events().publish(("reward_author"), (author, 10_i128));
        
        Ok(())
    }
    
    /// Get user's reward balance
    pub fn get_reward_balance(env: Env, user: Address) -> i128 {
        env.storage()
            .get(&DataKey::Reward(user))
            .unwrap_or(0)
    }
}

/// Get the owner of the contract
fn get_owner(env: &Env) -> Option<Address> {
    env.storage().get(&DataKey::Owner)
}

/// Error types for the community contract
#[derive(Debug, Clone)]
#[contracttype]
pub enum Error {
    AlreadyInitialized,
    NotInitialized,
    Unauthorized,
    PostNotFound,
    PostNotApproved,
    InvalidVote,
}

/// Unit tests for the community contract
#[cfg(test)]
mod test {
    use super::*;
    use soroban_sdk::testutils::{Address as _, AuthorizedFunction, Events};
    use soroban_sdk::{vec, BytesN, Env, Symbol};

    #[test]
    fn test_create_and_moderate_post() {
        let env = Env::default();
        let contract_id = env.register_contract(None, CommunityContract);
        let owner = Address::generate(&env);
        let registry = Address::generate(&env);
        let author = Address::generate(&env);
        
        // Create test data
        let content_hash = BytesN::from_array(&env, &[1; 32]);
        let category = Symbol::new(&env, "education");
        
        // Authorize all calls
        env.mock_all_auths();
        
        // Initialize the contract
        let client = CommunityContractClient::new(&env, &contract_id);
        client.initialize(&owner, &registry).unwrap();
        
        // Create a post
        let post_id = client.create_post(&author, &content_hash, &category, &false).unwrap();
        
        // Get the post and verify it's pending
        let post = client.get_post(&post_id).unwrap();
        assert_eq!(post.status, PostStatus::Pending);
        
        // Moderate the post (approve)
        client.moderate_post(&owner, &post_id, &true).unwrap();
        
        // Get the post again and verify it's approved
        let post = client.get_post(&post_id).unwrap();
        assert_eq!(post.status, PostStatus::Approved);
        
        // Check that author received a reward
        let reward = client.get_reward_balance(&author);
        assert_eq!(reward, 10);
    }
    
    #[test]
    fn test_voting() {
        let env = Env::default();
        let contract_id = env.register_contract(None, CommunityContract);
        let owner = Address::generate(&env);
        let registry = Address::generate(&env);
        let author = Address::generate(&env);
        let voter = Address::generate(&env);
        
        // Create test data
        let content_hash = BytesN::from_array(&env, &[1; 32]);
        let category = Symbol::new(&env, "education");
        
        // Authorize all calls
        env.mock_all_auths();
        
        // Initialize the contract
        let client = CommunityContractClient::new(&env, &contract_id);
        client.initialize(&owner, &registry).unwrap();
        
        // Create a post
        let post_id = client.create_post(&author, &content_hash, &category, &false).unwrap();
        
        // Approve the post
        client.moderate_post(&owner, &post_id, &true).unwrap();
        
        // Vote up
        client.vote(&voter, &post_id, &Vote::Up).unwrap();
        
        // Check vote was recorded
        let post = client.get_post(&post_id).unwrap();
        assert_eq!(post.up_votes, 1);
        assert_eq!(post.down_votes, 0);
        
        // Change vote to down
        client.vote(&voter, &post_id, &Vote::Down).unwrap();
        
        // Check vote was updated
        let post = client.get_post(&post_id).unwrap();
        assert_eq!(post.up_votes, 0);
        assert_eq!(post.down_votes, 1);
    }
} 