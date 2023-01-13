const { Client } = require('pg');

const client = new Client('postgres://localhost:5432/juicebox');

//  GET ALL USERS 
async function getAllUsers() {
  try {
    const { rows } = await client.query(`
        SELECT id, username, name, location, active 
        FROM users;
      `);
      // console.log(rows);
    return rows;
  } catch (error) {
      // console.log(error);
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
      // console.log(user);
      return user;
    } catch (error) {
      // console.log(error);
      throw error;
    }
  }
//  UPDATE USER 
async function updateUser(id, fields = {}) {

  const setString = Object.keys(fields).map(
      (key, index) => `"${ key }"=$${ index + 1 }`
    ).join(', ');

    if (setString.length === 0) {
      return;
    }
  
    try {
    const { rows: [user]} = await client.query(`
      UPDATE users
      SET ${ setString }
      WHERE id=${ id }
      RETURNING *;
    `, Object.values(fields));

    return user;
  } catch (error) {
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
    // console.log(user);
    return user;
  } catch (error) {
    // console.log(error);
    throw error;
  }
}

// POSTS // 
//   GETS ALL THE POSTS 
async function getAllPosts() {
  try {
    const { rows: postIds } = await client.query(`
      SELECT "authorId"
      FROM posts;
    `);
   
    const posts = await Promise.all(postIds.map(
      post => getPostById( post.authorId )
    ));
    

    return posts;
  } catch (error) {
    throw error;
  }
}


// CREATE POST 
async function createPost({
  authorId,
  title,
  content,
  tags = [] 
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
    // console.log(error);
    throw error;
  }
}

//  UPDATES THE POST 
async function updatePost(id, fields = {}) {
  const { tags } = fields;

  delete fields.tags;

  const setString = Object.keys(fields).map(
    (key, index) => `"${ key }"=$${ index + 1 }`
  ).join(', ');

  if (setString.length === 0) {
    return;
  }
  
  try {
    if (setString.length > 0) {
      await client.query(`
        UPDATE posts
        SET ${ setString }
        WHERE id=${ id }
        RETURNING *;
      `, Object.values(fields));
    }
    if (tags === undefined) {
      return await getPostById(id);
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

    await addTagsToPost(id, tagList);

    return await getPostById(id);

  } catch (error) {

    // console.log(error);

    throw error;
  }
}

//  GET POSTS BY USER  
async function getPostsByUser(userId) {
  try {
    const { rows: postIds } = await client.query(`
    SELECT id
    FROM posts 
    WHERE "authorId"=${ userId };
    `);

    const posts = await Promise.all(postIds.map(
      post => getPostById( post.id )
    ));

    // console.log(rows);
    return posts;
  } catch (error) {
    // console.log(error);
    throw error;
  }
}

//  CREATES TAGS 
async function createTags(tagList) {
  if (tagList.length === 0) {
    return;
  }

  const insertValues = tagList.map(
    (_, index) => `$${index + 1}`).join('), (');

  const selectValues = tagList.map(
    (_, index) => `$${index + 1}`).join(', ');

  try {
    // console.log("Creating the tags")
    await client.query(`
    INSERT INTO tags(name)
    VALUES (${insertValues})
    ON CONFLICT (name) DO NOTHING;
  `, tagList);

    const {rows} = await client.query(`
    SELECT * FROM tags
    WHERE name
    IN (${selectValues});
  `, tagList);
    return rows;
  } catch (error) {
    // console.log(error);
    throw error;
  }
}

async function getAllTags() {
  try{
    const { rows } = await client.query(`
      SELECT *
      FROM tags;
    `);
  
    return rows;
  } catch(error) {
    throw error;
  }
}

//   CREATES POST TAG 
async function createPostTag(postId, tagId) {
  try {
    await client.query(`
      INSERT INTO post_tags("postId", "tagId")
      VALUES ($1, $2)
      ON CONFLICT ("postId", "tagId") DO NOTHING;
    `, [postId, tagId]
    );

  } catch (error) {
    // console.log("Failed to create post tag")
    throw error;
  }
}
// ADDS A TAG TO POST //
async function addTagsToPost(postId, tagList) {
  try {
    const createPostTagPromises = tagList.map(
      tag => createPostTag(postId, tag.id)
    );

    await Promise.all(createPostTagPromises);

    return await getPostById(postId);
  } catch (error) {
    // console.log("Failed to add tags to post")
    throw error;
  }
}

//   GETTING THE POST BY ID 
async function getPostById(postId) {
  try {
    const { rows: [ post ]  } = await client.query(`
      SELECT *
      FROM posts
      WHERE id=$1;
    `, [postId]);

    if (!post) {
      throw {
        name: "PostNotFoundError",
        message: "Could not find a post with that postId"
      };
    }

    const { rows: tags } = await client.query(`
      SELECT tags.*
      FROM tags
      JOIN post_tags ON tags.id=post_tags."tagId"
      WHERE post_tags."postId"=$1;
    `, [postId])

    const { rows: [author] } = await client.query(`
      SELECT id, username, name, location
      FROM users
      WHERE id=$1;
    `, [post.authorId])

    post.tags = tags;
    post.author = author;

    delete post.authorId;

    // console.log(post);

    return post;
  } catch (error) {
    // console.log("Failed to get the post by id")
    throw error;
  }
}

//   GETS POSTS BY ITS TAG NAME 
async function getPostsByTagName(tagName) {
  try {
    const { rows: postIds } = await client.query(`
      SELECT posts.id
      FROM posts
      JOIN post_tags ON posts.id=post_tags."postId"
      JOIN tags ON tags.id=post_tags."tagId"
      WHERE tags.name=$1;
    `, [tagName]);

    return await Promise.all(postIds.map(
      post => getPostById(post.id)
    ));
  } catch (error) {
    throw error;
  }
} 

//  GETS USER BY THEIR USERNAME 
async function getUserByUsername(username) {
  try {
    const { rows: [user] } = await client.query(`
      SELECT *
      FROM users
      WHERE username=$1
    `, [username]);

    return user;
  } catch (error) {
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
  createUser,
  updateUser,
  getAllUsers,
  getUserById,
  createPost,
  updatePost,
  getAllPosts,
  getPostsByUser,
  createTags,
  addTagsToPost,
  getAllTags,
  getPostById,
  createPostTag,
  getPostsByTagName,
  getUserByUsername
}
