const mongoose = require("mongoose");
const fs = require("fs");
const csv = require("csv-parser");

// 1. Connect to MongoDB
mongoose.connect("mongodb://localhost:27017/Tradeauct", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => console.log("MongoDB connected"))
  .catch(err => console.error(err));

// 2. Define a Product schema
const productSchema = new mongoose.Schema({}, { strict: false });
const Product = mongoose.model("Product", productSchema);

// 3. Read CSV and save to DB
const products = [];

fs.createReadStream("./models/test.products.csv")
  .pipe(csv())
  .on("data", (row) => {
    products.push(row);
  })
  .on("end", async () => {
    try {
      await Product.insertMany(products);
      console.log(`${products.length} products inserted successfully!`);
      mongoose.disconnect();
    } catch (err) {
      console.error(err);
    }
  });
