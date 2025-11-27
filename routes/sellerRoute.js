const express = require("express");
const { registerSeller, verifyOTP, verifyEmail } = require("../controllers/authController");
const uploadToCloudinary = require("../middlewares/DocumentUpload");

const router = express.Router();

// Upload ID document first, then register seller
router.post("/register/seller", uploadToCloudinary, registerSeller);
// OTP Verification
router.post("/verify-otp/seller", verifyOTP);

router.get("/verify-email/:token", verifyEmail);

module.exports = router;
