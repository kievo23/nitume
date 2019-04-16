const mongoose = require('mongoose');
mongoose.plugin(schema => { schema.options.usePushEach = true });
var sys = require(__dirname + '/../config/System');

var db = mongoose.connect(sys.db_uri, {useMongoClient: true });
mongoose.Promise =require('bluebird');

const Schema = mongoose.Schema;

const catSchema = new Schema({
		name: { type: String,required: true, index: { unique: true, sparse: true }},
		slug: {
			type: String,
			unique: true
		},
		group: { type: Schema.Types.ObjectId, ref: 'Group' },
		price: String,
		profs: Array
});

module.exports = mongoose.model('Category', catSchema);
