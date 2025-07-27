// Mongoose schema for user.model
const mongoose = require("mongoose");
const { GENDER_TYPES } = require("../constants/user.constants");

const bcrypt = require("bcryptjs");
const { Schema } = mongoose;
const userSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, "User name is required"],
      trim: true,
      minlength: [2, "Name must be at least 2 characters long"],
      maxlength: [50, "Name cannot exceed 50 characters"],
    },
    email: {
      type: String,
      required: [true, "Email address is required"],
      unique: true,
      trim: true,
      lowercase: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        "Please provide a valid email address",
      ],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [8, "Password must be at least 8 characters long"],
      select: false, // Excludes password by default in queries
    },
    profilePicture: {
      type: String,
      default:
        "https://img.freepik.com/free-vector/illustration-businessman_53876-5856.jpg?t=st=1739046879~exp=1739050479~hmac=6521aa62917fb42b86377225c3a89b97d27063ad18e6de83b96ea80e360f188d&w=1380",
    },
    socketId: { type: String }, // updated on connect
    isOnline: { type: Boolean, default: false },
    country: {
      type: String,
      default: "",
    },
    DOB: {
      type: Date,
    },
    gender: {
      type: String,
      enum: Object.values(GENDER_TYPES),
      default: "male",
      lowercase: true,
    },
    phone: {
      type: String,
      default: "123456789",
    },
    country: {
      type: String,
    },
    dob: {
      type: Date,
    },
    role: {
      type: String,
      enum: {
        values: ["user", "admin", "superAdmin", "author"],
        message: "{VALUE} is not a valid role",
      },
      default: "user",
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    // Email verification fields
    verificationToken: {
      type: String,
      select: false,
    },
    verificationTokenExpires: {
      type: Date,
      select: false,
    },
    // Password reset fields
    passwordResetToken: {
      type: String,
      select: false,
    },
    passwordResetExpires: {
      type: Date,
      select: false,
    },
    // OAuth fields
    googleId: {
      type: String,
      sparse: true,
      select: false,
    },
    // Timestamps
    createdAt: {
      type: Date,
      default: Date.now,
      immutable: true, // Prevents modification after creation
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
    // Login tracking
    lastLogin: {
      type: Date,
      select: false,
    },
    loginAttempts: {
      type: Number,
      default: 0,
      select: false,
    },
    lockUntil: {
      type: Date,
      select: false,
    },
    deleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for better query performance
userSchema.index({ role: 1 });
userSchema.index({ verificationToken: 1 }, { sparse: true });
userSchema.index({ passwordResetToken: 1 }, { sparse: true });

// Pre-save middleware to handle password hashing
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  try {
    this.password = await bcrypt.hash(this.password, 12);
    next();
  } catch (error) {
    next(error);
  }
});

// Virtual for user's full profile URL
userSchema.virtual("profileUrl").get(function () {
  return `/users/${this._id}`;
});

// Instance method for comparing passwords
userSchema.methods.comparePassword = async function (candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw new Error("Error comparing passwords");
  }
};

// Instance method for incrementing login attempts
userSchema.methods.incrementLoginAttempts = async function () {
  // Lock the account if we've reached max attempts and haven't locked it yet
  if (this.loginAttempts + 1 >= 5 && !this.lockUntil) {
    this.lockUntil = Date.now() + 3600000; // Lock for 1 hour
  }

  this.loginAttempts += 1;
  return this.save();
};

// Instance method for checking if account is locked
userSchema.methods.isLocked = function () {
  return this.lockUntil && this.lockUntil > Date.now();
};

// Static method for finding verified users
userSchema.statics.findVerified = function () {
  return this.find({ isVerified: true });
};

// Create password reset token
userSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString("hex");

  this.passwordResetToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  this.passwordResetExpires = Date.now() + 3600000; // 1 hour

  return resetToken;
};

const UserModel = mongoose.model("User", userSchema);

module.exports = UserModel;
