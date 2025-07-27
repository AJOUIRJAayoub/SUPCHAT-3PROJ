// constants/auth.constants.js

const TIME = {
  MILLISECONDS_IN_SECOND: 1000,
  SECONDS_IN_MINUTE: 60,
  MINUTES_IN_HOUR: 60,
  HOURS_IN_DAY: 24,
};

const TOKEN = {
  VERIFICATION_TOKEN_LENGTH: 32,
  RESET_TOKEN_LENGTH: 32,
  RANDOM_PASSWORD_LENGTH: 32,
  VERIFICATION_TOKEN_EXPIRES:
    TIME.HOURS_IN_DAY *
    TIME.MINUTES_IN_HOUR *
    TIME.SECONDS_IN_MINUTE *
    TIME.MILLISECONDS_IN_SECOND, // 24 hours
  PASSWORD_RESET_EXPIRES:
    TIME.MINUTES_IN_HOUR * TIME.SECONDS_IN_MINUTE * TIME.MILLISECONDS_IN_SECOND, // 1 hour
  LOGOUT_COOKIE_EXPIRES: 10 * TIME.MILLISECONDS_IN_SECOND, // 10 seconds
};

const AUTH_ERRORS = {
  MISSING_CREDENTIALS: "Please provide email and password",
  MISSING_NAME: "Please provide name, email and password",
  EMAIL_IN_USE: "Email already registered",
  INVALID_CREDENTIALS: "Invalid email or password",
  ACCOUNT_LOCKED: "Account is locked. Please try again later",
  UNVERIFIED_EMAIL: "Please verify your email first",
  INVALID_VERIFICATION: "Invalid or expired verification token",
  MISSING_EMAIL: "Please provide your email address",
  USER_NOT_FOUND: "No user found with that email",
  MISSING_PASSWORD: "Please provide a new password",
  INVALID_RESET_TOKEN: "Invalid or expired reset token",
  MISSING_GOOGLE_TOKEN: "Please provide a Google token",
  INVALID_GOOGLE_TOKEN: "Invalid Google token",
  NOT_AUTHENTICATED: "Not authenticated",
  MISSING_NEW_PASSWORD: "Please provide current and new password",
  INCORRECT_PASSWORD: "Current password is incorrect",
  EMAIL_SEND_ERROR: "Error sending verification email. Please try again.",
  RESET_EMAIL_ERROR:
    "Error sending password reset email. Please try again later.",
};

const HTTP_STATUS = {
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  LOCKED: 423,
  SERVER_ERROR: 500,

  // 2xx Success
  OK: 200,
  CREATED: 201,
  ACCEPTED: 202,
  NO_CONTENT: 204,

  // 3xx Redirection
  MOVED_PERMANENTLY: 301,
  FOUND: 302,
  NOT_MODIFIED: 304,
  TEMPORARY_REDIRECT: 307,
  PERMANENT_REDIRECT: 308,

  // 4xx Client Errors
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  PAYMENT_REQUIRED: 402,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  METHOD_NOT_ALLOWED: 405,
  NOT_ACCEPTABLE: 406,
  CONFLICT: 409,
  GONE: 410,
  UNPROCESSABLE_ENTITY: 422,
  LOCKED: 423,
  TOO_MANY_REQUESTS: 429,

  // 5xx Server Errors
  INTERNAL_SERVER_ERROR: 500,
  NOT_IMPLEMENTED: 501,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
  GATEWAY_TIMEOUT: 504,
};

const AUTH_SUCCESS = {
  LOGOUT: "Logged out successfully",
  RESET_TOKEN_SENT: "Reset token sent to email",
};

const GLOBAL_MESSAGES = {
  CREDENTIALS_MISSING: "necessary credentials are missiong",
  UNABLE_TO_CREATE_RECORD: "unable to create record",
  RECORDS_NOT_FOUND: "records not found",
  UNABLE_TO_DELETE_RECORD: "unable to delete the record",
  FAILED_TO_UPDATE: "failed to update record",
  RECORD_UPDATED: "record updated successfully",
  USER_NOT_FOUND: "user not found",
};

const HASH_ALGORITHM = "sha256";
const ENCODING = "hex";

module.exports = {
  TIME,
  TOKEN,
  AUTH_ERRORS,
  HTTP_STATUS,
  AUTH_SUCCESS,
  HASH_ALGORITHM,
  ENCODING,
  GLOBAL_MESSAGES,
};
