const parsers = [
	{ property: 'video:actor', isStruct: true, isArray: true },
	{ property: 'video:actor:role', isStruct: true },
	{ property: 'video:director', isStruct: true },
	{ property: 'video:writer', isStruct: true },
	{ property: 'video:duration', isStruct: true, parser: parseInt},
	{ property: 'video:release_date', isStruct: true},
	{ property: 'video:tag', isStruct: true },
	{ property: 'video:tv_show', isStruct: true}
];

module.exports = parsers;