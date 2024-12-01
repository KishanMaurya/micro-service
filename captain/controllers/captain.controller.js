const captainModel = require('../models/captain.model');
const blacklisttokenModel = require('../models/blacklisttoken.model');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { subscribeToQueue } = require('../service/rabbit')

const pendingRequests = [];

/**
 * Register a new captain
 * @param {Object} req - The request object
 * @param {Object} res - The response object
 * @returns {Promise<void>}
 */
module.exports.register = async (req, res) => {
    try {
        const { name, email, password } = req.body;
        const captain = await captainModel.findOne({ email });

        if (captain) {
            return res.status(400).json({ message: 'captain already exists' });
        }

        // Hash the password
        const hash = await bcrypt.hash(password, 10);
        const newcaptain = new captainModel({ name, email, password: hash });

        // Save the new captain to the database
        await newcaptain.save();

        // Generate a JWT token
        const token = jwt.sign({ id: newcaptain._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

        // Set the token as a cookie
        res.cookie('token', token);

        // Remove the password from the response
        delete newcaptain._doc.password;

        // Return the new captain and the token
        res.send({ token, newcaptain });
    } catch (error) {
        // Handle any errors that occur
        res.status(500).json({ message: error.message });
    }
}

/**
 * Logs out a captain by blacklisting the JWT token and clearing the token cookie.
 * 
 * @param {Object} req - The request object containing the JWT token in the cookie.
 * @param {Object} res - The response object used to return the logout result.
 * @returns {Promise<void>}
 * - Returns a 200 status with a success message if logout is successful.
 * - Returns a 500 status with an error message if an internal error occurs.
 */
module.exports.logout = async (req, res) => {
    try {
        const token = req.cookies.token;
        await blacklisttokenModel.create({ token });
        res.clearCookie('token');
        res.send({ message: 'captain logged out successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

/**
 * Returns the profile of the authenticated captain.
 * 
 * @param {Object} req - The request object containing the authenticated captain in the request context.
 * @param {Object} res - The response object used to return the captain profile.
 * @returns {Promise<void>}
 * - Returns a 200 status with the captain profile if successful.
 * - Returns a 500 status with an error message if an internal error occurs.
 */
module.exports.profile = async (req, res) => {
    try {
        res.send(req.captain);
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: error.message });
    }
}

/**
 * Toggles the availability of a captain.
 * 
 * @param {Object} req - The request object containing the captain id.
 * @param {Object} res - The response object used to return the captain details.
 * @returns {Promise<void>}
 * - Returns a 200 status with the updated captain details if successful.
 * - Returns a 500 status with an error message if an internal error occurs.
 */
module.exports.toggleAvailability = async (req, res) => {
    try {
        const captain = await captainModel.findById(req.captain._id);
        captain.isAvailable = !captain.isAvailable;
        await captain.save();
        res.send(captain);
    } catch (error) {

        res.status(500).json({ message: error.message });
    }
}

/**
 * Sets up long polling for new ride requests.
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @returns {Promise<void>}
 * - Sets a timeout for 30 seconds.
 * - Adds the response object to the pendingRequests array.
 */
module.exports.waitForNewRide = async (req, res) => {
    // Set timeout for long polling (e.g., 30 seconds)
    req.setTimeout(30000, () => {
        res.status(204).end(); // No Content
    });

    // Add the response object to the pendingRequests array
    pendingRequests.push(res);
};

subscribeToQueue("new-ride", (data) => {
    const rideData = JSON.parse(data);

    // Send the new ride data to all pending requests
    pendingRequests.forEach(res => {
        res.json(rideData);
    });

    // Clear the pending requests
    pendingRequests.length = 0;
});