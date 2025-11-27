// utils/generateEmailToken.js
const jwt = require("jsonwebtoken");
require("dotenv").config();

/**
 * Generate a JWT token for email verification
 * @param {string} userId - MongoDB seller/user ID
 * @returns {string} - JWT token
 */
function generateEmailToken(userId) {
  if (!userId) throw new Error("User ID is required");

  return jwt.sign({ id: userId }, process.env.EMAIL_TOKEN_SECRET, {
    expiresIn: "24h",
  });
}

module.exports = generateEmailToken; // <-- export function directly
