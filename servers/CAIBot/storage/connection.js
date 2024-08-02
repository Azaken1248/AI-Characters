const mongoose = require('mongoose');

const uri = 'mongodb+srv://azaken:lolface123@acai-db.i9zwvy1.mongodb.net/?retryWrites=true&w=majority&appName=ACAI-DB';

const connectDB = async () => {
  try {
    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    process.exit(1); 
  }
};

module.exports = connectDB;
