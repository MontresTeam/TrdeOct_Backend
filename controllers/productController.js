const Auction = require("../models/productModel");

const getAllProducts = async (req, res) => {
  try {
    const products = await Auction.find(); // fetch all products
    res.status(200).json({
      success: true,
      count: products.length,
      data: products
    });
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({
      success: false,
      message: "Server Error"
    });
  }
};


module.exports = { getAllProducts };
