const watson = require('watson-developer-cloud');
const async = require('async');
const { api_key, parameters } = require('../config.js');
const cloudantService = require('./cloudantService.js');
const utilsService = require('./utilsService.js');

const alchemy_language = watson.alchemy_language({ api_key });

function alchemyService(inputUrl, indexCallback) {
	/**
	--- call alchemy api with params ---
      waterfall sequence:
     	1) get result from emotion api call to alchemy
     	2) check if anger or disgust levels are greater than 0.5
     	   - if true, continue to analyze content
     	   - if false, return 
     	3) parallel sequence:
     	     3.1) analyze url content
     	     3.2) get all ads from cloudantDB
			 3.3) analyze all ads from cloudantDB + compare to url content analysis + select Ad
     	4) call index callback to return results

	 */

	 async.waterfall([
	 	// 1) get result from emotion api call to alchemy
	 	function(callback) {
			alchemy_language.emotion({url: inputUrl}, function(err, response) {
			  callback(err, response);
			});
	 	},
	 	// 2) check if anger or disgust levels are greater than 0.5
	 	function(result, callback) {
	 		return checkAngerDigustLevels(result.docEmotions, callback);
	 	},
	 	// 3)
	 	function(obj, callback) {
	 		if(obj && obj.status === 'fold') {
	 			return callback(null, obj);
	 		}
	 		async.parallel([
	 			// 3.1) analayze url content
	 			function(cbk) {
					 // set url supplied by user
					 let paramsWithUrl = Object.assign(parameters, {url: inputUrl});
					alchemy_language.combined(paramsWithUrl, (err, response) => cbk(err, response));
				},
				// 3.2) get all ads from cloudantDB (in Map format)
				function(cbk) {
					cloudantService((err, result) => cbk(err, result));
				}
			],
			function(err, results) {
				const [urlAnalysis, adsMapFromDB] = results;
				let adsAnalysisArray;

				if(!!err)
					return callback(err);

				//3.3) analyze all ads from cloudantDB + compare to url content analysis
					analyzeAndCompare(adsMapFromDB, urlAnalysis, callback);
			});
	 	}
	 ],
	 // 4)
	 function(err, result) {
	 	indexCallback(err, result);
	 });
}

function checkAngerDigustLevels(docEmotions, callback) {
	const { anger, disgust } = docEmotions;
	 		console.log(docEmotions);
	 		if(Number(anger) > 0.5 || Number(disgust) > 0.5) {
				 //just continue to next task
	 			return callback(null, null);
	 		}
	 		return callback(null, {status: 'fold'});
}

function analyzeAds(adsMap, callback) {
	let analyzeAdsFuncs = [];
	adsMap.forEach( (val, key) => 
	analyzeAdsFuncs.push(function(cbk){
		let paramsWithText = Object.assign({text: `name: ${key}, category: ${val.category}, text: ${val.text}`});
	alchemy_language.combined(paramsWithText, (err, response) => cbk(err, [key, response]));
	}));

		async.parallel(analyzeAdsFuncs,
			function(err, results) {
				if(!!err)
				callback(err);
				
				callback(null, new Map(results));
			});
}

//this method will compare and returns the most relevant ad + reason - if exists
function getAd(urlAnalysis, adsAnalysisMap) {
	//map of (key = ad, value = {relevance, reason:{type, relevance, value})
	const adsRelevanceMap = new Map();
	let mostRelevantAd = null;

	adsAnalysisMap.forEach( function(adAnalysis, key) {
		let maxRelevantKeyword, maxRelevantEntity, maxRelevantConcept, maxRelevantTaxonomy,
		maxRelevant;

        //compare keywords and select the most relevant
		maxRelevantKeyword = getMaxRelevant('keyword', urlAnalysis.keywords, adAnalysis.keywords);

		//compare entities and select the most relevant
		maxRelevantEntity = getMaxRelevant('entity', urlAnalysis.entities, adAnalysis.entities);

		//compare concepts and select the most relevant
		maxRelevantConcept = getMaxRelevant('concept', urlAnalysis.concepts, adAnalysis.concepts);

		 //compare taxonomy and select the bigger score
		maxRelevantTaxonomy = getMaxRelevant('taxonomy', urlAnalysis.taxonomy, adAnalysis.taxonomy, 'label', 'score');

		//Get the max from all
		maxRelevant = [maxRelevantKeyword, maxRelevantEntity, maxRelevantConcept]
		.sort(function(a,b){ return (a.relevance - b.relevance); }).pop();

		if(maxRelevant.relevance > 0) {
			adsRelevanceMap.set(key, maxRelevant);
		}

		});

		//return the most relevant ad
		if(adsRelevanceMap.size === 1) {
		  mostRelevantAd = {adName : Array.from(adsRelevanceMap)[0][0] , reason : Array.from(adsRelevanceMap)[0][1]};
		}
		else if(adsRelevanceMap.size > 1) {
			let maxRelevant = 0, adName = '';

			adsRelevanceMap.forEach((ad, key) => {
				if(ad.value.relevance > maxRelevant) {
					maxRelevant = ad.value.relevance;
					adName = key;
				}
			});

			mostRelevantAd = {adName : adName , reason : adsRelevanceMap.get(adName)};
		}

		return mostRelevantAd;
	

}

//this method will get 2 arrays and will return relevant item if exists
function getMaxRelevant(type, arrUrl, arrAd, textPropertyName = 'text', relevancePropertyName = 'relevance') {
let maxRelevant = {type: type, relevance: 0, value: ''};
if(!!arrUrl && !!arrAd){
	arrUrl.forEach(function(urlItem) {
		arrAd.forEach(function(adItem) {
			if(urlItem[textPropertyName] === adItem[textPropertyName]) {
				maxRelevant = maxRelevant.relevance < Number(adItem[relevancePropertyName]) ? 
				{type: maxRelevant.type, relevance: adItem[relevancePropertyName], value: adItem[textPropertyName]} : maxRelevant;
			}
			})});
		}
		return maxRelevant;
}

function analyzeAndCompare(adsMapFromDB, urlAnalysis, callback) {
		async.waterfall([
	 		function(asyncWaterfallCbk) {
					analyzeAds(adsMapFromDB, function(err, response) {
			  			asyncWaterfallCbk(err, {urlAnalysis: urlAnalysis, adsAnalysisMap: response});
			});
	 	},
	 	function(result, asyncWaterfallCbk) {
	 		const selectedAd = getAd(result['urlAnalysis'], result['adsAnalysisMap']);
			 asyncWaterfallCbk(null, selectedAd);
	 	}
	 ],
	 function(err, result) {
		 if(!!err)
		 callback(err);

		if(!!result)
		result.ad = adsMapFromDB.get(result.adName);

	 	callback(null, result);
	 });
}
	

module.exports = alchemyService;
