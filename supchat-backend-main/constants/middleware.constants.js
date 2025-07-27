// constants/middleware.constants.js

const AUTH_ERRORS = {
  NO_TOKEN: "Please log in to access this resource",
  USER_NOT_FOUND: "The user no longer exists",
  UNVERIFIED_EMAIL: "Please verify your email first",
  INVALID_TOKEN: "Invalid token. Please log in again",
  TOKEN_EXPIRED: "Your token has expired. Please log in again",
  AUTH_FAILED: "Authentication failed",
  INSUFFICIENT_PERMISSIONS: "You do not have permission to perform this action",
};

const TOKEN_CONFIG = {
  SCHEME: "Bearer",
  COOKIE_NAME: "jwt",
};

const AUTH_HEADERS = {
  AUTHORIZATION: "authorization",
};

module.exports = {
  AUTH_ERRORS,
  TOKEN_CONFIG,
  AUTH_HEADERS,
};
