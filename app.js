angular.module('myApp', [])
	
.factory('tetrisKeyMap', function() {
	return {
		37: 'moveLeft',    // 37 - left
		39: 'moveRight',   // 39 - right
		40: 'moveDown',    // 40 - down
		38: 'rotate',      // 38 - up
		17: 'togglePause', // 17 - control
		32: 'rotate'       // 32 - space
	};
})

.factory('tetris', ['tetrisKeyMap', function(tetrisKeyMap) {
	var tetrisInstance = new Tetris({
		width: 10,
		height: 20,
		speed: 1
	});

	document.addEventListener("keydown", function(e){
		if (tetrisKeyMap && tetrisKeyMap[e.keyCode]){
			tetrisInstance[ tetrisKeyMap[e.keyCode] ]();
		}
	});

	return tetrisInstance;
}])

.directive('gameField', ['tetris', function(tetris){
	return {
		scope: {},
		replace: true,
		restrict: 'A',
		template: '<div class="game">'+
			'<div class="score">Game Speed: {{speed}}. Best score: {{bestScore}}. Your score: <span class="player-score">{{score}}</span></div>'+
			'<div class="field">'+
				'<div ng-repeat="row in fieldArray track by $index" class="row">'+
					'<div ng-repeat="cell in row track by $index" ng-class="cell ? \'active\' : \'\'" class="cell"> </div>'+
				'</div>'+
			'</div>'+
		'</div>',

		controller: function($scope){
			var 
				localStorageId = 'bestScore'
			;

			tetris.onRefresh(function(score, speed){
				var 
					bestScore = parseInt(localStorage.getItem(localStorageId) || 0)
				;

				$scope.bestScore = Math.max(bestScore, score);

				localStorage.setItem(localStorageId, $scope.bestScore);

				$scope.score = score;
				$scope.speed = speed;
				$scope.$apply();
			});

			$scope.bestScore = parseInt(localStorage.getItem(localStorageId) || 0);
			$scope.score = 0;
			$scope.speed = 0;
			$scope.fieldArray = tetris.field;
		}
	};

}]);
