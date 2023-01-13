const { 
  client, 
  getAllUsers, 
  createUser, 
  updateUser, 
  getUserById,
  createPost,
  updatePost,
  getPostsByUser,
  getAllPosts,
   
} = require('./index');

//  DROPS TABLES 
async function dropTables() {
  try {
    console.log("Starting to drop tables...");

    await client.query(`
    DROP TABLE IF EXISTS post_tags;
    DROP TABLE IF EXISTS tags;
    DROP TABLE IF EXISTS posts;
    DROP TABLE IF EXISTS users;
  `);

    console.log("Finished dropping tables!");
  } catch (error) {
    console.error("Error dropping tables!");
    throw error;
  }
}
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
//     console.log("ERROR getting posts by user")
//     throw error;
//   }
// }

// GETS ALL POSTS 
// async function getAllPosts() {
//   try {
//     const { rows: postIds } = await client.query(`
//       SELECT id
//       FROM posts;
//     `);

//     const posts = await Promise.all(postIds.map(
//       post => getPostById( post.id )
//     ));

//     return posts;
//   } catch (error) {
//     throw error;
//   }
// }

//  CREATING TAGS 
// async function createTags(tagList) {
//   if (tagList.length === 0) {
//     return;
//   }

//   const insertValues = tagList.map(
//     (_, index) => `$${index + 1}`).join('), (');

//   const selectValues = tagList.map(
//     (_, index) => `$${index + 1}`).join(', ');

//   try {
//     console.log("Creating the tags")

//     await client.query(`
//     INSERT INTO tags(name)
//     VALUES ('#tag'), ('#othertag'), ('#moretag')
//     ON CONFLICT (name) DO NOTHING, 
//     (SELECT * FROM tags
//     WHERE name
//     IN ('#tag', '#othertag', '#moretag'));
//     `)
//   } catch (error) {
//     console.log(error);
//     throw error;
//   }
// }


//  CREATES TABLES TO USE
async function createTables() {
  try {
    console.log("Starting to build tables...");

    await client.query(`
      CREATE TABLE users (
        id SERIAL PRIMARY KEY,
        username varchar(255) UNIQUE NOT NULL,
        password varchar(255) NOT NULL,
        name varchar(255) NOT NULL,
        location varchar(255) NOT NULL,
        active BOOLEAN DEFAULT true
      );
      CREATE TABLE posts (
        id SERIAL PRIMARY KEY,
        "authorId" INTEGER REFERENCES users(id),
        title varchar(255) NOT NULL,
        content TEXT NOT NULL,
        active BOOLEAN DEFAULT true
      );
    `);
    console.log("Finished building tables!");
  } catch (error) {
    console.error("Error building tables!");
    throw error;
  }
}

//  CREATES INITIAL USERS
async function createInitialUsers() {
  try {
    console.log("Starting to create users...");

    await createUser({ 
      username: 'albert', 
      password: 'bertie99',
      name: 'Al Bert',
      location: 'Sidney, Australia' 
    });
    await createUser({ 
      username: 'sandra', 
      password: '2sandy4me',
      name: 'Just Sandra',
      location: 'Ain\'t tellin\''
    });
    await createUser({ 
      username: 'glamgal',
      password: 'soglam',
      name: 'Joshua',
      location: 'Upper East Side'
    });

    console.log("Finished creating users!");
  } catch (error) {
    console.error("Error creating users!");
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
    console.log("Failed to create post tag")
    throw error;
  }
}

//   ADDS TAGS TO POST  
async function addTagsToPost(postId, tagList) {
  try {
    const createPostTagPromises = tagList.map(
      tag => createPostTag(postId, tag.id)
    );

    await Promise.all(createPostTagPromises);

    return await getPostById(postId);
  } catch (error) {
    console.log("Failed to add tags to post")
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
    console.log(post);
    return post;
  } catch (error) {
    console.log("Failed to get the post by id")
    throw error;
  }
}

