// Utility functions used across the backend
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith("4") ? "fail" : "error";
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

const catchAsync = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch((error) => {
      // Mongoose validation errors
      if (error.name === "ValidationError") {
        const validationErrors = Object.values(error.errors).map(
          (err) => err.message
        );
        return res.status(400).json({
          status: "fail",
          statusCode: 400,
          message: "Validation Error",
          errors: validationErrors,
        });
      }

      // Mongoose duplicate key errors
      if (error.code === 11000) {
        const field = Object.keys(error.keyPattern)[0];
        return res.status(409).json({
          status: "fail",
          statusCode: 409,
          message: `Duplicate ${field}. This ${field} is already in use.`,
        });
      }

      // JWT errors
      if (
        error.name === "JsonWebTokenError" ||
        error.name === "TokenExpiredError"
      ) {
        return res.status(401).json({
          status: "fail",
          statusCode: 401,
          message:
            error.name === "TokenExpiredError"
              ? "Your token has expired. Please log in again."
              : "Invalid token. Please log in again.",
        });
      }

      // File upload errors
      if (
        error.code === "LIMIT_FILE_SIZE" ||
        error.code === "LIMIT_UNEXPECTED_FILE"
      ) {
        return res.status(400).json({
          status: "fail",
          statusCode: 400,
          message:
            error.code === "LIMIT_FILE_SIZE"
              ? "File too large. Maximum size is 5MB."
              : "Unexpected field in file upload.",
        });
      }

      // Rate limit errors
      if (error.status === 429) {
        return res.status(429).json({
          status: "fail",
          statusCode: 429,
          message: "Too many requests. Please try again later.",
        });
      }

      // Log error
      // logger.error("Error:", {
      //   name: error.name,
      //   message: error.message,
      //   stack: error.stack,
      // });

      // Known errors (AppError instances)
      if (error instanceof AppError) {
        return res.status(error.statusCode).json({
          status: error.status,
          statusCode: error.statusCode,
          message: error.message,
        });
      }

      // Production vs Development error response
      const statusCode = error.statusCode || 500;
      if (process.env.NODE_ENV === "production") {
        return res.status(statusCode).json({
          status: "error",
          statusCode,
          message: "Something went wrong!",
        });
      }

      // Development detailed error
      return res.status(statusCode).json({
        status: "error",
        statusCode,
        message: error.message,
        stack: error.stack,
        error,
      });
    });
  };
};

const express = require("express");
const app = express();
const handleErrors = (req, res) => {
  // 404 handler
  // app.all('*', (req, res) => {
  res.status(404).json({
    status: "fail",
    statusCode: 404,
    message: `Can't find ${req.originalUrl} on this server!`,
  });
  // });

  // Global error handler
  app.use((err, req, res, next) => {
    err.statusCode = err.statusCode || 500;
    err.status = err.status || "error";

    const response = {
      status: err.status,
      statusCode: err.statusCode,
      message:
        process.env.NODE_ENV === "production" && !err.isOperational
          ? "Something went wrong!"
          : err.message,
    };

    if (process.env.NODE_ENV === "development") {
      response.stack = err.stack;
      response.error = err;
    }

    res.status(err.statusCode).json(response);
  });
};

module.exports = {
  AppError,
  catchAsync,
  handleErrors,
};
