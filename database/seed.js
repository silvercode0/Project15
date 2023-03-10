const {
  client,
  getAllUsers,
  createUser,
  updateUser,
  getAllPosts,
  createPost,
  updatePost,
  getPostsByUser,
  getUserById,
  createTags,
  createPostTag,
  addTagsToPost,
  getPostById,
  getPostsByTagName
} = require('./index');


//  TESTING THAT DATABASE  //
async function testDB() {
  try {
      //     STARTING THAT DATABASE UP   " woo "
      console.log("Starting to test database...");
      //    GETTING ALL USERS 
      const users = await getAllUsers();
      console.log("getAllUsers:", users);

      //    CALLING UPDATED USER 
      console.log("Calling updateUser on users[0]")
      const updateUserResult = await updateUser(users[0].id, {
          name: "Newname Sogood",
          location: "Lesterville, KY"
      });
      console.log("Result:", updateUserResult)

      //   CALLING ALL THE POSTS TO COME 
      console.log("Calling getAllPosts");
      const posts = await getAllPosts();
      console.log("Result:", posts);

      //   UPDATES POSTS 
      const updatePostResult = await updatePost(posts[0].id, {
        title: "New Title",
        content: "Updated Content"
      });
      console.log("Result:", updatePostResult);

      //  UPDATES POSTS
      console.log("Calling updatePost on posts[1], only updating tags");
      const updatePostTagsResult = await updatePost(posts[1].authorId, {
      tags: ["#youcandoanything", "#redfish", "#bluefish"]
      });
      console.log("Result:", updatePostTagsResult);

      // GETS USER BY ID 
      console.log("Calling getUserById with 1");
      const albert = await getUserById(1);
      console.log("Result:", albert);

      // GETS POST BY TAG NAME 
      console.log("Calling getPostsByTagName with #happy");
      const postsWithHappy = await getPostsByTagName("#happy");
      console.log("Result:", postsWithHappy);

      //    FINSISH THAT DATABASE TESTS    " hoo "
      console.log("Finished database tests!");
  } catch (error) {
      console.error("Error testing database!");
      throw error;
  } 
}

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

// CREATES TABLES 
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

      CREATE TABLE tags (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) UNIQUE NOT NULL
      );

      CREATE TABLE post_tags (
        "postId" INTEGER REFERENCES posts(id),
        "tagId" INTEGER REFERENCES tags(id),
        UNIQUE("postId", "tagId")
      );
      
      
    `);
    console.log("Finished building tables!");
  } catch (error) {
    console.error("Error building tables!");
    throw error;
  }
}

// REBUILDS THE DATABASE 
async function rebuildDB() {
  try {
    client.connect();
   
    await dropTables();
    await createTables();
    await createInitialUsers();
    await createInitialPosts();
    // await createInitialTags();

  } catch (error) {
    console.log("Error during rebuildDB")
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
