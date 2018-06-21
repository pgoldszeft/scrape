const fetch = require('node-fetch');
const md5 = require('md5');
const cheerio = require('cheerio');
const Storage = require('./storage');

function Scrapper() {
	const me = this;

	this.parsers = {};

	this.initParsers = () => {
		require('./parsers/basicParsers').forEach( parser => {
			me.parsers[parser.property] = parser;
		});
		require('./parsers/imageParser').forEach( parser => {
			me.parsers[parser.property] = parser;
		});
	};

	this.findField = ( metaObj, path, createIfNotFound ) => {
		let current = metaObj;

		for( let i=0; i<path.length; i++ ){
			let fieldName = path[i];
			let field = current;

			if ( fieldName !== 'og' ) {
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

	this.getParent = ( metaObj, path ) => {
		if ( path.length <= 1 )
			return null;

		return me.findField( metaObj, path.slice(0, path.length-1), true );
	};

	this.extractMeta = html => {
		const $ = cheerio.load(html);
		const metaObj = {};

		$("meta[property]").each( (i, elem) => {
			console.log( `property: ${elem.attribs.property}  content: ${elem.attribs.content}` );
			const prop = elem.attribs.property;
			const _content = elem.attribs.content;

			if ( !me.parsers[prop] ) {
				console.warn(`Warning: no parser defined for property '${prop}'`);
				return;
			}

			const parser = me.parsers[prop];
			const fields = prop.split(':');

			const fieldName = parser.fieldName || fields[fields.length-1];
			const content  = parser.parser ? parser.parser(_content) : _content;
			let parent = me.getParent( metaObj, fields );

			if ( parent instanceof Array ){
				if ( parser.isArray ) {
					parent.push({});
				}

				if ( parent instanceof Array )
					parent = parent.length > 0 ? parent[ parent.length-1 ] : parent;

				if ( parser.isStruct ) {
					parent[fieldName] = content;
				}
				else
					parent.push( content );
			}
			else {
				if ( parser.isArray ){
					const arrName = fields[fields.length-1];
					const newObj = {};
					if ( parser.fieldName )
						newObj[fieldName] = content;
					if ( !parent[arrName] )
						parent[arrName] = [];

					parent[arrName].push(newObj);
				}
				else
					parent[fieldName] = content;
			}
		});

		console.log(JSON.stringify(metaObj, null, 4));
		return metaObj;
	};


	this.scrapUrl = url => {
		return new Promise( (resolve, reject) => {
			fetch( url )
				.then( res => {
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

	this.getStories = (req, res) => {
		if ( req.params && req.params.storyId ) {
			const storyId = req.params.storyId;
			console.log('getStories: ' + storyId);

			me.storage.get(storyId)
				.then( resObj => {
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

	this.updateStatus = (dataObj, id, status) => {
		dataObj.id = id;
		dataObj.status = status;
		dataObj.updated_time = (new Date()).toISOString();

		me.storage.put(id, dataObj)
			.then( obj => {} )
			.catch( err => console.error( err ) );
	};

	this.postStories = (req, res) => {
		if ( req.query && req.query.url ) {
			const id = md5(req.query.url);
			console.log('postStories: ' + req.query.url);

			me.updateStatus({}, id, 'pending');

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

module.exports = new Scrapper();