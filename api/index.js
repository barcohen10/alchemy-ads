const router = require('express').Router();
const alchemyService = require('./alchemyService.js');

router.
	post('/analyze', (req, res) => {
		alchemyService(req.body.url, function(err, result) {
			if(err)
				return res.json({status: 'error'});
			if(result && result.status && result.status === 'fold') 
				return res.json({status: 'no_ads'});
			res.json(result);
		});
	});


module.exports = router;