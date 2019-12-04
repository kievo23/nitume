var config = require(__dirname + '/../config.json');
let admin = require('firebase-admin');

let firebase = admin.initializeApp({
  credential: admin.credential.cert(config.firebaseAccountKey),
  databaseURL: "https://nitume-4cfe0.firebaseio.com"
});

module.exports = {
	db_uri: config.db_uri,
	firebase : firebase
}
