const Cloudant = require('cloudant');
const {credentialsDB} = require('../config.js');

function cloudantService(cbk) {
	Cloudant(credentialsDB, function(err, cloudant) {
		if(err)
			return cbk(err);
		// get all data from ads db
		const db = cloudant.db.use("ads");
		getAllDocs(db, cbk);
	});
}

function getAllDocs(db, cbk) {
	let docsMap = new Map();
	db.list({include_docs: true}, function(err, body) {
  if (!err) {
    body.rows.forEach(function(row) {
			docsMap.set(row.key, row.doc);
    });
		return cbk(null, docsMap);
  } 
	cbk(err);
});
}
module.exports = cloudantService;