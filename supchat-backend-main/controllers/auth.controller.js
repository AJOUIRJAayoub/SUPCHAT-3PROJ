// Controller handling auth.controller logic
const UserModel = require("../models/user.model");
const { AppError } = require("../utils/errorHandler");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { OAuth2Client } = require("google-auth-library");
const emailService = require("../utils/email");
const Responses = require("../utils/responses");
const { catchAsync } = require("../utils/errorHandler");
const {
  TIME,
  TOKEN,
  AUTH_ERRORS,
  HTTP_STATUS,
  AUTH_SUCCESS,
  HASH_ALGORITHM,
  ENCODING,
} = require("../constants/auth.constants");

const signToken = (id) => {
  try {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN,
    });
  } catch (error) {
    throw new AppError(AUTH_ERRORS.TOKEN_ERROR, HTTP_STATUS.SERVER_ERROR);
  }
};

const createSendToken = (user, statusCode, res, sendToken = true) => {
  const token = signToken(user._id);
  const cookieOptions = {
    expires: new Date(
      Date.now() +
        process.env.JWT_COOKIE_EXPIRES_IN * TOKEN.VERIFICATION_TOKEN_EXPIRES
    ),
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
  };

  res.cookie("jwt", token, cookieOptions);
  user.password = undefined;

  return res
    .status(statusCode)
    .json(
      Responses.responses(statusCode, sendToken ? { user, token } : { user })
    );
};

exports.register = catchAsync(async (req, res, next) => {
  const data1 = req.body;
  const name = data1.name;
  const email = data1.email;
  const password = data1.password;
  if (!name || !email || !password) {
    throw new AppError(AUTH_ERRORS.MISSING_NAME, HTTP_STATUS.BAD_REQUEST);
  }

  const existingUser = await UserModel.findOne({ email });
  if (existingUser) {
    throw new AppError(AUTH_ERRORS.EMAIL_IN_USE, HTTP_STATUS.CONFLICT);
  }

  const verificationToken = crypto
    .randomBytes(TOKEN.VERIFICATION_TOKEN_LENGTH)
    .toString(ENCODING);
  const user = await UserModel.create({
    ...data1,
    verificationToken,
    verificationTokenExpires: Date.now() + TOKEN.VERIFICATION_TOKEN_EXPIRES,
  });

  const verificationURL = `${req.protocol}://${req.get(
    "host"
  )}/api/v1/auth/verify/${verificationToken}`;

  try {
    await emailService.sendVerificationEmail(user, verificationURL);
  } catch (error) {
    await UserModel.findByIdAndDelete(user._id);
    throw new AppError(AUTH_ERRORS.EMAIL_SEND_ERROR, HTTP_STATUS.SERVER_ERROR);
  }

  createSendToken(user, HTTP_STATUS.CREATED, res, false);
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new AppError(
      AUTH_ERRORS.MISSING_CREDENTIALS,
      HTTP_STATUS.BAD_REQUEST
    );
  }

  const user = await UserModel.findOne({ email }).select(
    "+password +loginAttempts +lockUntil"
  );

  if (!user) {
    throw new AppError(
      AUTH_ERRORS.INVALID_CREDENTIALS,
      HTTP_STATUS.UNAUTHORIZED
    );
  }

  if (user.isLocked()) {
    throw new AppError(AUTH_ERRORS.ACCOUNT_LOCKED, HTTP_STATUS.LOCKED);
  }

  if (!(await user.comparePassword(password))) {
    await user.incrementLoginAttempts();
    throw new AppError(
      AUTH_ERRORS.INVALID_CREDENTIALS,
      HTTP_STATUS.UNAUTHORIZED
    );
  }

  if (!user.isVerified) {
    throw new AppError(AUTH_ERRORS.UNVERIFIED_EMAIL, HTTP_STATUS.FORBIDDEN);
  }

  user.loginAttempts = 0;
  user.lockUntil = undefined;
  user.lastLogin = Date.now();
  await user.save({ validateBeforeSave: false });

  createSendToken(user, HTTP_STATUS.OK, res);
});

