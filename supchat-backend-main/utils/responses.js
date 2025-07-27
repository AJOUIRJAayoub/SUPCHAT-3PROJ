// utils/responses.js

class Responses {
  static getStatusMessage(statusCode) {
    const statusMessages = {
      200: "Success",
      201: "Created",
      400: "Bad Request",
      401: "Unauthorized",
      403: "Forbidden",
      404: "Not Found",
      409: "Conflict",
      422: "Unprocessable Entity",
      500: "Internal Server Error",
    };
    return statusMessages[statusCode] || "Unknown Status";
  }

  static responses(statusCode, data = null, message = null) {
    const isSuccess = statusCode >= 200 && statusCode < 300;

    const response = {
      status: isSuccess ? "success" : "error",
      statusCode,
      message: message || this.getStatusMessage(statusCode),
    };

    // Add data only if it exists
    if (data) {
      // If data is a string, use it as a message
      if (typeof data === "string") {
        response.message = data;
      }
      // If data is an error object with a message
      else if (data instanceof Error) {
        response.message = data.message;
      }
      // If data is an object or array, add it to the response
      else {
        response.data = data;
      }
    }

    return response;
  }

  // Helper methods for common responses
  static success(data = null, message = "Success") {
    return this.responses(200, data, message);
  }

  static created(data = null, message = "Resource created successfully") {
    return this.responses(201, data, message);
  }

  static badRequest(message = "Bad Request") {
    return this.responses(400, null, message);
  }

  static unauthorized(message = "Unauthorized") {
    return this.responses(401, null, message);
  }

  static forbidden(message = "Forbidden") {
    return this.responses(403, null, message);
  }

  static notFound(message = "Resource not found") {
    return this.responses(404, null, message);
  }

  static serverError(message = "Internal Server Error") {
    return this.responses(500, null, message);
  }
}

module.exports = Responses;
