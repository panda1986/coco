angular.module('base', ['ui.router', 'ui.bootstrap', 'oc.lazyLoad','angular-growl']);
var echarts;
var vac = angular.module('vac', ['base', 'filter', 'directive', 'service'])
.run(['$rootScope', '$state', '$stateParams', '$interval', '$http',
    function ($rootScope, $state, $stateParams, $interval, $http) {
        var token = get_token();
        // 导航高亮，全局配置$rootScope
        $rootScope.$state = $state;
        $rootScope.$stateParams = $stateParams;
        $rootScope.app = {
            layout: {},
            umsinfo: {}
        };
        $rootScope.ums_root_url = null;
    }
])
.constant('JS_REQUIRES', {
    scripts: {
        dataMgmtCtrl: 'app/controllers/data/dataMgmtCtrl.js'                                    // 任务管理
    },
    // angular module, the name must comply with angular plug-ins name
    modules: []
})
.config(['$stateProvider', '$urlRouterProvider', '$ocLazyLoadProvider', '$controllerProvider', 'JS_REQUIRES',
    function ($stateProvider, $urlRouterProvider, $ocLazyLoadProvider, $controllerProvider, jsRequires) {
        vac.controller = $controllerProvider.register;

        $ocLazyLoadProvider.config({
            debug: false,
            events: true,
            modules: jsRequires.modules
        });

        require.config({
            paths: {
                echarts: 'vendor/echart' // echart.js的路径
            }
        });

        $urlRouterProvider.otherwise('vac/data');

        $stateProvider
            .state('vac', {
            url: '/vac',
            templateUrl: 'views/vac.html',
            resolve: loadSequence(),
            abstract: true
        }) .state('vac.data', {
            title: '任务管理',
            url: '/data',
            templateUrl: 'views/data/dataMgmt.html',
            resolve: loadSequence('dataMgmtCtrl')
        });

        function loadSequence () {
            var _args = arguments;
            return {
                deps: ['$ocLazyLoad', '$q',
                    function ($ocLL, $q) {
                        var promise = $q.when(1);
                        for (var i = 0, len = _args.length; i < len; i++) {
                            promise = promiseThen(_args[i]);
                        }
                        return promise;

                        function promiseThen (_arg) {
                            if (typeof _arg === 'function') {
                                return promise.then(_arg);
                            } else {
                                return promise.then(function () {
                                    var nowLoad = requiredData(_arg);
                                    if (!nowLoad) {
                                        return $.error('Route resolve: Bad resource name [' + _arg + ']');
                                    }
                                    return $ocLL.load(nowLoad);
                                });
                            }
                        }

                        function requiredData (name) {
                            if (jsRequires.modules) {
                                for (var m in jsRequires.modules) {
                                    if (jsRequires.modules[m].name && jsRequires.modules[m].name === name) {
                                        return jsRequires.modules[m];
                                    }
                                }
                            }
                            return jsRequires.scripts && jsRequires.scripts[name];
                        }
                    }
                ]
            };
        }
    }
]);
// 确认对话框
vac.controller('confirmCtrl', ['$scope', '$uibModalInstance', 'title', 'content',
    function ($scope, $uibModalInstance, title, content) {
        $scope.title = title || '';
        $scope.content = content || '';
        $scope.ok = function () {$uibModalInstance.close();};
        $scope.cancel = function () {$uibModalInstance.dismiss('cancel');};
    }
]);