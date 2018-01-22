'use strict';
// 首页
vac.controller('mainCtrl', ['$scope', 'httpError', '$http', '$state',
    function ($scope, httpError, $http, $state) {
        httpError.onResponseError($scope); // global error response
        $scope.goLink = function (url) {
            $state.go(url);
        };
    }
]);

vac.controller('confirmModalCtrl', ['$scope', 'modal_info', '$uibModalInstance', function($scope, modal_info, $uibModalInstance) {
    $scope.modal_info = modal_info;
    //url = modal_info.output;
    $scope.ok = function () {
        $uibModalInstance.close();
    };
    $scope.cancel = function () {
        $uibModalInstance.dismiss('cancel');
    };
}]);