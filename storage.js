const MongoClient = require('mongodb').MongoClient;
const mongoUrl = 'mongodb://localhost:27017';
const dbName = 'scrape';
const collectionName = 'metadata';

function storage() {
	const me = this;
	this.cache = {};

	this.put = ( key, data ) => {
		return me.db.collection(collectionName).replaceOne( { id: key },	{ $set: { data } }, {upsert: true} );
//		me.cache[key] = data;
	}

	this.get = key => {
		return me.db.collection(collectionName).find({ id: key }).toArray();
		//		return me.cache[key];
	}

	MongoClient.connect( mongoUrl )
		.then( (client) => {
			me.db = client.db(dbName);
			console.log("Connected to MongoDB.");
		})
		.catch( err => console.error(err) ) ;
}

module.exports = storage;