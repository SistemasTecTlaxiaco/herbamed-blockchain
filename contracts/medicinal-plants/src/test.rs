#![cfg(test)]

use crate::MedicinalPlantsContract;
use soroban_sdk::{vec, Env, String, Vec};

#[test]
fn test_register_and_vote() {
    let env = Env::default();
    MedicinalPlantsContract::init(&env);

    // Add two validators
    let v1 = String::from_slice(&env, "validator1");
    let v2 = String::from_slice(&env, "validator2");
    MedicinalPlantsContract::add_validator(&env, v1.clone());
    MedicinalPlantsContract::add_validator(&env, v2.clone());

    // Register a plant
    let id = String::from_slice(&env, "001");
    let name = String::from_slice(&env, "Manzanilla");
    let scientific_name = String::from_slice(&env, "Matricaria chamomilla");
    let properties: Vec<String> = vec![
        &env,
        String::from_slice(&env, "Antiinflamatorio"),
        String::from_slice(&env, "Calmante"),
    ];

    let _ = MedicinalPlantsContract::register_plant(
        &env,
        id.clone(),
        name,
        scientific_name,
        properties,
    );

    // First validator votes
    let votes = MedicinalPlantsContract::vote_for_plant(&env, id.clone(), v1.clone());
    assert_eq!(votes, 1);

    // Second validator votes -> should reach majority (2 of 2) and validate
    let votes = MedicinalPlantsContract::vote_for_plant(&env, id.clone(), v2.clone());
    assert_eq!(votes, 2);

    let plant = MedicinalPlantsContract::get_plant(&env, id.clone()).unwrap();
    assert_eq!(plant.validated, true);
}

#[test]
fn test_listing_and_buy() {
    let env = Env::default();
    MedicinalPlantsContract::init(&env);

    // Register a plant and list it
    let id = String::from_slice(&env, "100");
    let name = String::from_slice(&env, "Hierbabuena");
    let scientific_name = String::from_slice(&env, "Mentha spicata");
    let properties: Vec<String> = vec![&env, String::from_slice(&env, "Digestiva")];
    let _ = MedicinalPlantsContract::register_plant(&env, id.clone(), name, scientific_name, properties);

    let seller = String::from_slice(&env, "seller1");
    MedicinalPlantsContract::list_for_sale(&env, id.clone(), seller, 500i128);

    let buyer = String::from_slice(&env, "buyer1");
    let ok = MedicinalPlantsContract::buy_listing(&env, id.clone(), buyer);
    assert!(ok);
}
