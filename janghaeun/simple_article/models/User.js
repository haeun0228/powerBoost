import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
    },
    },
    {
        timestamps: true,
    }
)
userSchema.pre('save', async function (next){
    //이미 해싱된 비밀번호는 넘어간다. 
    if(!this.isModified('password')){
        return next();
    }
    //비밀번호 해싱 
    const salt = await bycrpt.genSalt(10);
    this.password = await bycrypt.hash(this.password, salt);
    next();
})

//비밀번호 확인 
userSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', userSchema);

export default User;

