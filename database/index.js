// const app = express();

const { Client } = require('pg');

const client = new Client('postgres://localhost:5432/juicebox');
//  GET ALL USERS 
async function getAllUsers() {
    try {
      const { rows } = await client.query(`
        SELECT id, username, name, location, active 
        FROM users;
      `);
      console.log(rows);
      return rows;
    } catch (error) {
      console.log(error);
      throw error;
    }
  }
  //  CREATE USER
async function createUser({ 
    username, 
    password,
    name,
    location
  }) {
    try {
        const { rows: [ user ] } = await client.query(`
        INSERT INTO users(username, password, name, location) 
        VALUES($1, $2, $3, $4) 
        ON CONFLICT (username) DO NOTHING 
        RETURNING *;
      `, [username, password, name, location]);
      console.log(user);
      return user;
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

// GET USER BY ID 
async function getUserById(userId) {
  try {
    const { rows: [ user ] } = await client.query(`
      SELECT id, username, name, location, active
      FROM users
      WHERE id=${ userId }
    `);

    if (!user) {
      return null
    }

    user.posts = await getPostsByUser(userId);

    return user;
  } catch (error) {
    throw error;
  }
}

//  UPDATE USER 
  async function updateUser(id, fields = {}) {
    // build the set string
    const setString = Object.keys(fields).map(
      (key, index) => `"${ key }"=$${ index + 1 }`
    ).join(', ');
  
    // return early if this is called without fields
    if (setString.length === 0) {
      return;
    }
  
    try {
        const { rows: [ user ] } = await client.query(`
          UPDATE users
          SET ${ setString }
          WHERE id=${ id }
          RETURNING *;
        `, Object.values(fields));
        console.log(user);
        return user;
      } catch (error) {
        console.log(error);
        throw error;
      }
    }

// POSTS // 
// CREATE POST 
async function createPost({
  authorId,
  title,
  content
})  {
  try {
    const { rows: [ post ] } = await client.query(`
    INSERT INTO posts("authorId", title, content) 
    VALUES($1, $2, $3)
    RETURNING *;
  `, [authorId, title, content]); 

    console.log(post);
    return post;
  } catch (error) {
    console.log(error);
    throw error;
  }
}

//  GET POSTS BY USER  
async function getPostsByUser() {
  try {
    const { rows } = await client.query(`
    SELECT * 
    FROM posts 
    WHERE "authorId"=${ userId };
    `);
    console.log(rows);
    return rows;
  } catch (error) {
    console.log(error);
    throw error;
  }
}
//   GETS ALL THE POSTS 
async function getAllPosts() {
  try {
    const { rows } = await client.query(` 
      SELECT * FROM posts; 
    `);
    console.log(rows);
    return rows;
  } catch (error) {
    console.log(error);
    throw error;
  }
}
//  UPDATES THE POST 
async function updatePost(id, fields = {}) {
  const setString = Object.keys(fields).map(
    (key, index) => `"${ key }"=$${ index + 1 }`
  ).join(', ');

  if (setString.length === 0) {
    return;
  }

  try {
    const { rows: [ post ] } = await client.query(`
      UPDATE posts
      SET ${ setString }
      WHERE id=${ id }
      RETURNING *;
    `, Object.values(fields));
    console.log(post);
    return post;
  } catch (error) {
    console.log(error);
    throw error;
  }
}

//  MODULE EXPORTS  //
module.exports = {
  client,
  getAllUsers,
  createUser, 
  updateUser,
  createPost,
  updatePost,
  getPostsByUser,
  getAllPosts,
  getUserById
}

