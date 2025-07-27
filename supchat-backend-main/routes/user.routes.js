// routes/userRoutes.js

const express = require("express");
const router = express.Router();
const userController = require("../controllers/user.controller");
const {
  protect,
  isVerified,
  isAdmin,
  isSuperAdmin,
  isOwnerOrAdmin,
} = require("../middleware/auth");
const { validateUserInput } = require("../middleware/validation");
const { userUpdateLimiter } = require("../middleware/ratelimiter");
const { ROUTES } = require("../constants/route.constants");

// Base protection for all routes
router.use(protect);
router.use(isVerified);

// User routes (accessible by authenticated users)
router.route(ROUTES.USER.PROFILE).get(
  // validateUserInput('getProfile'),
  userController.getProfile
);

// User search and filters (Admin only)
router
  .route(ROUTES.USER.SEARCH)
  .get(validateUserInput("searchUsers"), userController.searchUsers);

router
  .route(ROUTES.USER.UPDATE_PROFILE)
  .patch(
    userUpdateLimiter,
    validateUserInput("updateProfile"),
    userController.updateProfile
  );
router.route(ROUTES.USER.UPLOAD_IMAGE).post(userController.uploadImage);
// Admin routes
router.use(ROUTES.USER.ADMIN_PREFIX, isAdmin);

router
  .route(ROUTES.USER.ALL)
  .get(validateUserInput("getAllUsers"), userController.getAllUsers);

router
  .route(ROUTES.USER.BY_ID)
  .get(validateUserInput("getUserById"), userController.getUserById);

// Admin user management routes
router.route(ROUTES.USER.UPDATE_USER).patch(
  userUpdateLimiter,
  validateUserInput("updateUser"),
  // isOwnerOrAdmin('userId'),
  // isOwnerOrAdmin(),
  userController.updateProfile
);

router
  .route(ROUTES.USER.DELETE)
  .delete(
    validateUserInput("deleteUser"),
    isSuperAdmin,
    userController.deleteUser
  );

// User statistics (Admin only)
router
  .route(ROUTES.USER.STATS)
  .get(validateUserInput("getUserStats"), userController.getUserStats);

// Bulk operations (Super Admin only)
router
  .route(ROUTES.USER.BULK_UPDATE)
  .patch(
    isSuperAdmin,
    validateUserInput("bulkUpdate"),
    userController.bulkUpdate
  );

router
  .route(ROUTES.USER.BULK_DELETE)
  .delete(
    isSuperAdmin,
    validateUserInput("bulkDelete"),
    userController.bulkDelete
  );

router.route(ROUTES.USER.SEND_EMAIL).post(userController.sendContactEmail);
module.exports = router;
