#![cfg(test)]

use crate::MedicinalPlantsContract;
use soroban_sdk::{
    testutils::{Address as _},
    Address, Env, String, Vec, vec,
};

#[test]
fn test_register_and_vote() {
    let env = Env::default();
    
    // Create contract address
    let contract_id = Address::generate(&env);
    env.register_contract(&contract_id, MedicinalPlantsContract {});
    
    // Create validator addresses
    let validator1 = Address::generate(&env);
    let validator2 = Address::generate(&env);
    
    // Initialize contract
    env.mock_all_auths();
    env.as_contract(&contract_id, || MedicinalPlantsContract::init(&env));    // Add validators
    env.mock_all_auths();
    env.as_contract(&contract_id, || MedicinalPlantsContract::add_validator(&env, validator1.clone()));
    env.as_contract(&contract_id, || MedicinalPlantsContract::add_validator(&env, validator2.clone()));    // Register a plant
    let id = String::from_str(&env, "001");
    let name = String::from_str(&env, "Manzanilla");
    let scientific_name = String::from_str(&env, "Matricaria chamomilla");
    let properties: Vec<String> = vec![
        &env,
        String::from_str(&env, "Antiinflamatorio"),
        String::from_str(&env, "Calmante"),
    ];

    env.mock_all_auths();
    env.as_contract(&contract_id, || MedicinalPlantsContract::register_plant(&env, id.clone(), name, scientific_name, properties));    // First validator votes
    env.mock_all_auths();
    let votes = env.as_contract(&contract_id, || MedicinalPlantsContract::vote_for_plant(&env, id.clone(), validator1.clone()));
    assert_eq!(votes, 1);    // Second validator votes
    env.mock_all_auths();
    let votes = env.as_contract(&contract_id, || MedicinalPlantsContract::vote_for_plant(&env, id.clone(), validator2.clone()));
    assert_eq!(votes, 2);    // Verify plant is validated
        let plant = env.as_contract(&contract_id, || MedicinalPlantsContract::get_plant(&env, id.clone())).unwrap();
    assert_eq!(plant.validated, true);
    assert_eq!(plant.validator, validator2); // Last validator that made it reach consensus
}

#[test]
fn test_listing_and_buy() {
    let env = Env::default();
    
    // Create contract address
    let contract_id = Address::generate(&env);
    env.register_contract(&contract_id, MedicinalPlantsContract {});
    
    // Create seller and buyer addresses
    let seller = Address::generate(&env);
    let buyer = Address::generate(&env);
    
    // Initialize contract
    env.mock_all_auths();
    env.as_contract(&contract_id, || MedicinalPlantsContract::init(&env));    // Register a plant
    let id = String::from_str(&env, "100");
    let name = String::from_str(&env, "Hierbabuena");
    let scientific_name = String::from_str(&env, "Mentha spicata");
    let properties: Vec<String> = vec![&env, String::from_str(&env, "Digestiva")];

    env.mock_all_auths();
    env.as_contract(&contract_id, || MedicinalPlantsContract::register_plant(&env, id.clone(), name, scientific_name, properties));    // List plant for sale
    env.mock_all_auths();
    env.as_contract(&contract_id, || MedicinalPlantsContract::list_for_sale(&env, id.clone(), seller.clone(), 500i128));    // Buy listing
    env.mock_all_auths();
    let ok = env.as_contract(&contract_id, || MedicinalPlantsContract::buy_listing(&env, id.clone(), buyer.clone()));
    // `buy_listing` returns `Result<bool, MedicinalPlantsError>` so unwrap and assert
    assert!(ok.is_ok());
    assert_eq!(ok.unwrap(), true);
}
