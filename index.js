require("dotenv").config();
const axios = require("axios");
const http = require("http");
const NodeCache = require("node-cache");
const cache = new NodeCache({
	stdTTL: 1,
});

(async () => {
	const client = axios.create({
		baseURL: " https://api.spotify.com/v1/",
		headers: {
			Authorization: `Bearer ${process.env.SPOTIFY_OAUTH_TOKEN}`,
		},
	});

	var data = await client
		.get("/me/player/currently-playing")
		.then(res => {
			console.log(res.data);
			return res.data;
		})
		.catch(err => {
			console.error(err);
		});

	var app = http
		.createServer(async (req, res) => {
			res.setHeader("Content-Type", "application/json");

			if (!cache.get("isFresh")) {
				data = await client
					.get("/me/player/currently-playing")
					.then(res => {
						console.log(res.data);
						return res.data;
					})
					.catch(err => {
						console.error(err);
					});
				cache.set("isFresh", true);
			} else {
				console.log("Cache is still fresh!");
			}

			res.end(JSON.stringify(data));
		})
		.listen(process.env.PORT || 3000);
})();
