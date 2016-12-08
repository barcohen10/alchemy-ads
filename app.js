const express = require('express');
const bodyParser = require('body-parser');
const request = require('request');
const path = require('path');

const app = express();

// cfenv provides access to your Cloud Foundry environment
// for more info, see: https://www.npmjs.com/package/cfenv
const cfenv = require('cfenv');

app.use(express.static(path.join(__dirname, 'public'))); 

app.use(bodyParser.json());

app.get('/', (req, res) => {
	res.sendFile(path.join(__dirname, 'public/index.html'));
});
  
app.use('/api', require('./api/index.js'));

// get the app environment from Cloud Foundry
var appEnv = cfenv.getAppEnv();

// start server on the specified port and binding host
app.listen(appEnv.port, '0.0.0.0', function() {
  // print a message when the server starts listening
  console.log("server starting on " + appEnv.url);
});