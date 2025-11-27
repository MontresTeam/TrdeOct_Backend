const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const sellerSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
      trim: true,
    },

    lastName: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    phone: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },

    countryCode: {
      type: String,
      required: true,
      trim: true,
    },

    password: {
      type: String,
      required: true,
      minlength: 6,
      select: false,
    },

    confirmPassword: {
      type: String,
      validate: {
        validator: function (val) {
          return val === this.password;
        },
        message: "Passwords do not match!",
      },
    },

    idType: {
      type: String,
      enum: ["Emirates ID", "Passport", "Driving License", "National ID"],
      required: true,
    },

    idNumber: {
      type: String,
      required: true,
      trim: true,
    },

    idDocument: {
      type: String,
      required: true,
    },

    emailVerified: { type: Boolean, default: false },
    emailToken: String, // for email confirmation
    emailTokenExpiry: Date, // token expiry (optional, e.g., 24h)

    otp: {
      type: String,
      select: false,
    },
    otpExpiry: { type: Date },

    // ---------------- Admin Approval ----------------
    isApproved: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    approvedAt: { type: Date },
    rejectedReason: { type: String },

    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Hash password before saving
sellerSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);

  this.confirmPassword = undefined;

  next();
});

// Compare password method
sellerSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model("Seller", sellerSchema);
