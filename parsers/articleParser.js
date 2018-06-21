const parsers = [
	{ property: 'article:published_time' },
	{ property: 'article:modified_time'},
	{ property: 'article:published' },
	{ property: 'article:modified' },
	{ property: 'article:author' },
	{ property: 'article:section' },
	{ property: 'article:tag', isArray: true }
];

module.exports = parsers;