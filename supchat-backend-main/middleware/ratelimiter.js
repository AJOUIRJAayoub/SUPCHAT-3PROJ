// middleware/rateLimiter.js

const rateLimit = require("express-rate-limit");
const { RATE_LIMIT } = require("../constants/route.constants");
const { AppError } = require("../utils/errorHandler");
const { HTTP_STATUS } = require("../constants/auth.constants");

const USER_RATE_LIMITS = {
  UPDATE: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5,
    message: "Too many update attempts. Please try again after 15 minutes",
  },
  SEARCH: {
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 30,
    message: "Too many search requests. Please try again after 5 minutes",
  },
  BULK_OPERATIONS: {
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10,
    message: "Too many bulk operations. Please try again after an hour",
  },
};

const createLimiter = (options) => {
  return rateLimit({
    windowMs: options.windowMs,
    max: options.max,
    message: options.message,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      throw new AppError(options.message, HTTP_STATUS.TOO_MANY_REQUESTS);
    },
    keyGenerator: (req) => {
      // Use user ID if available, otherwise IP
      return req.user ? req.user.id : req.ip;
    },
    skip: (req) => process.env.NODE_ENV === "test",
  });
};

exports.userUpdateLimiter = createLimiter(USER_RATE_LIMITS.UPDATE);
exports.userSearchLimiter = createLimiter(USER_RATE_LIMITS.SEARCH);
exports.bulkOperationsLimiter = createLimiter(USER_RATE_LIMITS.BULK_OPERATIONS);
exports.loginLimiter = createLimiter(RATE_LIMIT.LOGIN);
exports.emailLimiter = createLimiter(RATE_LIMIT.EMAIL);
exports.passwordUpdateLimiter = createLimiter(RATE_LIMIT.PASSWORD_UPDATE);
exports.accountLimiter = createLimiter(RATE_LIMIT.ACCOUNT);