//  CREATING INITIAL TAGS 
async function createInitialTags() {
  try {
    console.log("Starting to create tags...");

    const [happy, sad, inspo, catman] = await createTags([
      '#happy', 
      '#worst-day-ever', 
      '#youcandoanything',
      '#catmandoeverything'
    ]);

    const [postOne, postTwo, postThree] = await getAllPosts();

    await addTagsToPost(postOne.id, [happy, inspo]);
    await addTagsToPost(postTwo.id, [sad, inspo]);
    await addTagsToPost(postThree.id, [happy, catman, inspo]);

    console.log("Finished creating tags!");
  } catch (error) {
    console.log("Error creating tags!");
    throw error;
  }
}

// CREATES INITIAL POSTS 
async function createInitialPosts() {
  try {
    const [albert, sandra, glamgal] = await getAllUsers();

    console.log("Starting to create posts...");
    await createPost({
      authorId: albert.id,
      title: "First Post",
      content: "This is my first post. I hope I love writing blogs as much as I love writing them.",
      tags: ["#happy", "#youcandoanything"]
    });

    await createPost({
      authorId: sandra.id,
      title: "How does this work?",
      content: "Seriously, does this even do anything?",
      tags: ["#happy", "#worst-day-ever"]
    });

    await createPost({
      authorId: glamgal.id,
      title: "Living the Glam Life",
      content: "Do you even? I swear that half of you are posing.",
      tags: ["#happy", "#youcandoanything", "#canmandoeverything"]
    });
    console.log("Finished creating posts!");
  } catch (error) {
    console.log("Error creating posts!");
    throw error;
  }
}
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


//  REBUILDS THE DATABASE 
async function rebuildDB() {
  try {
    client.connect();

    await dropTables();
    await createTables();
    await createInitialUsers();
    await createInitialPosts();
    await createInitialTags();

  } catch (error) {
    console.log("Error during rebuildDB")
    throw error;
  }
}

//  TESTING THE DATABASE  //
async function testDB() {
  try {
    console.log("Starting to test database...");

    console.log("Calling getAllUsers")
    const users = await getAllUsers();
    console.log("Result:", users);

    console.log("Calling updateUser on users[0]")
    const updateUserResult = await updateUser(users[0].id, {
      name: "Newname Sogood",
      location: "Lesterville, KY"
    });
    console.log("Result:", updateUserResult);

    console.log("Calling getAllPosts");
    const posts = await getAllPosts();
    console.log("Result:", posts);

    console.log("Calling updatePost on posts[1], only updating tags");
    const updatePostTagsResult = await updatePost(posts[1].id, {
      tags: ["#youcandoanything", "#redfish", "#bluefish"]
    });
    console.log("Result:", updatePostTagsResult);

    onsole.log("Calling getPostsByTagName with #happy");
    const postsWithHappy = await getPostsByTagName("#happy");
    console.log("Result:", postsWithHappy);

    console.log("Calling getUserById with 1");
    const albert = await getUserById(1);
    console.log("Result:", albert);

    console.log("Finished database tests!");
  } catch (error) {
    console.error("Error testing database!");
    throw error;
  }
}


rebuildDB()
  .then(testDB)
  .catch(console.error)
  .finally(() => client.end());
// 
// async function testDB() {
//   try {
//     client.connect();
//     const  users = await getAllUsers();
//     console.log(users);
//     // const { rows } = await client.query(`SELECT * FROM users;`);
//     // console.log(rows);
//   } catch (error) {
//     console.error(error);
//   } finally {
//     client.end();
//   }
// }

// async function dropTables() {
//   try {
//     await client.query(`
//       DROP TABLE IF EXISTS users;
//     `);
//   } catch (error) {
//     throw error;
//   }// we pass the error up to the function that calls dropTables
// }
  
// async function createTables() {
//   try {
//     await client.query(`
//       CREATE TABLE users (
//         id SERIAL PRIMARY KEY,
//         username varchar(255) UNIQUE NOT NULL,
//         password varchar(255) NOT NULL
//       );
//     `);
//   } catch (error) {
//     throw error; // we pass the error up to the function that calls createTables
//   }
// }

// async function rebuildDB() {
//   try {
//     client.connect();

//     await dropTables();
//     await createTables();
//   } catch (error) {
//     console.error(error);
//   } finally {
//     client.end();
//   }
// }

// rebuildDB();

// testDB();
