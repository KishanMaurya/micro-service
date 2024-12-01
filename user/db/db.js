const mongoose = require("mongoose");

/**
 * Establishes a connection to the MongoDB database specified in the
 * environment variable MONGO_URL. Logs a message to the console upon
 * successful connection.
 *
 * @returns {undefined}
 */
function connect() {
  mongoose
    .connect(process.env.MONGO_URL)
    .then(() => {
      console.log("User service connected to MongoDB");
    })
    .catch((err) => {
      console.log(err);
    });
}

module.exports = connect;
