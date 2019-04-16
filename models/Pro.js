const mongoose = require('mongoose');
mongoose.plugin(schema => { schema.options.usePushEach = true });

var sys = require(__dirname + '/../config/System');
var db = mongoose.connect(sys.db_uri, {useMongoClient: true });
mongoose.Promise =require('bluebird');

const Schema = mongoose.Schema;

const profSchema = new Schema({
		nickname: { type: String},
		names: String,
		phone: { type: String, index: { unique: true, sparse: true }},
		password: String,
		role: String,
		email: { type: String, index: { unique: true, sparse: true }},
    pin: String,
    dob: String,
		gallery: Array,
		photo: String,
		occupation: String,
		locationname: String,
		location: {
		   type: { type: String,default: 'Point', enum: ['Point'] },
		   coordinates: [Number]
	  },
		reviews: Array,
		dis: String,
    idno: { type: String, index: { unique: true, sparse: true }},
    jobtype: { type: Schema.Types.ObjectId, ref: 'Category' },
		call_log: Array,
		otp: String,
		availability: Boolean,
		approved: Boolean
});

profSchema.index({ location: "2dsphere" });

module.exports = mongoose.model('Prof', profSchema);
