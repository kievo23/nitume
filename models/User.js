const mongoose = require('mongoose');

var sys = require(__dirname + '/../config/System');
var db = mongoose.connect(sys.db_uri, {useMongoClient: true });
mongoose.Promise =require('bluebird');

const Schema = mongoose.Schema;

const userSchema = new Schema({
		username: { type: String},
		names: String,
		phone: { type: String, index: { unique: true, sparse: true }},
		role: String,
		email: String,
		otp: String
});

module.exports = mongoose.model('Users', userSchema);
