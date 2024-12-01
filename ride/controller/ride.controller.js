const rideModel = require("../models/ride.model");
const { subscribeToQueue, publishToQueue } = require("../service/rabbit");

/**
 * Creates a new ride request.
 *
 * @param {Object} req - The request object containing the pickup and destination details.
 * @param {Object} res - The response object used to send back the created ride.
 * @param {Function} next - The next middleware function.
 * @returns {Promise<void>}
 * - Saves a new ride to the database.
 * - Publishes the ride to the "new-ride" queue.
 * - Sends the created ride as a response.
 */
module.exports.createRide = async (req, res, next) => {
  const { pickup, destination } = req.body;

  const newRide = new rideModel({
    user: req.user._id,
    pickup,
    destination,
  });

  await newRide.save();
  publishToQueue("new-ride", JSON.stringify(newRide));
  res.send(newRide);
};

/**
 * Accepts a ride request.
 *
 * @param {Object} req - The request object containing the ride id as a query parameter.
 * @param {Object} res - The response object used to send back the accepted ride.
 * @param {Function} next - The next middleware function.
 * @returns {Promise<void>}
 * - Updates the ride status to "accepted" in the database.
 * - Publishes the ride to the "ride-accepted" queue.
 * - Sends the accepted ride as a response.
 */
module.exports.acceptRide = async (req, res, next) => {
  const { rideId } = req.query;
  const ride = await rideModel.findById(rideId);
  if (!ride) {
    return res.status(404).json({ message: "Ride not found" });
  }

  ride.status = "accepted";
  await ride.save();
  publishToQueue("ride-accepted", JSON.stringify(ride));
  res.send(ride);
};
