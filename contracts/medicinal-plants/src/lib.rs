#![no_std]
use soroban_sdk::{
    contracttype, vec, Env, Address, Vec, String,
    contracterror, contractimpl, contract,
};

#[derive(Clone)]
#[contracttype]
pub struct MedicinalPlant {
    id: String,
    name: String,
    scientific_name: String,
    properties: Vec<String>,
    validated: bool,
    validator: Address,
}

#[derive(Clone)]
#[contracttype]
pub struct Listing {
    seller: Address,
    plant_id: String,
    price: i128,
    available: bool,
}

#[contracttype]
pub enum DataKey {
    Plant(String),
    PlantIds,              // NEW: Vec<String> of all plant IDs
    Validators,
    PlantVotes(String),
    Voted(String, Address), // (plant_id, validator)
    Listing(String),       // keyed by plant_id
    ListingIds,            // NEW: Vec<String> of all listing IDs
}

#[contract]
pub struct MedicinalPlantsContract;

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
pub enum MedicinalPlantsError {
    NotAuthorized = 1,
    AlreadyVoted = 2,
    NotValidator = 3,
    NotAvailable = 4,
}

#[contractimpl]
impl MedicinalPlantsContract {
    /// Initialize storage (empty validator list)
    pub fn init(env: &Env) {
        let validators: Vec<Address> = vec![&env];
        env.storage().instance().set(&DataKey::Validators, &validators);
    }

    /// Register a new plant record
    pub fn register_plant(
        env: &Env,
        id: String,
        name: String,
        scientific_name: String,
        properties: Vec<String>,
    ) -> String {
    // Authorization is handled by the contract macro

        let plant = MedicinalPlant {
            id: id.clone(),
            name,
            scientific_name,
            properties,
            validated: false,
            validator: env.current_contract_address(),
        };

        env.storage().instance().set(&DataKey::Plant(id.clone()), &plant);
        
        // Add ID to global plant IDs list
        let mut plant_ids: Vec<String> = env.storage()
            .instance()
            .get(&DataKey::PlantIds)
            .unwrap_or_else(|| vec![&env]);
        if !plant_ids.contains(&id) {
            plant_ids.push_back(id.clone());
            env.storage().instance().set(&DataKey::PlantIds, &plant_ids);
        }
        
        id
    }

    /// Add a validator to the validator set
    pub fn add_validator(env: &Env, validator: Address) {
    // Authorization is handled by the contract macro
        
        let mut validators: Vec<Address> = env.storage().instance().get(&DataKey::Validators).unwrap_or_else(|| vec![&env]);
        validators.push_back(validator);
        env.storage().instance().set(&DataKey::Validators, &validators);
    }

    /// Check if a given identity is a validator
    pub fn is_validator(env: &Env, validator: Address) -> bool {
        let validators: Vec<Address> = env.storage().instance().get(&DataKey::Validators).unwrap_or_else(|| vec![&env]);
        validators.contains(&validator)
    }

    /// Vote for validating a plant. Once votes > 50% of validators the plant becomes validated.
    pub fn vote_for_plant(env: &Env, plant_id: String, validator: Address) -> i128 {
    // Authorization is handled by the contract macro
        
        // must be a validator
        let validators: Vec<Address> = env.storage().instance().get(&DataKey::Validators).unwrap_or_else(|| vec![&env]);
        if !validators.contains(&validator) {
            return 0i128;
        }

        // check if validator already voted for this plant
        let has_voted: Option<bool> = env.storage().instance().get(&DataKey::Voted(plant_id.clone(), validator.clone()));
        if has_voted.unwrap_or(false) {
            // already voted
            return env.storage().instance().get(&DataKey::PlantVotes(plant_id.clone())).unwrap_or(0i128);
        }

        // mark voted
        env.storage().instance().set(&DataKey::Voted(plant_id.clone(), validator.clone()), &true);

        // increment votes
        let mut votes: i128 = env.storage().instance().get(&DataKey::PlantVotes(plant_id.clone())).unwrap_or(0i128);
        votes += 1;
        env.storage().instance().set(&DataKey::PlantVotes(plant_id.clone()), &votes);

        // check quorum (majority)
        let total_validators: i128 = validators.len() as i128;
        if total_validators > 0 && votes * 2 > total_validators {
            // mark plant validated 
            if let Some(mut plant) = env.storage().instance().get::<_, MedicinalPlant>(&DataKey::Plant(plant_id.clone())) {
                plant.validated = true;
                plant.validator = validator; // Record last validator that made plant reach consensus
                env.storage().instance().set(&DataKey::Plant(plant_id.clone()), &plant);
            }
        }

        votes
    }

