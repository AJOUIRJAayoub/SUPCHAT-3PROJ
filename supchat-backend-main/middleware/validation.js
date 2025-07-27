// middleware/validation.js

const { AppError } = require("../utils/errorHandler");
const { HTTP_STATUS } = require("../constants/auth.constants");
const catchAsync = require("../utils/catchAsync");
// middleware/validation.js
const { body, param, query } = require("express-validator");

const validateUserInput = (method) => {
  switch (method) {
    case "getProfile":
      return [];

    case "updateProfile":
      return [
        body("name").optional().trim().isLength({ min: 2 }),
        body("email").optional().isEmail(),
        body("phone").optional().isMobilePhone(),
        body("address").optional().isObject(),
      ];

    case "getAllUsers":
      return [
        query("page").optional().isInt({ min: 1 }),
        query("limit").optional().isInt({ min: 1 }),
        query("sort").optional().isString(),
      ];

    case "getUserById":
      return [param("userId").isMongoId()];

    case "updateUser":
      return [
        param("userId").isMongoId(),
        body("role").optional().isIn(["user", "admin"]),
        body("isVerified").optional().isBoolean(),
        body("status").optional().isIn(["active", "suspended"]),
      ];

    case "deleteUser":
      return [param("userId").isMongoId()];

    case "searchUsers":
      return [
        query("q").optional().trim(),
        query("role").optional().isIn(["user", "admin"]),
        query("status").optional().isIn(["active", "suspended"]),
        query("from").optional().isDate(),
        query("to").optional().isDate(),
      ];

    case "getUserStats":
      return [
        query("period")
          .optional()
          .isIn(["daily", "weekly", "monthly", "yearly"]),
      ];

    case "bulkUpdate":
      return [
        body("userIds").isArray(),
        body("userIds.*").isMongoId(),
        body("updates").isObject(),
      ];

    case "bulkDelete":
      return [body("userIds").isArray(), body("userIds.*").isMongoId()];
  }
};

const validateAuthInput = (operation) =>
  catchAsync(async (req, res, next) => {
    switch (operation) {
      case "register":
        if (!req.body.name || !req.body.email || !req.body.password) {
          throw new AppError(
            "Please provide name, email and password",
            HTTP_STATUS.BAD_REQUEST
          );
        }
        if (!isValidEmail(req.body.email)) {
          throw new AppError(
            "Please provide a valid email address",
            HTTP_STATUS.BAD_REQUEST
          );
        }
        if (req.body.password.length < 8) {
          throw new AppError(
            "Password must be at least 8 characters long",
            HTTP_STATUS.BAD_REQUEST
          );
        }
        break;

      case "login":
        if (!req.body.email || !req.body.password) {
          throw new AppError(
            "Please provide email and password",
            HTTP_STATUS.BAD_REQUEST
          );
        }
        if (!isValidEmail(req.body.email)) {
          throw new AppError(
            "Please provide a valid email address",
            HTTP_STATUS.BAD_REQUEST
          );
        }
        break;

      case "verifyEmail":
        if (!req.params.token) {
          throw new AppError(
            "Verification token is required",
            HTTP_STATUS.BAD_REQUEST
          );
        }
        break;

      case "forgotPassword":
        if (!req.body.email) {
          throw new AppError(
            "Please provide your email address",
            HTTP_STATUS.BAD_REQUEST
          );
        }
        if (!isValidEmail(req.body.email)) {
          throw new AppError(
            "Please provide a valid email address",
            HTTP_STATUS.BAD_REQUEST
          );
        }
        break;

      case "resetPassword":
        if (!req.params.token || !req.body.password) {
          throw new AppError(
            "Reset token and new password are required",
            HTTP_STATUS.BAD_REQUEST
          );
        }
        if (req.body.password.length < 8) {
          throw new AppError(
            "Password must be at least 8 characters long",
            HTTP_STATUS.BAD_REQUEST
          );
        }
        break;

      case "googleAuth":
        if (!req.body.token) {
          throw new AppError(
            "Google token is required",
            HTTP_STATUS.BAD_REQUEST
          );
        }
        break;

      case "updatePassword":
        if (!req.body.currentPassword || !req.body.newPassword) {
          throw new AppError(
            "Current password and new password are required",
            HTTP_STATUS.BAD_REQUEST
          );
        }
        if (req.body.newPassword.length < 8) {
          throw new AppError(
            "New password must be at least 8 characters long",
            HTTP_STATUS.BAD_REQUEST
          );
        }
        if (req.body.currentPassword === req.body.newPassword) {
          throw new AppError(
            "New password must be different from current password",
            HTTP_STATUS.BAD_REQUEST
          );
        }
        break;
    }
    next();
  });

// const { PRODUCTS } = require('../constants/pricing.constants');
// const mongoose = require('mongoose');

// const validatePayment = (method) => {
//    switch (method) {
//        case 'createSession': {
//            return [
//                body('productId')
//                    .exists()
//                    .withMessage('Product ID is required')
//                    .custom(value => {
//                        if (!PRODUCTS[value]) {
//                            throw new Error('Invalid product selected');
//                        }
//                        return true;
//                    })
//            ];
//        }

//        case 'getOrderDetails': {
//            return [
//                param('orderId')
//                    .exists()
//                    .withMessage('Order ID is required')
//                    .custom(value => {
//                        if (!mongoose.Types.ObjectId.isValid(value)) {
//                            throw new Error('Invalid order ID format');
//                        }
//                        return true;
//                    })
//            ];
//        }

//        case 'refundOrder': {
//            return [
//                param('orderId')
//                    .exists()
//                    .withMessage('Order ID is required')
//                    .custom(value => {
//                        if (!mongoose.Types.ObjectId.isValid(value)) {
//                            throw new Error('Invalid order ID format');
//                        }
//                        return true;
//                    }),
//                body('reason')
//                    .optional()
//                    .isString()
//                    .withMessage('Reason must be a string')
//                    .trim()
//                    .isLength({ min: 3, max: 500 })
//                    .withMessage('Reason must be between 3 and 500 characters')
//            ];
//        }

//        case 'validateWebhookEvent': {
//            return [
//                body()
//                    .custom((value, { req }) => {
//                        if (!req.headers['stripe-signature']) {
//                            throw new Error('Stripe signature is missing');
//                        }
//                        return true;
//                    })
//            ];
//        }
//    }
// };

// // Add validation for query parameters if needed
// const validatePaymentQueries = {
//    orderHistory: [
//        query('startDate')
//            .optional()
//            .isISO8601()
//            .withMessage('Invalid start date format'),
//        query('endDate')
//            .optional()
//            .isISO8601()
//            .withMessage('Invalid end date format'),
//        query('status')
//            .optional()
//            .isIn(['pending', 'completed', 'failed', 'refunded'])
//            .withMessage('Invalid order status'),
//        query('limit')
//            .optional()
//            .isInt({ min: 1, max: 100 })
//            .withMessage('Limit must be between 1 and 100'),
//        query('page')
//            .optional()
//            .isInt({ min: 1 })
//            .withMessage('Page must be greater than 0')
//    ]
// };

// // Validation middleware
// const handleValidation = (req, res, next) => {
//    const errors = validationResult(req);
//    if (!errors.isEmpty()) {
//        const validationErrors = errors.array().map(err => err.msg);
//        return res.status(400).json({
//            status: 'fail',
//            statusCode: 400,
//            message: 'Validation Error',
//            errors: validationErrors
//        });
//    }
//    next();
// };

const isValidEmail = (email) => {
  const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
  return emailRegex.test(email);
};

module.exports = {
  validateAuthInput,
  validateUserInput,
};
