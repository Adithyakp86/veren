import mongoose from 'mongoose';

const mongoURI = process.env.MONGO_CONN_STRING ? process.env.MONGO_CONN_STRING : "mongodb://localhost:27017/verenDB";

export const connectDB = async () => {
    try {
        await mongoose.connect(mongoURI)
        console.log("Connected to MongoDb");
    } catch (error) {
        console.error('Error connecting to MongoDB:', error);
        process.exit(1);
    }
}  