    /// Get plant data
    pub fn get_plant(env: &Env, id: String) -> Option<MedicinalPlant> {
        env.storage().instance().get(&DataKey::Plant(id))
    }

    /// Get all registered plants
    pub fn get_all_plants(env: &Env) -> Vec<MedicinalPlant> {
        let plant_ids: Vec<String> = env.storage()
            .instance()
            .get(&DataKey::PlantIds)
            .unwrap_or_else(|| vec![&env]);
        
        let mut plants = vec![&env];
        for id in plant_ids.iter() {
            if let Some(plant) = env.storage().instance().get::<_, MedicinalPlant>(&DataKey::Plant(id.clone())) {
                plants.push_back(plant);
            }
        }
        plants
    }

    /// Get votes for a specific plant (read-only query)
    pub fn get_plant_votes(env: &Env, plant_id: String) -> i128 {
        env.storage()
            .instance()
            .get(&DataKey::PlantVotes(plant_id))
            .unwrap_or(0i128)
    }

    /// Get all validators
    pub fn get_validators(env: &Env) -> Vec<Address> {
        env.storage()
            .instance()
            .get(&DataKey::Validators)
            .unwrap_or_else(|| vec![&env])
    }

    /// Marketplace: list a plant for sale (simple listing)
    pub fn list_for_sale(env: &Env, plant_id: String, seller: Address, price: i128) {
    // Authorization is handled by the contract macro

        let listing = Listing {
            seller: seller.clone(),
            plant_id: plant_id.clone(),
            price,
            available: true,
        };
        env.storage().instance().set(&DataKey::Listing(plant_id.clone()), &listing);
        
        // Add plant_id to global listing IDs list
        let mut listing_ids: Vec<String> = env.storage()
            .instance()
            .get(&DataKey::ListingIds)
            .unwrap_or_else(|| vec![&env]);
        if !listing_ids.contains(&plant_id) {
            listing_ids.push_back(plant_id.clone());
            env.storage().instance().set(&DataKey::ListingIds, &listing_ids);
        }
    }

    /// Get all active listings
    pub fn get_all_listings(env: &Env) -> Vec<Listing> {
        let listing_ids: Vec<String> = env.storage()
            .instance()
            .get(&DataKey::ListingIds)
            .unwrap_or_else(|| vec![&env]);
        
        let mut listings = vec![&env];
        for id in listing_ids.iter() {
            if let Some(listing) = env.storage().instance().get::<_, Listing>(&DataKey::Listing(id.clone())) {
                if listing.available {  // Only active listings
                    listings.push_back(listing);
                }
            }
        }
        listings
    }

    /// Get a specific listing
    pub fn get_listing(env: &Env, plant_id: String) -> Option<Listing> {
        env.storage().instance().get(&DataKey::Listing(plant_id))
    }

    /// Transfer tokens between two addresses (placeholder implementation)
    pub fn transfer_tokens(env: &Env, from: Address, to: Address, amount: i128) -> Result<(), MedicinalPlantsError> {
        // Aquí se implementaría la lógica de transferencia de tokens
        // Por ejemplo, verificando saldos y actualizando el almacenamiento
        Ok(())
    }

    /// Mejorar la función de compra para incluir transferencia de tokens
    pub fn buy_listing(env: &Env, plant_id: String, buyer: Address) -> Result<bool, MedicinalPlantsError> {
        if let Some(mut listing) = env.storage().instance().get::<_, Listing>(&DataKey::Listing(plant_id.clone())) {
            if !listing.available {
                return Err(MedicinalPlantsError::NotAvailable);
            }
            
            // Simular transferencia de tokens (reemplazar con lógica real)
            Self::transfer_tokens(env, buyer.clone(), listing.seller.clone(), listing.price)?;

            listing.available = false;
            env.storage().instance().set(&DataKey::Listing(plant_id), &listing);
            return Ok(true);
        }
        Err(MedicinalPlantsError::NotAvailable)
    }
}

mod test;
