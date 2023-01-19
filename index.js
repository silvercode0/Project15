const PORT = 3000;
const express = require('express');
const jwt = require('jsonwebtoken');

// const dotenv = require("dotenv");

const server = express();



server.use(express.json())


const morgan = require('morgan');
server.use(morgan('dev'));

server.use((req, res, next) => {
  console.log("<____Body Logger START____>");
  console.log(req.body);
  console.log("<_____Body Logger END_____>");

  next();
});

const { client } = require('./database');
client.connect();

// const apiRouter = require('./api');
// server.use('/api', apiRouter);

server.listen(PORT, () => {
  console.log('The server is up on port', PORT)
});