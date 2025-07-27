// middleware/pagination.js

module.exports = (model) => async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const page = parseInt(req.query.page) || 1;
    const skip = (page - 1) * limit;

    const totalItems = await model.countDocuments();
    const totalPages = Math.ceil(totalItems / limit);

    // Attach to res for later use in the controller
    res.pagination = {
      page,
      limit,
      skip, // ⬅️ helpful for controller
      totalItems,
      totalPages,
    };

    next(); // IMPORTANT! don’t forget this
  } catch (e) {
    console.error("Pagination middleware error:", e);
    res
      .status(400)
      .json({ message: "Error occurred while adding pagination object" });
  }
};
