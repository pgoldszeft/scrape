const parsers = [
	{ property: 'og:title' },
	{ property: 'og:type' },
	{ property: 'og:url'},
	{ property: 'og:audio' },
	{ property: 'og:description' },
	{ property: 'og:determiner' },
	{ property: 'og:locale', isArray: true },
	{ property: 'og:site_name' }
];

module.exports = parsers;