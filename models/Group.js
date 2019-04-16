const mongoose = require('mongoose');

var sys = require(__dirname + '/../config/System');
var db = mongoose.connect(sys.db_uri, {useMongoClient: true });
mongoose.Promise =require('bluebird');

const Schema = mongoose.Schema;

const groupSchema = new Schema({
		name: String,
    slug: String,
		children: Array,
		photo: String
});

module.exports = mongoose.model('Group', groupSchema);