exports.verifyEmail = catchAsync(async (req, res, next) => {
  const { token } = req.params;

  const user = await UserModel.findOne({
    verificationToken: token,
    verificationTokenExpires: { $gt: Date.now() },
  });

  if (!user) {
    throw new AppError(
      AUTH_ERRORS.INVALID_VERIFICATION,
      HTTP_STATUS.BAD_REQUEST
    );
  }

  user.isVerified = true;
  user.verificationToken = undefined;
  user.verificationTokenExpires = undefined;
  await user.save();

  try {
    await emailService.sendWelcomeEmail(user);
  } catch (error) {
    console.error("Welcome email failed:", error);
  }
  res.send("email verified");
  // res.redirect(`${process.env.FRONTEND_URL}`);
});

exports.forgotPassword = catchAsync(async (req, res, next) => {
  const { email } = req.body;

  if (!email) {
    throw new AppError(AUTH_ERRORS.MISSING_EMAIL, HTTP_STATUS.BAD_REQUEST);
  }

  const user = await UserModel.findOne({ email });
  if (!user) {
    throw new AppError(AUTH_ERRORS.USER_NOT_FOUND, HTTP_STATUS.NOT_FOUND);
  }

  const resetToken = crypto
    .randomBytes(TOKEN.RESET_TOKEN_LENGTH)
    .toString(ENCODING);
  user.passwordResetToken = crypto
    .createHash(HASH_ALGORITHM)
    .update(resetToken)
    .digest(ENCODING);
  user.passwordResetExpires = Date.now() + TOKEN.PASSWORD_RESET_EXPIRES;

  await user.save({ validateBeforeSave: false });

  // const resetURL = `${req.protocol}://${req.get('host')}/api/v1/auth/reset-password/${resetToken}`;
  const resetURL = `${process.env.FRONTEND_URL}auth/reset-password${resetToken}`;
  try {
    await emailService.sendPasswordResetEmail(user, resetURL);
    res
      .status(HTTP_STATUS.OK)
      .json(Responses.responses(HTTP_STATUS.OK, AUTH_SUCCESS.RESET_TOKEN_SENT));
  } catch (error) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });

    throw new AppError(AUTH_ERRORS.RESET_EMAIL_ERROR, HTTP_STATUS.SERVER_ERROR);
  }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  const { token } = req.params;
  const { password } = req.body;

  if (!password) {
    throw new AppError(AUTH_ERRORS.MISSING_PASSWORD, HTTP_STATUS.BAD_REQUEST);
  }

  const hashedToken = crypto
    .createHash(HASH_ALGORITHM)
    .update(token)
    .digest(ENCODING);

  const user = await UserModel.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });

  if (!user) {
    throw new AppError(
      AUTH_ERRORS.INVALID_RESET_TOKEN,
      HTTP_STATUS.BAD_REQUEST
    );
  }

  user.password = password;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  user.loginAttempts = 0;
  user.lockUntil = undefined;

  await user.save();

  createSendToken(user, HTTP_STATUS.OK, res);
});

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

exports.googleAuth = catchAsync(async (req, res, next) => {
  const { token } = req.body;

  if (!token) {
    throw new AppError(
      AUTH_ERRORS.MISSING_GOOGLE_TOKEN,
      HTTP_STATUS.BAD_REQUEST
    );
  }

  let ticket;
  try {
    ticket = await googleClient.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
  } catch (error) {
    throw new AppError(
      AUTH_ERRORS.INVALID_GOOGLE_TOKEN,
      HTTP_STATUS.UNAUTHORIZED
    );
  }

  const { email, name, picture } = ticket.getPayload();
  let user = await UserModel.findOne({ email });

  if (!user) {
    const randomPassword = crypto
      .randomBytes(TOKEN.RANDOM_PASSWORD_LENGTH)
      .toString(ENCODING);
    user = await UserModel.create({
      email,
      name,
      profilePicture: picture,
      password: randomPassword,
      isVerified: true,
      googleId: ticket.getUserId(),
    });

    try {
      await emailService.sendWelcomeEmail(user);
    } catch (error) {
      console.error("Welcome email failed:", error);
    }
  }

  createSendToken(user, HTTP_STATUS.OK, res);
});

exports.logout = (req, res) => {
  res.cookie("jwt", "loggedout", {
    expires: new Date(Date.now() + TOKEN.LOGOUT_COOKIE_EXPIRES),
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
  });
  res
    .status(HTTP_STATUS.OK)
    .json(Responses.responses(HTTP_STATUS.OK, AUTH_SUCCESS.LOGOUT));
};

