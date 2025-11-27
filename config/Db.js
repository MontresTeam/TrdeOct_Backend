const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    await mongoose.connect('mongodb+srv://farhandev24_db_user:farru40123ra@cluster0.rzs5wtu.mongodb.net/?retryWrites=true&w=majority', {
    });  

    console.log("✅ MongoDB Connected Successfully");
  } catch (error) {
    console.error("❌ MongoDB Connection Error:", error.message);
  }
};

module.exports = connectDB;
