const userModel = require("../models/user.model");
const blacklisttokenModel = require("../models/blacklisttoken.model");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { subscribeToQueue } = require("../service/rabbit");
const EventEmitter = require("events");
const rideEventEmitter = new EventEmitter();

/**
 * Registers a new user and assigns a JWT token to the user.
 * @param {Object} req - The request object
 * @param {Object} res - The response object
 * @returns {Promise<void>}
 *
 * The function hashes the password using bcrypt, creates a new user document
 * with the hashed password, saves the document and assigns a JWT token to the
 * user using the user's ID as payload. The token is then set as a cookie in the
 * response. The user document is returned in the response without the password.
 * If an error occurs, the function returns a 500 status code with an error
 * message.
 */
module.exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const user = await userModel.findOne({ email });

    if (user) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hash = await bcrypt.hash(password, 10);
    const newUser = new userModel({ name, email, password: hash });

    await newUser.save();

    const token = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    res.cookie("token", token);

    delete newUser._doc.password;

    res.send({ token, newUser });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Logs in an existing user by verifying the email and password.
 * 
 * @param {Object} req - The request object containing the email and password in the request body.
 * @param {Object} res - The response object used to return the login result.
 * @returns {Promise<void>}
 * - Returns a 200 status with a JWT token and the user document if login is successful.
 * - Returns a 400 status with an error message if the email or password is invalid.
 * - Returns a 500 status with an error message if an internal error occurs.
 */
module.exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await userModel.findOne({ email }).select("+password");

    if (!user) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    delete user._doc.password;

    res.cookie("token", token);

    res.send({ token, user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Logs out an existing user by blacklisting the JWT token and clearing the token cookie.
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
    res.clearCookie("token");
    res.send({ message: "User logged out successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Returns the profile of the authenticated user.
 * 
 * @param {Object} req - The request object containing the authenticated user in the request context.
 * @param {Object} res - The response object used to return the user profile.
 * @returns {Promise<void>}
 * - Returns a 200 status with the user profile if successful.
 * - Returns a 500 status with an error message if an internal error occurs.
 */
module.exports.profile = async (req, res) => {
  try {
    res.send(req.user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Long polls for a ride to be accepted by a Captain.
 * 
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @returns {Promise<void>}
 * - Returns a 200 status with the accepted ride if successful.
 * - Returns a 204 status with no response if timeout occurs.
 */
module.exports.acceptedRide = async (req, res) => {
  // Long polling: wait for 'ride-accepted' event
  rideEventEmitter.once("ride-accepted", (data) => {
    res.send(data);
  });

  // Set timeout for long polling (e.g., 30 seconds)
  setTimeout(() => {
    res.status(204).send();
  }, 30000);
};


subscribeToQueue("ride-accepted", async (msg) => {
  const data = JSON.parse(msg);
  rideEventEmitter.emit("ride-accepted", data);
});
