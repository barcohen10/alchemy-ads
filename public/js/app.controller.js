app.controller('MainCtrl', ['$scope', 'adsService', 

	function ($scope, adsService) {
		$scope.firstAdShown = $scope.showSpinner = $scope.adVisible = false;
		$scope.inputUrl = '';
		$scope.errorMessage = '';
		$scope.selectedAd = {};

		$scope.submitUrl = function() {
			var url = $scope.inputUrl;
			if(!url) {
				return $scope.errorMessage = 'Enter a url';
			}
			
			$scope.showSpinner = true;
			$scope.adVisible = false;

			adsService.analyzeUrl(url, function(result) {
				var status =  result.statusText;
				if(!!result.data.status) {
					status =  result.data.status;
				}

				switch(status) {
					case 'error':
					$scope.errorMessage = "An error has occurred. Please try again.";
					break;
					case 'no_ads':
					$scope.errorMessage = "No ads matching the url provided.";
					break;
					case 'OK':
					showAd(result.data);
					break;
				}
				$scope.showSpinner = false;
			});
	  	}

		  function showAd(ad) {
			  $scope.adVisible =  $scope.firstAdShown =  true;
			  $scope.selectedAd = ad;
			  $scope.errorMessage = '';
		  }
    }

  ]);