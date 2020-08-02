require("dotenv").config();
const SpotifyWebApi = require("spotify-web-api-node");
const http = require("http");
const express = require("express");
const NodeCache = require("node-cache");
const cache = new NodeCache({
	stdTTL: 1,
});

let app = express();

(async () => {
	var scopes = ["user-read-currently-playing"];

	var spotifyApi = new SpotifyWebApi({
		clientId: process.env.SPOTIFY_CLIENTID,
		clientSecret: process.env.SPOTIFY_CLIENTSECRET,
		redirectUri: process.env.SPOTIFY_REDIRECTURI,
	});

	var authorizeURL = spotifyApi.createAuthorizeURL(scopes);

	console.log(authorizeURL);

	app.get("/spotify", async (req, res) => {
		let code = req.query.code;
		console.log("Code: ", code);

		spotifyApi
			.authorizationCodeGrant(code)
			.then(data => {
				spotifyApi.setAccessToken(data.body["access_token"]);
				spotifyApi.setRefreshToken(data.body["refresh_token"]);
			})
			.catch(err => {
				console.error(err);
			});

		res.send("Hello world!");
	});

	let server = app.listen(3000, () => {
		console.log("Server listening to port 3000");
	});

	const refresher = async spotifyApi => {
		await spotifyApi
			.refreshAccessToken()
			.then(data => {
				console.log("Access token refreshed!");
				spotifyApi.setAccessToken(data.body["access_token"]);
			})
			.catch(err => {
				console.error(err);
			});
		return Promise.delay(1000 * 60 * 5).then(refresher);
	};
	refresher(spotifyApi);
})();
