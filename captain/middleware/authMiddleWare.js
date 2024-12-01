const jwt = require('jsonwebtoken');
const captainModel = require('../models/captain.model');
const blacklisttokenModel = require('../models/blacklisttoken.model');


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
 * If the token is valid, the middleware checks if it is blacklisted by querying
 * the `blacklisttoken` model. If the token is blacklisted, the middleware returns
 * a 401 status code with an error message.
 *
 * If the token is not blacklisted, the middleware retrieves the corresponding
 * Captain document from the database by querying the `captain` model with the
 * decoded user ID. If the Captain document does not exist, the middleware returns
 * a 401 status code with an error message.
 *
 * Finally, the middleware assigns the retrieved Captain document to the
 * `req.captain` property and calls the `next` callback function to continue the
 * request-response cycle.
 */
module.exports.captainAuth = async (req, res, next) => {
    try {
        const token = req.cookies.token || req.headers.authorization.split(' ')[ 1 ];

        if (!token) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        // Verify the token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Check if the token is blacklisted
        const isBlacklisted = await blacklisttokenModel.find({ token });

        if (isBlacklisted.length) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        // Retrieve the corresponding Captain document
        const captain = await captainModel.findById(decoded.id);

        if (!captain) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        // Assign the retrieved Captain document to the `req.captain` property
        req.captain = captain;

        // Call the `next` callback function to continue the request-response cycle
        next();
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}
