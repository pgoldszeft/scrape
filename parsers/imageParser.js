const parsers = [
	{ property: 'og:image', fieldName: 'url', isStruct: true, isArray: true },
	{ property: 'og:image:url', isStruct: true },
	{ property: 'og:image:width', isStruct: true, parser: parseInt },
	{ property: 'og:image:height', isStruct: true, parser: parseInt  },
	{ property: 'og:image:alt', isStruct: true},
	{ property: 'og:image:type', isStruct: true }
];

module.exports = parsers;