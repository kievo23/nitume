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
    userphone: String,
		status: Number,
    date: Date
});

module.exports = mongoose.model('Orders', ordersSchema);
