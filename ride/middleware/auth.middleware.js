const jwt = require("jsonwebtoken");
const axios = require("axios");

/**
 * Authenticates a user by verifying the JWT token and retrieving the user's data
 * from the user service.
 *
 * @param {Object} req - The request object
 * @param {Object} res - The response object
 * @param {Function} next - The callback function to be called after this middleware
 * @returns {Promise<void>}
 *
 * The middleware verifies the JWT token by attempting to verify it with the secret
 * key stored in the environment variable `JWT_SECRET`. If the token is invalid, the
 * middleware returns a 401 status code with an error message.
 *
 * If the token is valid, the middleware retrieves the corresponding user document
 * from the user service by querying the `user` model with the decoded user ID. If the
 * user document does not exist, the middleware returns a 401 status code with an
 * error message.
 *
 * Finally, the middleware assigns the retrieved user document to the `req.user`
 * property and calls the `next` callback function to continue the request-response
 * cycle.
 */
module.exports.userAuth = async (req, res, next) => {
  try {
    const token = req.cookies.token || req.headers.authorization.split(" ")[1];
    if (!token) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const response = await axios.get(`${process.env.BASE_URL}/user/profile`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const user = response.data;

    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    req.user = user;

    next();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Middleware to verify the authenticity of the Captain's JWT token and
 * to check if the token is blacklisted.
 *
 * @param {Object} req - The request object
 * @param {Object} res - The response object
 * @param {Function} next - The callback function to be called after this middleware
 * @returns {undefined}
 *
 * The middleware verifies the authenticity of the JWT token by attempting to
 * verify it with the secret key stored in the environment variable `JWT_SECRET`.
 * If the token is invalid, the middleware returns a 401 status code with an
 * error message.
 *
 * If the token is valid, the middleware retrieves the corresponding Captain
 * document from the captain service by querying the `captain` model with the
 * decoded user ID. If the Captain document does not exist, the middleware returns
 * a 401 status code with an error message.
 *
 * Finally, the middleware assigns the retrieved Captain document to the
 * `req.captain` property and calls the `next` callback function to continue the
 * request-response cycle.
 */
module.exports.captainAuth = async (req, res, next) => {
  try {
    const token = req.cookies.token || req.headers.authorization.split(" ")[1];
    if (!token) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const response = await axios.get(
      `${process.env.BASE_URL}/captain/profile`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const captain = response.data;

    if (!captain) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    req.captain = captain;

    next();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
