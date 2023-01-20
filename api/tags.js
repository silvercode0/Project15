const express = require('express');
const tagsRouter = express.Router();

const { getAllTags, getPostsByTagName } = require('../database');

tagsRouter.use((req, res, next) => {
    console.log("A request is being made to /tags");
    next();
});

tagsRouter.get('/', async (req, res) => {
    const tags = await getAllTags();

    res.send({
        tags
    });
});

tagsRouter.get('/:tagName/posts', async (req, res, next) => {
    const tagName = req.params.tagName
    try {
        const posts = await getPostsByTagName(tagName);
        res.send({ posts })
    } catch ({ name, message }) {
        next({ name, message });
    }
});

module.exports = tagsRouter;