exports.getCurrentUser = catchAsync(async (req, res, next) => {
  if (!req.user) {
    throw new AppError(AUTH_ERRORS.NOT_AUTHENTICATED, HTTP_STATUS.UNAUTHORIZED);
  }
  res
    .status(HTTP_STATUS.OK)
    .json(Responses.responses(HTTP_STATUS.OK, req.user));
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    throw new AppError(
      AUTH_ERRORS.MISSING_NEW_PASSWORD,
      HTTP_STATUS.BAD_REQUEST
    );
  }

  const user = await UserModel.findById(req.user.id).select("+password");

  if (!user) {
    throw new AppError(AUTH_ERRORS.USER_NOT_FOUND, HTTP_STATUS.NOT_FOUND);
  }

  if (!(await user.comparePassword(currentPassword))) {
    throw new AppError(
      AUTH_ERRORS.INCORRECT_PASSWORD,
      HTTP_STATUS.UNAUTHORIZED
    );
  }

  user.password = newPassword;
  await user.save();

  createSendToken(user, HTTP_STATUS.OK, res);
});

// const SessionModel = require('../models/session');

/**
 * Update user profile
 * Allowed fields: name, profilePicture
 */
exports.updateProfile = catchAsync(async (req, res, next) => {
  // Only allow certain fields to be updated
  const allowedUpdates = [
    "name",
    "profilePicture",
    "gender",
    "phone",
    "role",
    "DOB",
    "country",
  ];
  const updates = Object.keys(req.body)
    .filter((key) => allowedUpdates.includes(key))
    .reduce((obj, key) => {
      obj[key] = req.body[key];
      return obj;
    }, {});

  if (Object.keys(updates).length === 0) {
    throw new AppError(
      "No valid update fields provided",
      HTTP_STATUS.BAD_REQUEST
    );
  }

  const user = await UserModel.findByIdAndUpdate(req.user.id, updates, {
    new: true,
    runValidators: true,
    select: "-password -verificationToken -passwordResetToken",
  });

  if (!user) {
    throw new AppError("User not found", HTTP_STATUS.NOT_FOUND);
  }

  res
    .status(HTTP_STATUS.OK)
    .json(
      Responses.responses(
        HTTP_STATUS.OK,
        { user },
        "Profile updated successfully"
      )
    );
});

/**
 * Delete user account
 * Requires password confirmation for security
 */
exports.deleteAccount = catchAsync(async (req, res, next) => {
  const { password } = req.body;

  if (!password) {
    throw new AppError(
      "Please provide your password to delete account",
      HTTP_STATUS.BAD_REQUEST
    );
  }

  // Get user with password
  const user = await UserModel.findById(req.user.id).select("+password");

  if (!user) {
    throw new AppError("User not found", HTTP_STATUS.NOT_FOUND);
  }

  // Verify password
  if (!(await user.comparePassword(password))) {
    throw new AppError("Incorrect password", HTTP_STATUS.UNAUTHORIZED);
  }

  // Delete all sessions
  // await SessionModel.deleteMany({ userId: user._id });

  // Delete user
  await UserModel.findByIdAndDelete(user._id);

  // Clear authentication cookie
  res.cookie("jwt", "loggedout", {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
  });

  res
    .status(HTTP_STATUS.OK)
    .json(
      Responses.responses(HTTP_STATUS.OK, null, "Account deleted successfully")
    );
});

/**
 * Get all active sessions for the user
 */
// exports.getActiveSessions = catchAsync(async (req, res, next) => {
//     const sessions = await SessionModel.find({
//         userId: req.user.id,
//         expires: { $gt: new Date() }
//     }).select('-token');

//     res.status(HTTP_STATUS.OK).json(
//         Responses.responses(HTTP_STATUS.OK, { sessions })
//     );
// });

/**
 * Revoke all active sessions except current
 */
// exports.revokeAllSessions = catchAsync(async (req, res, next) => {
//     // Delete all sessions except current one
//     await SessionModel.deleteMany({
//         userId: req.user.id,
//         _id: { $ne: req.session.id }
//     });

//     res.status(HTTP_STATUS.OK).json(
//         Responses.responses(HTTP_STATUS.OK, null, 'All other sessions revoked successfully')
//     );
// });
