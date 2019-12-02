const mongoose = require('mongoose');

var sys = require(__dirname + '/../config/System');
var db = mongoose.connect(sys.db_uri, {useMongoClient: true });
mongoose.Promise =require('bluebird');

const Schema = mongoose.Schema;

const ordersSchema = new Schema({
		category: { type: String},
		destination: Object,
    distance: String,
    duration: String,
    items: Array,
    price: String,
    source: Object,
    usernames: String,
    mode: String,
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Users'
    },
    prof: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Prof'
    },
		status: Number,
    date: Date
});

module.exports = mongoose.model('Orders', ordersSchema);
