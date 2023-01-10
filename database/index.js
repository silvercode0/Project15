// const app = express();

const { Client } = require('pg');

const client = new Client('postgres://localhost:5432/juicebox');

async function getAllUsers() {
    const { rows } = await client.query(
      `SELECT id, username 
      FROM users;
    `);
  
    return rows;
}
  
async function createUser({ username, password }) {
    try {
        // INSERT INTO users(username, password) 
        // VALUES($1, $2) 
        // ON CONFLICT (username) DO NOTHING 
        // RETURNING *;
      const rows = await client.query(`

         INSERT INTO users(username, password) 
         VALUES($1, $2) 
         ON CONFLICT (username) DO NOTHING 
         RETURNING users;
        
      `, [username, password]);
  
      return rows;
    } catch (error) {
      throw error;
    }
  }

  // and export them
  module.exports = {
    client,
    getAllUsers,
    createUser
}

