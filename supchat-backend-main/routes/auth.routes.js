// routes/authRoutes.js

const express = require("express");
const router = express.Router();
const authController = require("../controllers/auth.controller");
const { protect, isVerified } = require("../middleware/auth");
const { validateAuthInput } = require("../middleware/validation");
const {
  loginLimiter,
  emailLimiter,
  passwordUpdateLimiter,
  accountLimiter,
} = require("../middleware/ratelimiter");
const { ROUTES } = require("../constants/route.constants");

// Public routes group
router
  .route(ROUTES.AUTH.REGISTER)
  .post(accountLimiter, validateAuthInput("register"), authController.register);

router
  .route(ROUTES.AUTH.LOGIN)
  .post(loginLimiter, validateAuthInput("login"), authController.login);

router
  .route(ROUTES.AUTH.VERIFY_EMAIL)
  .get(validateAuthInput("verifyEmail"), authController.verifyEmail);

router
  .route(ROUTES.AUTH.FORGOT_PASSWORD)
  .post(
    emailLimiter,
    validateAuthInput("forgotPassword"),
    authController.forgotPassword
  );

router
  .route(ROUTES.AUTH.RESET_PASSWORD)
  .patch(validateAuthInput("resetPassword"), authController.resetPassword);

router
  .route(ROUTES.AUTH.GOOGLE_AUTH)
  .post(
    accountLimiter,
    validateAuthInput("googleAuth"),
    authController.googleAuth
  );

router.route(ROUTES.AUTH.LOGOUT).get(
  protect, // Ensure user is logged in to logout
  authController.logout
);

// Protected routes group
router.use(protect); // Global middleware for protected routes

router.route(ROUTES.AUTH.CURRENT_USER).get(authController.getCurrentUser);

router
  .route(ROUTES.AUTH.UPDATE_PASSWORD)
  .patch(
    isVerified,
    passwordUpdateLimiter,
    validateAuthInput("updatePassword"),
    authController.updatePassword
  );

// Account management routes (optional)
router
  .route(ROUTES.AUTH.UPDATE_PROFILE)
  .patch(
    isVerified,
    validateAuthInput("updateProfile"),
    authController.updateProfile
  );

router.route(ROUTES.AUTH.DELETE_ACCOUNT).delete(
  isVerified,
  validateAuthInput("deleteAccount"),
  // isOwnerOrAdmin('userId'),
  // isOwnerOrAdmin(),
  authController.deleteAccount
);

// Session management routes (optional)
// router.route(ROUTES.AUTH.ACTIVE_SESSIONS)
//     .get(
//         isVerified,
//         authController.getActiveSessions
//     )
//     .delete(
//         isVerified,
//         authController.revokeAllSessions
//     );

module.exports = router;
