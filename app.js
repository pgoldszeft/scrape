const express = require('express');
const app = express();
const scraper = require('./scraper');
const port = 3000;

app.post("/stories", (req, res) => {
	scraper.postStories(req, res);
});

app.get("/stories/:storyId", (req, res) => {
	scraper.getStories(req, res);
});

app.use(express.static('public'));

// production error handler
// no stacktraces leaked to user
app.use(function (err, req, res, next) {
	res.status(err.status || 500);
	res.render('error', {
		message: err.message,
		error: {}
	});
});

app.listen(port, () => console.log(`App listening on port ${port}!`));
