function process( options ) {
	const me = this;
	const cycleTime = 500;
	const maxHandlesPerCycle = 20;

	this.requests = [];
	this.interval = -1;

	this.addRequest = request => {
		me.requests.push( request );
	};

	this.process = () => {
		if ( !me.handler )
			return;

		let numRequests = maxHandlesPerCycle;
		while( numRequests-- > 0 && me.requests.length > 0 ) {
			const req = me.requests.shift();
			me.handler(req);
		}
	};

	this.stop = () => {
		if ( me.interval !== -1 )
			clearInterval(me.interval);
	}

	if ( options && options.handler )
		this.handler = options.handler;

	this.interval = setInterval( this.process, cycleTime );
}

module.exports = process;