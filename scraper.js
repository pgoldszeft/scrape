const fetch = require('node-fetch');
const md5 = require('md5');
const cheerio = require('cheerio');
const Storage = require('./storage');

/**
 * Utility for scraping metadata from web pages.  It implements two main methods: {postStories} and {getStories}.
 * The first one is the one that initiates the process of scrapping the metadata of the requested URL.
 * The second method returns an object describing the scrapped metadata.
 * @class
 * @constructor
 */

function Scrapper() {
	const me = this;
	this.parsers = {};

	/**
	 * @private Loads the metatdata parsers.
	 */

	this.initParsers = () => {
		[
			'./parsers/basicParsers',
			'./parsers/imageParser',
			'./parsers/videoParser',
			'./parsers/articleParser'
		].forEach( parserFile => {
			require(parserFile).forEach( parser => {
				me.parsers[parser.property] = parser;
			});
		});
	};

	/**
	 * Search for a specific object/field in the metadata object given the path of the object.
	 * @private
	 * @method
	 * @param {object} metaObj Holds the metadata object.
	 * @param {array} path Hold
	 * @param {boolean} [createIfNotFound=false] If true then the method creates the objects in the path that don't exist.
	 * @returns {object|array}
	 */
	this.findField = ( metaObj, path, createIfNotFound ) => {
		let current = metaObj;

		for( let i=1; i<path.length; i++ ){
			let fieldName = path[i];
			let field = current;

			if ( true /*fieldName !== 'og'*/ ) {
				if ( current instanceof Array ) {
					let arr = current[ current.length - 1 ];
					if ( arr && arr.length > 0 )
						field = current[fieldName];
					else
						field = null;
				}
				else
					field = current[fieldName];
			}

			if ( !field ) {
				if ( !createIfNotFound ) {
					current = field;
					break;
				}

				field = [];
				current[fieldName] = field;
			}

			current = field;
		}

		return current;
	};

	/**
	 * Get the parent of the node specified in the {path} parameter.
	 * @private
	 * @method
	 * @param {object} metaObj Holds the metadata object.
	 * @param {array} path Array of strings representing the path to the object in metaObj.
	 * @returns {object|array}
	 */

	this.getParent = ( metaObj, path ) => {
		if ( path.length <= 1 )
			return null;

		return me.findField( metaObj, path.slice(0, path.length-1), true );
	};

	/**
	 * Parses an input HTML string and returns a metadata object.
	 * @public
	 * @method
	 * @param {string} html Input HTML text to be parsed.
	 * @returns {object} Object representing the metadata scraped from the incoming HTML.
	 */

	this.extractMeta = html => {

		const metaObj = {};

		// Load the HTML to the DOM.
		const $ = cheerio.load(html);

		// Search all the <meta> tags with a 'property' attribute.
		$("meta[property]").each( (i, elem) => {
			console.log( `property: ${elem.attribs.property}  content: ${elem.attribs.content}` );

			const prop = elem.attribs.property;
			const _content = elem.attribs.content;

			// Return if there's no parser for the specified property.
			if ( !me.parsers[prop] ) {
				console.warn(`Warning: no parser defined for property '${prop}'`);
				return;
			}

			// Get the parser for the specific property.
			const parser = me.parsers[prop];

			// Get the path to the specific field
			const fields = prop.split(':');

			// Get the field name
			const fieldName = parser.fieldName || fields[fields.length-1];

			// If the parser specifies a custom parser() routine, then call the custom parser, otherwise use
			// the content specified by the "content" attribute.
			const content  = parser.parser ? parser.parser(_content) : _content;

			let parent = me.getParent( metaObj, fields );

			// If the parent is an array
			if ( parent instanceof Array ){
				if ( parser.isArray ) {
					parent.push({});
				}

				if ( parent instanceof Array )
					parent = parent.length > 0 ? parent[ parent.length-1 ] : parent;

				// In the case the requested field is part of a structure, add the field to the structure.
				// Otherwise, add the content to the parent as an item of the array.

				if ( parser.isStruct ) {
					parent[fieldName] = content;
				}
				else
					parent.push( content );
			}
			else {
				// If we need to store the field in an array.
				if ( parser.isArray ){
					const arrName = fields[fields.length-1];
					if ( !parent[arrName] )
						parent[arrName] = [];

					let newObj;
					if ( parser.isStruct ) {
						newObj = {};
						if (parser.fieldName)
							newObj[fieldName] = content;
					}
					else
						newObj = content;

					parent[arrName].push(newObj);
				}
				else
					parent[fieldName] = content;
			}
		});

		console.log(JSON.stringify(metaObj, null, 4));

		// Return the metadata object.
		return metaObj;
	};

	/**
	 * Fetches a web page given its URL and scrapes its metadata.
	 * @public
	 * @method
	 * @param {string} url URL of the page to scrape.
	 * @returns {Promise<object>} Promise to the metadata object.
	 */
	this.scrapUrl = url => {
		return new Promise( (resolve, reject) => {
			// Fetch the web page.
			fetch( url )
				.then( res => {
					// Check the HTTP status code for errors.
					if ( res.status !== 200 )
						throw new Error(res.statusText);
					return res.text();
				} )
				.then( html => me.extractMeta(html) )
				.then( metaObj => resolve( metaObj ) )
				.catch( err => {
//					console.error(err);
					reject(err);
				});
		});
	};

	/**
	 * Returns the metadata object previously created, given a HTTP request with the ID of a story.
	 * @method
	 * @public
	 * @param req Incoming request
	 * @param res Outgoing response
	 */

	this.getStories = (req, res) => {
		if ( req.params && req.params.storyId ) {
			const storyId = req.params.storyId;
			console.log('getStories: ' + storyId);

			// Retrieve the metadata object from the storage.
			me.storage.get(storyId)
				.then( resObj => {
					// If the object was found then return it, otherwise return an error.
					if ( resObj.length > 0 )
		+				res.status(200).json(resObj[0].data);
					else
						res.status(400).send("Error: Unrecognized story ID.");
				})
				.catch( err => {
					res.status(400).send("Error: Unrecognized story ID.");
				});
		}
	};

	/**
	 * Utility that updates the status of a metadata object with its ID and its status and stores the object in the
	 * storage.
	 * @param dataObj The metadata object.
	 * @param id The ID of the object
	 * @param status The new status to the object.
	 */

	this.updateStatus = (dataObj, id, status) => {
		dataObj.id = id;
		dataObj.status = status;
		dataObj.updated_time = (new Date()).toISOString();

		// Store the object by its ID.
		me.storage.put(id, dataObj)
			.then( obj => {} )
			.catch( err => console.error( err ) );
	};

	/**
	 * Initiates the process of fetching and scraping a web page given its URL.
	 * @method
	 * @public
	 * @param req
	 * @param res
	 */
	this.postStories = (req, res) => {
		if ( req.query && req.query.url ) {

			// Create an ID by the requested URL.  The ID will be the same every time the same URL is specified.
			const id = md5(req.query.url);

			console.log('postStories: ' + req.query.url);

			// Create a new object, set its ID and set its status to be 'pending'.
			// Store the object for further request.
			me.updateStatus({}, id, 'pending');

			// Initiate the process of fetching and scraping the web page.
			// If everything OK, then update the object's status to 'done'.
			// Otherwise, mark it as 'error'.
			me.scrapUrl(req.query.url)
				.then( metaObj => me.updateStatus(metaObj, id, 'done') )
				.catch( err => {
					me.updateStatus( {}, id, 'error' );
					console.error( err );
				} );

			res.status(200).send(id);
		} else {
			res.status(400).send('Bad request: must provide a url.')
		}
	}

	this.initParsers();
	this.storage = new Storage();
}

/**
 * @exports An instance of the {Scrapper} class.
 * @type {Scrapper}
 */

module.exports = new Scrapper();