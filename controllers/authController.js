const { generateOTP } = require("../utils/otp");
const { sendWhatsAppMessage } = require("../utils/whatsapp");
const { generateToken } = require("../utils/generateToken"); // your existing JWT
const Seller = require("../models/sellerModel");
const sendEmail = require("../config/email");
const generateEmailToken = require("../utils/generateEmailToken");
const jwt = require("jsonwebtoken");

// -------------------------------
// @desc    Register Seller
// @route   POST /api/auth/register/seller
// @access  Public
// -------------------------------
const registerSeller = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      countryCode,
      phone,
      password,
      confirmPassword,
      idType,
      idNumber,
    } = req.body;

    const uploadedFiles = req.body.uploadedFiles || [];

    // 1️⃣ Validate required fields
    if (
      !firstName ||
      !lastName ||
      !email ||
      !countryCode ||
      !phone ||
      !password ||
      !confirmPassword ||
      !idType ||
      !idNumber ||
      uploadedFiles.length === 0
    ) {
      return res.status(400).json({
        message: "Please fill all required fields and upload ID document",
      });
    }

    // 2️⃣ Password match
    if (password !== confirmPassword) {
      return res.status(400).json({ message: "Passwords do not match" });
    }

    // 3️⃣ Check existing email/phone
    const existingEmail = await Seller.findOne({ email });
    if (existingEmail)
      return res.status(400).json({ message: "Email already registered" });

    const existingPhone = await Seller.findOne({ phone });
    if (existingPhone)
      return res
        .status(400)
        .json({ message: "Phone number already registered" });

    // 4️⃣ Create seller (pending admin approval & emailVerified false)
    const seller = await Seller.create({
      firstName,
      lastName,
      email,
      countryCode,
      phone,
      password,
      confirmPassword,
      idType,
      idNumber,
      idDocument: uploadedFiles.find((f) => f.type === "main").url,
      emailVerified: false,
      isApproved: "pending",
    });

    // 5️⃣ Generate OTP
    // 5️⃣ Generate 4-digit OTP
    const otp = generateOTP(4); // e.g., returns 4-digit string

    // 6️⃣ Send OTP via WhatsApp
    const message = `Hello ${firstName}, welcome to TradeOct Auction Platform! Your verification code is: ${otp}`;
    await sendWhatsAppMessage(`${countryCode}${phone}`, message);

    // 7️⃣ Save OTP + expiry (5 minutes)
    seller.otp = otp;
    seller.otpExpiry = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes from now
    await seller.save();

    // 6️⃣ Generate email confirmation token
    // Generate email token
    const emailToken = generateEmailToken(seller._id); // pass seller._id
    seller.emailToken = emailToken;
    seller.emailTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await seller.save();

    // 7️⃣ Send confirmation email
    const confirmUrl = `${process.env.FRONTEND_URL}/verify-email/${emailToken}`;
   const html = `
<div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f7; padding: 40px 0;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 10px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); overflow: hidden; border-top: 6px solid #f87171;">
    
    <!-- Header -->
    <div style="text-align: center; padding: 30px;">
      <h1 style="color: #333333; font-size: 24px; margin: 0;">Welcome to TradeOct Auction</h1>
      <p style="color: #555555; font-size: 16px; margin: 10px 0 0;">Hi ${firstName}, please confirm your email address.</p>
    </div>

    <!-- Body -->
    <div style="padding: 0 30px 40px;">
      <p style="color: #555555; font-size: 16px; line-height: 1.6;">
        Thank you for signing up with TradeOct Auction. To activate your account and start using our platform,
        please confirm your email address by clicking the button below.
      </p>
      
      <!-- Button -->
      <div style="text-align: center; margin: 30px 0;">
        <a href="${confirmUrl}" 
           style="background-color: #f87171; color: #ffffff; text-decoration: none; padding: 15px 30px; border-radius: 6px; font-weight: bold; display: inline-block;">
          Confirm Email
        </a>
      </div>

      <!-- Additional Message -->
      <p style="color: #555555; font-size: 15px; line-height: 1.6; margin-top: 20px;">
        This link will expire in <strong>24 hours</strong>.  
        If you did not sign up for a TradeOct account, you can safely ignore this email.
      </p>

      <p style="color: #555555; font-size: 15px; line-height: 1.6; margin-top: 30px;">
        Best regards,<br />
        <strong>The TradeOct Auction Team</strong>
      </p>
    </div>

    <!-- Footer -->
    <div style="background-color: #f4f4f7; text-align: center; padding: 20px; font-size: 12px; color: #aaaaaa;">
      &copy; ${new Date().getFullYear()} TradeOct Auction. All rights reserved.
    </div>

  </div>
</div>
`;


    await sendEmail(seller.email, "Email Confirmation - TradeOct", html);

    // 7️⃣ Response
    return res.status(201).json({
      message:
        "Seller registered successfully, pending admin approval. OTP sent via WhatsApp.",
      seller: {
        id: seller._id,
        fullName: seller.firstName + " " + seller.lastName,
        email: seller.email,
        phone: `${seller.countryCode}${seller.phone}`,
        idType: seller.idType,
        idDocument: seller.idDocument,
        isApproved: seller.isApproved,
        emailVerified: seller.emailVerified,
      },
      token: generateToken(seller._id),
    });
  } catch (error) {
    console.log("Register Seller Error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// -------------------------------
// @desc    Verify OTP Only
// @route   POST /api/auth/verify-otp
// @access  Public
// -------------------------------
const verifyOTP = async (req, res) => {
  try {
    const { otp } = req.body;

    // 1️⃣ Validate OTP
    if (!otp) {
      return res.status(400).json({ message: "OTP is required" });
    }

    // Must be a 4 digit number
    if (!/^\d{4}$/.test(otp)) {
      return res.status(400).json({ message: "OTP must be a 4-digit code" });
    }

    // 2️⃣ Find seller with the OTP
    const seller = await Seller.findOne({ otp });

    if (!seller) {
      return res.status(400).json({ message: "Invalid OTP" });
    }
    if (!seller.otpExpiry || Date.now() > seller.otpExpiry.getTime()) {
      return res.status(400).json({ message: "OTP expired. Request new OTP." });
    }

    const currentTime = new Date();
    if (currentTime > seller.otpExpiry) {
      // Clean up expired OTP
      seller.otp = null;
      seller.otpExpiry = null;
      await seller.save();

      return res.status(400).json({ message: "OTP expired. Request new OTP." });
    }

    // 4️⃣ Remove OTP after successful verification
    seller.otp = null;
    seller.otpExpiry = null;
    seller.isVerified = true; // Mark as verified
    await seller.save();

      // 5️⃣ Response
    return res.status(200).json({
      message: "OTP verified successfully",
      seller: {
        id: seller._id,
        email: seller.email,
        isVerified: seller.isVerified
      }
    });
  } catch (error) {
    console.log("Verify OTP Error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};


 const resendOTP = async (req,res)=>{
  try {
    
  } catch (error) {
    
  }
 }


const verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;

    if (!token) {
      return res.status(400).json({ message: "Invalid token" });
    }

    // Verify JWT token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.EMAIL_TOKEN_SECRET);
    } catch (err) {
      // Token invalid or expired
      return res.status(400).json({ message: "Token is invalid or expired" });
    }

    // Find seller by ID and token
    const seller = await Seller.findOne({ _id: decoded.id, emailToken: token });
    if (!seller) {
      return res
        .status(400)
        .json({ message: "Seller not found or token expired" });
    }

    // Update email verification status
    seller.emailVerified = true;
    seller.emailToken = undefined;
    seller.emailTokenExpiry = undefined;
    await seller.save();

    // Send success response
    return res.status(200).json({ message: "Email verified successfully!" });
  } catch (error) {
    console.error("Email verification error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

module.exports = { registerSeller, verifyOTP, verifyEmail };
