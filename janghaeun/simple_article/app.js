import express from 'express';
import Post from './models/Post.js';
import mongoose from 'mongoose';
import { DATABASE_URL } from './env.js';
import { protect } from './middleware/authMiddleware.js'


const app = express();
app.use(express.json());

function asyncHandler(handler) {
    return async function (req, res){
        try{
            await handler(req,res);
        } catch (e) {
            if(e.name === 'ValidationError'){
                res.status(400).send({message: e.message}); //bad request 
            } else if (e.name === 'CastError') {
                res.status(404).send({message: 'Post not found'});
            } else {
                res.status(500).send({message: e.message}); //server error 
            }
        }
    }
}

// 게시판 조회
app.get('/posts', asyncHandler (async (req, res) => {
    const sort = req.query.sort;
    const compareFn = 
        sort === 'new'
        ? {createdAt: 'asc'}
        : {createdAt: 'desc'};
    let sortedPosts = await Post.find().sort(compareFn);
    res.send(sortedPosts);
}));

// 특정 게시물 조회
app.get('/posts/:postId', asyncHandler(async (req, res) => {
    const post = await Post.findById(req.params.postId);
    if (post) {
        res.send(post);
    } else {
        res.status(404).send({ message: "Post not found." });
    }
}));

// 게시물 생성
app.post('/posts', protect, asyncHandler(async (req, res) => {
    const newPost = await Post.create({...req.body, user: req.user._id});
    res.status(201).send(newPost);
}));

// 댓글 생성
app.post('/posts/:postId/comments', protect, asyncHandler(async (req, res) => {
    const post = await Post.findById(req.params.postId);
    if (post) {
        post.comments.push({...req.body, user:req.user_id});
        await post.save();
        // 새로 추가된 댓글만 응답으로 보내기 
        const newComment = post.comments[post.comments.length-1];
        res.status(201).send(newComment);
    } else {
        res.status(404).send({ message: "Post not found." });
    }
}));

// 특정 게시물에 좋아요 누르기, 췬소하기 
app.post('/posts/:postId/likes', protect, asyncHandler(async (req, res) => {
    const post = await Post.findById(req.params.postId);
    if (post) {
        post.likes += 1;
        await post.save();
        res.status(200).json(post.likes);
    } else {
        res.status(404).send({ message: "Post not found" });
    }
}));

// 게시물 수정하기
app.patch('/posts/:postId', protect, asyncHandler(async (req, res) => {
    const id = req.params.postId;
    const post = await Post.findById(id);
    if (post) {
        if(post.user.toString() !== req.user._id.toString()){
            return res.status(403).send({message: "You cna only edit your post."});
        }
        Object.keys(req.body).forEach((key) => {
            post[key] = req.body[key];
        });
        await post.save();
        res.send(post);
    } else {
        res.status(404).send({ message: 'Post not found.' });
    }
}));

// 게시물 삭제하기
app.delete('/posts/:postId', protect, asyncHandler(async (req, res) => {
    const id = req.params.postId;
    const post = await Post.findById(id);
    if (post) { 
        if(post.user.toString() !== req.user._id.toString()){
            return res.status(403).send({ message: 'You can only delete your post.' });
        }
        res.status(204).end();
    } else {
        res.status(404).send({ message: "Post not found." });
    }
}));

// 댓글 삭제하기 
app.delete('/posts/:postId/comments/:commentId', asyncHandler(async (req, res) => {
    const post = await Post.findById(req.params.postId);
    if (post) {
        const commentIndex = post.comments.findIndex(comment => comment._id === Number(req.params.commentId));   
        if (commentIndex !== -1) {
            if (post.user.toString() !== req.user._id.toString()) {
                return res.status(403).send({ message: 'You can only delete your own comments' });
            }
            post.comments.splice(commentIndex, 1);
            await post.save();
            res.status(204);
        } else {
            res.status(404).send({ message: "Comment not found." });
        }
        } 
    else {
        res.status(404).send({ message: "Post not found." });
    }
}));


app.listen(3000, () => console.log('server started'));

mongoose.connect(DATABASE_URL).then(() => console.log('Connected to DB'));
