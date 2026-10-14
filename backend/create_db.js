const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function createDatabase() {
  try {
    console.log('Connecting to MySQL server...');
    // Connect without specifying a database
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      multipleStatements: true // Allow executing the entire schema file at once
    });

    const dbName = process.env.DB_NAME || 'Vairavan_koil';
    console.log(`Dropping database '${dbName}' if it exists...`);
    await connection.query(`DROP DATABASE IF EXISTS ??`, [dbName]);
    
    console.log(`Creating database '${dbName}'...`);
    await connection.query(`CREATE DATABASE ??`, [dbName]);
    
    console.log(`Using database '${dbName}'...`);
    await connection.query(`USE ??`, [dbName]);

    console.log('Reading schema.mysql.sql...');
    const schemaPath = path.join(__dirname, 'src', 'db', 'schema.mysql.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');

    console.log('Executing schema script...');
    await connection.query(schemaSql);

    console.log('Database and tables created successfully!');
    await connection.end();
    process.exit(0);
  } catch (err) {
    console.error('Failed to create database:', err);
    process.exit(1);
  }
}

createDatabase();
