/**
 * Central error handler. Express routes call next(err) and end up here, so we
 * format error responses in one place instead of repeating try/catch logic.
 */
export const errorHandler = (err, req, res, next) => {
  // A bad ObjectId (e.g. /api/events/not-a-real-id) throws a CastError.
  if (err.name === "CastError") {
    return res.status(400).json({ message: `Invalid ${err.path}: ${err.value}` });
  }

  // Mongoose schema validation failures.
  if (err.name === "ValidationError") {
    const messages = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({ message: messages.join(", ") });
  }

  // Duplicate key (e.g. registering an email that already exists).
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || "field";
    return res.status(409).json({ message: `${field} already exists` });
  }

  console.error(err);
  res.status(500).json({ message: "Internal server error" });
};
