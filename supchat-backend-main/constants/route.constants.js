// Constants used in the application
const ROUTES = {
  USER: {
    ROOT: "/users",
    PROFILE: "/profile",
    UPDATE_PROFILE: "/profile/update",
    ADMIN_PREFIX: "/admin",
    ALL: "/all",
    BY_ID: "/:userId",
    UPDATE_USER: "/:userId/update",
    DELETE: "/:userId/delete",
    SEARCH: "/search",
    STATS: "/stats",
    BULK_UPDATE: "/bulk-update",
    BULK_DELETE: "/bulk-delete",
    SEND_EMAIL: "/send-email",
    UPLOAD_IMAGE: "/upload-image",
  },
  AUTH: {
    ROOT: "/auth",
    REGISTER: "/register",
    LOGIN: "/login",
    VERIFY_EMAIL: "/verify/:token",
    FORGOT_PASSWORD: "/forgot-password",
    RESET_PASSWORD: "/reset-password/:token",
    GOOGLE_AUTH: "/google",
    LOGOUT: "/logout",
    CURRENT_USER: "/me",
    UPDATE_PASSWORD: "/update-password",
    UPDATE_PROFILE: "/profile",
    DELETE_ACCOUNT: "/account",
    ACTIVE_SESSIONS: "/sessions",
  },
  PRODUCT: {
    ROOT: "/product",
    POST: "/",
    GET_BY_ID: "/:id",
    GET_ALL: "/",
    GET_BY_PRICE: "/price",
    DELETE: "/:id",
    UPDATE: "/:id",
  },
  TERMS: {
    ROOT: "/terms",
    POST: "/",
    GET_BY_TITLE: "/",
    UPDATE: "/:title",
    GET_ALL: "/all", // Add this line
  },
  PROMO: {
    ROOT: "/promo",
    POST: "/",
    GET_BY_ID: "/:id",
    GET_ALL: "/",
    GET_BY_CODE: "/code",
    DELETE: "/:id",
    UPDATE: "/:id",
  },
  ORDER: {
    ROOT: "/order",
    POST: "/",
    GET_BY_ID: "/:id",
    GET_ALL: "/",
    GET_BY_USER: "/user",
    DELETE: "/:id",
    UPDATE: "/:id",
  },
  CART: {
    ROOT: "/cart",
    POST: "/",
    GET_BY_ID: "/:id",
    GET_ALL: "/",
    GET_BY_USER: "/user",
    DELETE: "/:id",
    UPDATE: "/:id",
  },
  CONTACT_US: {
    ROOT: "/contact",
    POST: "/",
    GET_BY_ID: "/get",
    GET_ALL: "/",
    GET_BY_USER: "/user",
    DELETE: "/:id",
    UPDATE: "/",
  },
  ADMIN: {
    ROOT: "/admin",
    CREATE_USER: "/",
    DELETE_USER: "/:userId",
    UPDATE_USER: "/:userId",
  },
};

const PATHS = "/api/v1/";

const RATE_LIMIT = {
  LOGIN: {
    WINDOW_MS: 15 * 60 * 1000, // 15 minutes
    MAX_ATTEMPTS: 5,
    MESSAGE: "Too many login attempts. Please try again after 15 minutes",
  },
  EMAIL: {
    WINDOW_MS: 60 * 60 * 1000, // 1 hour
    MAX_ATTEMPTS: 3,
    MESSAGE: "Too many email requests. Please try again after an hour",
  },
  PASSWORD_UPDATE: {
    WINDOW_MS: 15 * 60 * 1000, // 15 minutes
    MAX_ATTEMPTS: 3,
    MESSAGE:
      "Too many password update attempts. Please try again after 15 minutes",
  },
  ACCOUNT: {
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 15, // 5 account creations per hour
    message: "Too many accounts created. Please try again later",
  },
};

const ROLES = { USER: "user", ADMIN: "admin", SUPER_ADMIN: "superAdmin", AUTHOR: "author" };

module.exports = { ROUTES, PATHS, RATE_LIMIT, ROLES };
