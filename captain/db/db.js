const mongoose = require('mongoose');


/**
 * Connects the captain service to the MongoDB database specified in the
 * environment variable MONGO_URL.
 *
 * @returns {undefined}
 */
function connect() {
    mongoose.connect(process.env.MONGO_URL).then(() => {
        console.log('captain service connected to MongoDB');
    }).catch(err => {
        console.log(err);
    });
}


module.exports = connect;