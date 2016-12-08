module.exports = {
	api_key: process.env.alchemy_key,

	parameters: {
	  extract: 'entities, keywords, concepts, taxonomy',
	  sentiment: 1,
	  maxRetrieve: 1
	},

	dbName: 'ads',

	credentialsDB: {
	"username": process.env.username_DB,
  "password": process.env.password_DB,
  "host": process.env.host_DB,
  "port": process.env.port_DB,
  "url": process.env.url_DB
}
	
}