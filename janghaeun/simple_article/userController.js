import express from 'express';
import User from './models/User.js';
import mongoose from 'mongoose';
import { DATABASE_URL } from './env.js';
import generateToken from './utils/generateToken.js';

const user = express();
user.use(express.json());

function asyncHandler(handler) {
    return async function (req, res){
        try{
            await handler(req,res);
        } catch (e) {
            if(e.name === 'ValidationError'){
                res.status(400).send({message: e.message}); //bad request 
            } else if (e.name === 'CastError') {
                res.status(404).send({message: e.massage});
            } else {
                res.status(500).send({message: e.message}); //server error 
            }
        }
    }
};

user.post('/register', asyncHandler(async (req, res) => {
    const {userId, password} = await User.create(req.body);
    
    const user = await User.create({userId, password});
    if(user){
        res.status(201).send({userId: userId, token: generateToken(user._id)})
    }
    else{
        res.status(400).send({message: 'Invalid user ID.'});
    }
}));

user.post('/login', asyncHandler(async (req, res) => {
    const {userId, password} = req.body;
    const user = await User.findOne({userId});

    if(user && (await user.matchPassword(password))){
        res.send({userId: userId, token: generateToken(user._id)});
    } else{
        res.status(400).send({message: "Invalid ID or password."});
    }
}));

user.post('/logout', asyncHandler(async (req,res) => {
    
}))