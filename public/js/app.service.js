app.service('adsService', ['$http', 

	function($http) {
		this.analyzeUrl = function(url, cbk) {
			return $http.post('/api/analyze', {url: url}).then(cbk);
	}
	
}]);