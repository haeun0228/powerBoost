import mongoose from 'mongoose';
import data from './mock.js';
import Post from '../models/Post.js';
import {DATABASE_URL} from '../env.js';

mongoose.connect(DATABASE_URL);

await Post.deleteMany({});
await Post.insertMany(data);

mongoose.connection.close();
//connction을 꼭 종료해주어야 함. 