const MongoClient = require('mongodb').MongoClient;
const mongoUrl = 'mongodb://localhost:27017';
const dbName = 'scrape';
const collectionName = 'metadata';

/**
 * Basic storage manager.  Implements put() and get() based on MongoDB.
 * @class
 */

function storage() {
	const me = this;

	/**
	 * Store an object by a specific key.
	 * @param key
	 * @param data
	 * @returns {Promise}
	 */
	this.put = ( key, data ) => {
		return me.db.collection(collectionName).replaceOne( { id: key },	{ $set: { data } }, {upsert: true} );
	}

	/**
	 * Retreive an object by its key.
	 * @param key
	 * @returns {Promise}
	 */
	this.get = key => {
		return me.db.collection(collectionName).find({ id: key }).toArray();
	}


	// Connect to MongoDB.
	MongoClient.connect( mongoUrl )
		.then( (client) => {
			me.db = client.db(dbName);
			console.log("Connected to MongoDB.");
		})
		.catch( err => console.error(err) ) ;
}

/**
 * @exports The {storage} class constructor.
 */

module.exports = storage;