import mongoose from 'mongoose';

const CommentSchema = new mongoose.Schema(
    {
        content: {
            type: String,
            required: true,
            maxLenght: 100,
        },
        user:{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        }
    },
    {
        timestamps: true,
    }
)

const PostSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            requried: true,
            maxLength: 30,
            validate: {
                validator: function (title){
                    return title.split('').length>0;
                },
                message: 'Must contain at least 1 word',
            },
        },
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        content: {
            type: String,
            maxLength: 200,
        },
        comments: [CommentSchema],
        likes: {
            type: Number,
        },
    },
    {
        timestamps: true,
    }
)

const Post = mongoose.model('Post', PostSchema);

export default Post;