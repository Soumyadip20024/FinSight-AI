const errorHandler = (err, req, res, next) => {
  console.error("Error:", err.message);

  const statusCode =
    err.statusCode && err.statusCode >= 400
      ? err.statusCode
      : 500;

  res.status(statusCode).json({
    success: false,
    message: err.message || "Internal server error"
  });
};

module.exports = errorHandler;