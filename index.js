require("dotenv").config();
const SpotifyWebApi = require("spotify-web-api-node");
const http = require("http");
const express = require("express");
const _ = require("lodash");
const NodeCache = require("node-cache");
const cache = new NodeCache({
	stdTTL: 1,
});

let app = express();

var isTokenValid = false;
var nowPlayingData;

(async () => {
	var scopes = ["user-read-private", "user-read-currently-playing", "user-read-playback-state", "user-read-email"];

	var spotifyApi = new SpotifyWebApi({
		clientId: process.env.SPOTIFY_CLIENTID,
		clientSecret: process.env.SPOTIFY_CLIENTSECRET,
		redirectUri: process.env.SPOTIFY_REDIRECTURI,
	});

	var authorizeURL = spotifyApi.createAuthorizeURL(scopes);

	console.log(authorizeURL);

	app.get("/now-playing", async (req, res) => {
		if (isTokenValid) {
			if (cache.get("isFresh")) {
				console.log("Cache is still fresh!");
			} else {
				nowPlayingData = await spotifyApi
					.getMyCurrentPlaybackState({})
					.then(data => data.body)
					.catch(err => {
						console.error("Can't get current playback:", err);
					});
				if (_.isEmpty(nowPlayingData)) nowPlayingData = { is_not_playing: true };
				cache.set("isFresh", true);
			}
			res.json(nowPlayingData);
		} else {
			res.json({
				error: "Token is invalid!",
			});
		}
	});

	//Redirect to authorizeURL if isTokenValid is false, otherwise this is for the auth callback
	app.get("/spotify", async (req, res) => {
		if (isTokenValid) {
			res.send("Token is already valid!");
		} else {
			if (req.query.code) {
				let code = req.query.code;
				console.log("Code: ", code);

				await spotifyApi
					.authorizationCodeGrant(code)
					.then(data => {
						spotifyApi.setAccessToken(data.body["access_token"]);
						spotifyApi.setRefreshToken(data.body["refresh_token"]);
						console.log("Auth successful, data:", data);
						isTokenValid = true;
					})
					.catch(err => {
						console.error("Auth code grant error:", err);
						isTokenValid = false;
					});

				await spotifyApi
					.getMe()
					.then(data => {
						if (data.body.email === process.env.EMAIL_EXPECTED) {
							console.log("Expected email!");
							res.send("Code received!");
						} else {
							console.log("Unexpected email!");
							isTokenValid = false;
							res.send("Unexpected user!");
						}
					})
					.catch(err => {
						console.error("Can't get user info:", err);
						res.send("Can't get user info.");
					});
			} else {
				res.redirect(authorizeURL);
			}
		}
	});

	const refresher = async () => {
		spotifyApi
			.refreshAccessToken()
			.then(data => {
				console.log("Access token refreshed!");
				spotifyApi.setAccessToken(data.body["access_token"]);
				isTokenValid = true;
			})
			.catch(err => {
				console.error("Refresh failed. Did you log in?", err);
				isTokenValid = false;
			});
	};
	setInterval(refresher, 1000 * 60 * 5);

	let server = app.listen(process.env.PORT || 3000, () => {
		console.log("Server listening to port 3000");
	});
})();
