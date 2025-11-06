#![no_std]
use soroban_sdk::{contracttype, vec, Env, Address, Vec, String};

#[derive(Clone)]
#[contracttype]
pub struct MedicinalPlant {
    id: String,
    name: String,
    scientific_name: String,
    properties: Vec<String>,
    validated: bool,
    validator: String,
}

#[derive(Clone)]
#[contracttype]
pub struct Listing {
    seller: String,
    plant_id: String,
    price: i128,
    available: bool,
}

#[contracttype]
pub enum DataKey {
    Plant(String),
    Validators,
    PlantVotes(String),
    Voted(String, String), // (plant_id, validator)
    Listing(String),       // keyed by plant_id
}

pub struct MedicinalPlantsContract;

impl MedicinalPlantsContract {
    /// Initialize storage (empty validator list)
    pub fn init(env: &Env) {
        let validators: Vec<String> = vec![&env];
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
        let plant = MedicinalPlant {
            id: id.clone(),
            name,
            scientific_name,
            properties,
            validated: false,
            validator: String::from_slice(&env, ""),
        };

        env.storage().instance().set(&DataKey::Plant(id.clone()), &plant);
        id
    }

    /// Add a validator to the validator set
    pub fn add_validator(env: &Env, validator: String) {
        let mut validators: Vec<String> = env.storage().instance().get(&DataKey::Validators).unwrap_or(vec![&env]);
        if !validators.contains(&validator) {
            validators.push_back(validator.clone());
            env.storage().instance().set(&DataKey::Validators, &validators);
        }
    }

    /// Check if a given identity is a validator
    pub fn is_validator(env: &Env, validator: String) -> bool {
        let validators: Vec<String> = env.storage().instance().get(&DataKey::Validators).unwrap_or(vec![&env]);
        validators.contains(&validator)
    }

    /// Vote for validating a plant. Once votes > 50% of validators the plant becomes validated.
    pub fn vote_for_plant(env: &Env, plant_id: String, validator: String) -> i128 {
        // must be a validator
        let validators: Vec<String> = env.storage().instance().get(&DataKey::Validators).unwrap_or(vec![&env]);
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
                plant.validator = String::from_slice(&env, "consensus");
                env.storage().instance().set(&DataKey::Plant(plant_id.clone()), &plant);
            }
        }

        votes
    }

    /// Get plant data
    pub fn get_plant(env: &Env, id: String) -> Option<MedicinalPlant> {
        env.storage().instance().get(&DataKey::Plant(id))
    }

    /// Marketplace: list a plant for sale (simple listing)
    pub fn list_for_sale(env: &Env, plant_id: String, seller: String, price: i128) {
        let listing = Listing {
            seller: seller.clone(),
            plant_id: plant_id.clone(),
            price,
            available: true,
        };
        env.storage().instance().set(&DataKey::Listing(plant_id), &listing);
    }

    /// Buy a listed plant (this example does not transfer tokens; it just marks the listing sold)
    pub fn buy_listing(env: &Env, plant_id: String, buyer: String) -> bool {
        if let Some(mut listing) = env.storage().instance().get::<_, Listing>(&DataKey::Listing(plant_id.clone())) {
            if !listing.available {
                return false;
            }
            listing.available = false;
            // In a real implementation we would transfer funds here
            env.storage().instance().set(&DataKey::Listing(plant_id), &listing);
            return true;
        }
        false
    }
}

mod test;
