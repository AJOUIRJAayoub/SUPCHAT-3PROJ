// middleware/auth.js

const jwt = require("jsonwebtoken");
const UserModel = require("../models/user.model");
const { AppError } = require("../utils/errorHandler");
const {
  AUTH_ERRORS,
  TOKEN_CONFIG,
  AUTH_HEADERS,
} = require("../constants/middleware.constants");
const { HTTP_STATUS } = require("../constants/auth.constants");
const { ROLES } = require("../constants/route.constants");
const catchAsync = require("../utils/catchAsync");

/**
 * Extract JWT token from request
 * @param {Object} req - Express request object
 * @returns {string|null} JWT token or null
 */
const extractToken = (req) => {
  if (
    req.headers[AUTH_HEADERS.AUTHORIZATION]?.startsWith(TOKEN_CONFIG.SCHEME)
  ) {
    return req.headers[AUTH_HEADERS.AUTHORIZATION].split(" ")[1];
  }
  if (req.cookies[TOKEN_CONFIG.COOKIE_NAME]) {
    return req.cookies[TOKEN_CONFIG.COOKIE_NAME];
  }
  return null;
};

/**
 * Verify JWT token and return decoded data
 * @param {string} token - JWT token
 * @returns {Object} Decoded token data
 * @throws {AppError} If token is invalid
 */
const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    if (error.name === "JsonWebTokenError") {
      throw new AppError(AUTH_ERRORS.INVALID_TOKEN, HTTP_STATUS.UNAUTHORIZED);
    }
    if (error.name === "TokenExpiredError") {
      throw new AppError(AUTH_ERRORS.TOKEN_EXPIRED, HTTP_STATUS.UNAUTHORIZED);
    }
    throw new AppError(AUTH_ERRORS.AUTH_FAILED, HTTP_STATUS.UNAUTHORIZED);
  }
};

/**
 * Fetch and validate user
 * @param {string} userId - User ID from token
 * @returns {Object} User document
 * @throws {AppError} If user not found or not verified
 */
const getAndValidateUser = async (userId) => {
  const user = await UserModel.findById(userId);

  if (!user) {
    throw new AppError(AUTH_ERRORS.USER_NOT_FOUND, HTTP_STATUS.UNAUTHORIZED);
  }

  if (!user.isVerified) {
    throw new AppError(AUTH_ERRORS.UNVERIFIED_EMAIL, HTTP_STATUS.FORBIDDEN);
  }

  return user;
};

/**
 * Main authentication middleware
 */
exports.protect = catchAsync(async (req, res, next) => {
  const token = extractToken(req);

  if (!token) {
    throw new AppError(AUTH_ERRORS.NO_TOKEN, HTTP_STATUS.UNAUTHORIZED);
  }

  const decoded = verifyToken(token);
  req.user = await getAndValidateUser(decoded.id);
  req.token = token;
  next();
});

/**
 * Role-based access control middleware
 * @param {...string} roles - Allowed roles
 */
exports.restrictTo = (...roles) =>
  catchAsync(async (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      throw new AppError(
        AUTH_ERRORS.INSUFFICIENT_PERMISSIONS,
        HTTP_STATUS.FORBIDDEN
      );
    }
    next();
  });

/**
 * Verify if user's email is verified
 */

exports.isDeleted = catchAsync(async (req, res, next) => {
  const token = extractToken(req);
  if (!token) {
    throw new AppError(AUTH_ERRORS.NO_TOKEN, HTTP_STATUS.UNAUTHORIZED);
  }

  const decoded = verifyToken(token);
  const user = await getAndValidateUser(decoded.id);
  if (user.deleted) {
    throw new AppError(
      "your account is deleted you cannot access any api.",
      HTTP_STATUS.UNAUTHORIZED
    );
  }

  next();
});
exports.isVerified = catchAsync(async (req, res, next) => {
  if (!req.user.isVerified) {
    throw new AppError(AUTH_ERRORS.UNVERIFIED_EMAIL, HTTP_STATUS.FORBIDDEN);
  }
  next();
});

/**
 * Check if user is an admin
 */
exports.isAdmin = catchAsync(async (req, res, next) => {
  if (![ROLES.ADMIN, ROLES.SUPER_ADMIN].includes(req.user.role)) {
    throw new AppError(
      AUTH_ERRORS.INSUFFICIENT_PERMISSIONS,
      HTTP_STATUS.FORBIDDEN
    );
  }
  next();
});

/**
 * Check if user is a super admin
 */
exports.isSuperAdmin = catchAsync(async (req, res, next) => {
  if (req.user.role !== ROLES.SUPER_ADMIN) {
    throw new AppError(
      AUTH_ERRORS.INSUFFICIENT_PERMISSIONS,
      HTTP_STATUS.FORBIDDEN
    );
  }
  next();
});

// /**
//  * Check if user owns the resource or is an admin
//  * @param {string} paramName - Request parameter containing resource ID
//  */
exports.isOwnerOrAdmin = (req, res, next) => {
  // const resourceId = req.params[paramName];
  const isAdmin = [ROLES.ADMIN, ROLES.SUPER_ADMIN].includes(req?.user?.role);
  // const isOwner = req.user.id === resourceId;

  if (!isAdmin) {
    throw new AppError(
      AUTH_ERRORS.INSUFFICIENT_PERMISSIONS,
      HTTP_STATUS.FORBIDDEN
    );
  }
  next();
};
