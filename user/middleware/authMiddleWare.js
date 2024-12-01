const jwt = require("jsonwebtoken");
const userModel = require("../models/user.model");
const blacklisttokenModel = require("../models/blacklisttoken.model");

/**
 * Middleware to authenticate a user by verifying their JWT token and checking if the token is blacklisted.
 *
 * @param {Object} req - The request object containing cookies and headers with the JWT token.
 * @param {Object} res - The response object used to return the authentication result.
 * @param {Function} next - The callback function to continue the request-response cycle.
 * @returns {Promise<void>}
 *
 * The middleware first checks if the token is present in cookies or headers. If not, it returns a 401 status.
 * It then checks if the token is blacklisted by querying the blacklisttoken model. If blacklisted, it returns a 401 status.
 * If the token is valid, it verifies it using the secret key from the environment variable `JWT_SECRET`.
 * It retrieves the corresponding user document from the user model using the decoded user ID.
 * If the user does not exist, it returns a 401 status. Otherwise, it assigns the user document to `req.user` and calls `next`.
 * In case of errors, it returns a 500 status with the error message.
 */
module.exports.userAuth = async (req, res, next) => {
  try {
    const token = req.cookies.token || req.headers.authorization.split(" ")[1];

    if (!token) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const isBlacklisted = await blacklisttokenModel.find({ token });

    if (isBlacklisted.length) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await userModel.findById(decoded.id);

    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    req.user = user;

    next();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
