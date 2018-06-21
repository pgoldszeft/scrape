const parsers = [
	{ property: 'article:published_time', isStruct: true },
	{ property: 'article:modified_time', isStruct: true },
	{ property: 'article:author', isStruct: true },
	{ property: 'article:section', isStruct: true },
	{ property: 'article:tag', isStruct: true }
];

module.exports = parsers;