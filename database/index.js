// const app = express();
const { createTags } = require('./seed.js');
const { Client } = require('pg');

const client = new Client('postgres://localhost:5432/juicebox');

const originalPost = {
  title: "title",
  content: "content",
  tags: ["#x", "#y", "#z"]
}

const updatedPost = {
  id: 3,
  title: "new title",
  content: "maybe this changed",
  tags: ["#x", "z", "w"]
}

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
    console.log(user);
    return user;
  } catch (error) {
    console.log(error);
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
  content,
  tags = [] // this is new
}) {
  try {
    const { rows: [ post ] } = await client.query(`
      INSERT INTO posts("authorId", title, content) 
      VALUES($1, $2, $3)
      RETURNING *;
    `, [authorId, title, content]);

    const tagList = await createTags(tags);

    return await addTagsToPost(post.id, tagList);
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
async function updatePost(postId, fields = {}) {
  const { tags } = fields; 
  delete fields.tags;
  const setString = Object.keys(fields).map(
    (key, index) => `"${ key }"=$${ index + 1 }`
  ).join(', ');

  try {
    if (setString.length > 0) {
      await client.query(`
        UPDATE posts
        SET ${ setString }
        WHERE id=${ postId }
        RETURNING *;
      `, Object.values(fields));
    }
    if (tags === undefined) {
      return await getPostById(postId);
    }

    const tagList = await createTags(tags);

    const tagListIdString = tagList.map(
      tag => `${ tag.id }`
    ).join(', ');

    await client.query(`
      DELETE FROM post_tags
      WHERE "tagId"
      NOT IN (${ tagListIdString })
      AND "postId"=$1;
    `, [postId]);

    await addTagsToPost(postId, tagList);

    return await getPostById(postId);

  } catch (error) {

    console.log(error);

    throw error;
  }
}



//   ADDS TAGS TO POST  
// async function addTagsToPost(postId, tagList) {
//   try {
//     const createPostTagPromises = tagList.map(
//       tag => createPostTag(postId, tag.id)
//     );

//     await Promise.all(createPostTagPromises);

//     return await getPostById(postId);
//   } catch (error) {
//     console.log("Failed to add tags to post")
//     throw error;
//   }
// }


// GETING POSTS BY USER 
// async function getPostsByUser(userId) {
//   try {
//     const { rows: postIds } = await client.query(`
//       SELECT id 
//       FROM posts 
//       WHERE "authorId"=${ userId };
//     `);

//     const posts = await Promise.all(postIds.map(
//       post => getPostById( post.id )
//     ));

//     return posts;
//   } catch (error) {
//     throw error;
//   }
// }

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
  getUserById,
  createTags
  // addTagsToPost
}

