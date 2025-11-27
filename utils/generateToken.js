// utils/generateToken.js
const jwt = require("jsonwebtoken");
require("dotenv").config();

/**
 * Generate JWT Token
 * @param {String} userId - MongoDB user ID
 * @returns {String} Signed JWT Token
 */
function generateToken(userId) {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: "7d", // Token valid for 7 days
  });
}

module.exports = { generateToken };
