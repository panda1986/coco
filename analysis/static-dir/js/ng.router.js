var mgmtApp = angular.module('mgmtApp', ['ngRoute', 'mgmtControllers', 'mgmtServices', 'mgmtFilters', 'mgmtDirectives']);
var mgmtControllers = angular.module('mgmtControllers', ['ui.bootstrap']);
// the filters, for system to regenerate data.
var mgmtFilters = angular.module('mgmtFilters', []);
// the services, system model, RESTful data from backend api.
var mgmtServices = angular.module('mgmtServices', ['ngResource']);
var mgmtDirectives = angular.module('mgmtDirectives', []);

var echarts;

// config the http interceptor.
mgmtApp.config(['$httpProvider', function($httpProvider){
    $httpProvider.interceptors.push('MHttpInterceptor');
}]);

function LogController($scope) {
    $scope.alert_message_error = "";
    $scope.alert_info_message = "";
    $scope.alert_warn_message = "";

    $scope.on_close_alert_error = function() {
        $scope.alert_error_message = "";
    };
    $scope.on_close_alert_info = function() {
        $scope.alert_info_message = "";
    };
    $scope.on_close_alert_warn = function() {
        $scope.alert_warn_message = "";
    };

    $scope.log_info = function(msg) {
        $scope.alert_info_message = "[" + GLOBAL_LOG_START + "]: [INFO]" + msg;
        GLOBAL_LOG_START ++;
    }
    $scope.log_warn = function(msg) {
        $scope.alert_warn_message = "[" + GLOBAL_LOG_START + "]: [WARN]" + msg;
        GLOBAL_LOG_START ++;
    }
    $scope.log_error = function(msg) {
        $scope.alert_error_message = "[" + GLOBAL_LOG_START + "]: [ERROR]" + msg;
        GLOBAL_LOG_START ++;
    }
}

// config the route
mgmtApp.config(['$routeProvider', function($routeProvider) {
    $routeProvider
        .when(links.analysis.mount, {
            templateUrl: links.analysis.page, controller: links.analysis.controller
        })
        .when(analysis_links.bandwidth.mount, {
            templateUrl: analysis_links.bandwidth.page, controller: analysis_links.bandwidth.controller
        })
        .otherwise({
            redirectTo: links.analysis.mount
        });
}])
    .controller('CMain', ['$scope', 'mgmt_utility', function($scope, mgmt_utility) {
        // the navigator bind and update.
        $scope.navs = {
            analysis: {mount: links.analysis.mount, url: links.analysis.link, text: links.analysis.text, icon: links.analysis.icon, target:"_self"}
        };

        $scope.nav_active_analysis = function() {
            $scope.__nav_active = $scope.navs.analysis;
        };
        $scope.is_nav_selected = function(nav_or_navs) {
            if ($scope.__nav_active == nav_or_navs) {
                return true;
            }
            return false;
        };
        $scope.select_nav = function(nav_or_navs) {
            $scope.__nav_active = nav_or_navs;
        };
        $scope.nav_active_analysis();

        LogController($scope);

        require.config({
            paths: {
                echarts: 'js/vendor/echart' // echart.js的路径
            }
        });
        mgmt_utility.on_response_error($scope);
    }]);

function AnalysisController($scope, get_visit_type) {
    $scope.navs = analysis_links;
    $scope.is_nav_selected = function(nav) {
        if (nav.text == get_visit_type().text) {
            return true;
        }
        return false;
    };
};

function DateController($scope) {
    $scope.date = {};
    $scope.date.date_tab = 1;
    $scope.date.to_date = get_today_date_objs();
    $scope.date.from_date = get_before_days_date_objs(0);
    $scope.is_date_set = function(tabValue){
        return $scope.date.date_tab === tabValue;
    };
    $scope.get_day_data = function (tab_value, date_diff_from_today) {
        $scope.date.date_tab = tab_value;
        $scope.date.from_date = get_before_days_date_objs(date_diff_from_today);
        $scope.date.to_date = get_today_date_objs();
        $scope.get_date_data();
    };
    $scope.get_select_date_data = function(tab_value) {
        $scope.date.date_tab = tab_value;
        $scope.date.from_date.ts = Math.round(($scope.date.from_date.value).getTime() / 1000);
        $scope.date.to_date.ts = Math.round(($scope.date.to_date.value).getTime() / 1000);
        $scope.get_date_data();
    };
    $scope.get_tab_days = function() {
        if ($scope.date.date_tab == 2) {
            return 3;
        }
        if ($scope.date.date_tab == 3) {
            return 7;
        }
        if ($scope.date.date_tab == 4) {
            return 30;
        }
        return 1;
    }
}

// controller: CAnalysisBandwidth
mgmtControllers.controller('CAnalysisBandwidth', ['$scope', '$resource', 'MHistoryData', 'limit_change', '$uibModal',function($scope, $resource, MHistoryData, limit_change, $uibModal){
    DateController($scope);

    $scope.get_date_data = function() {
        MHistoryData.data_get({start_time: $scope.date.from_date.ts, end_time: $scope.date.to_date.ts}, function (ret) {
            $scope.sources = ret.data;
            $scope.set_echart_data();
        });
    };

    $scope.set_echart_data = function() {
        // draw echart
        var chart_info = {};
        chart_info.title = "数据统计";
        chart_info.unit = ["RMB"];
        chart_info.mark_point = "账户余额峰值";
        chart_info.legends = ["set_master", "set_slave", "actual_master", "actual_slave", "account_value"];
        var chart_option2 = {};
        var option_data = transform_data_to_slave_line_samples($scope.sources, chart_info);
        chart_option2.option = echart_set_line_option_data(option_data);
        chart_option2.container = document.getElementById('echart_bd_clients');
        RenderCharts([chart_option2]);
    };

    $scope.get_date_data();
    
}]);

//default search and default sort
mgmtApp.service("userData", function () {
    return {
        table_filter: {},
        table_sort: {},
        page_count: 5,
        current_page: 1
    }
});

// controller: ConfirmCtrl
mgmtControllers.controller('ConfirmCtrl', ['$scope', '$uibModalInstance', 'title', 'context',
    function($scope, $uibModalInstance, title, context){
        $scope.title = title;
        $scope.context = context;
        $scope.confirm = function () {
            $uibModalInstance.close();
        };

        $scope.cancel = function () {
            $uibModalInstance.dismiss('cancel');
        };
    }
]);

// config the filter
// the filter for the bandwidth page.
mgmtFilters
    .filter('main_nav_active', function() {
        return function(is_active) {
            return is_active? "active": null;
        };
    })
    .filter('date_button_active', function() {
        return function(is_active) {
            return is_active? "btn btn-primary": "btn btn-default";
        };
    })
    .filter('date_button_active_xs', function() {
        return function(is_active) {
            return is_active? "btn btn-primary btn-xs": "btn btn-default btn-xs";
        };
    })
    .filter('float_filter', function(){
        return function(value) {
            if (!value && value != 0) {
                return "未知";
            }
            return value.toFixed(1);
        }
    })
    .filter('contact_to_date', function(){
        return function(value) {
            var time_now = new Date().getTime() / 1000;
            return absolute_seconds_to_YYYYmmdd_hhmm(time_now - value);
        };
    })
    .filter('data_nodes_class', function(){
        return function(node) {
            if (!node) {
                return SHOW_LEVEL_WARN_CLASS;
            }
            var used_percent = 0.0;
            if (node.used > 0) {
                used_percent = node.used / (node.remaining + node.used) * 100;
            }
            if (used_percent < SHOW_LEVEL_DISK_WARN) {
                return "";
            } else if (used_percent < SHOW_LEVEL_DISK_ERROR) {
                return SHOW_LEVEL_WARN_CLASS;
            } else {
                return SHOW_LEVEL_ERROR_CLASS;
            }
        };
    })
    .filter('object_length', function(){
        return function(obj) {
            if (!obj) {
                return 0;
            }
            return Object.size(obj);
        };
    })
    .filter('ms_date', function(){
        return function(ms) {
            return absolute_seconds_to_YYYYmmdd_hhmm(ms);
        };
    })
    .filter('ts_to_date', function(){
        return function(second) {
            return absolute_seconds_to_YYYYmmdd_hhmmss(second);
        };
    })
    .filter('log_name', function(){
        return function(name) {
            var ss = name.split("-", 2);
            if (ss.length == 2) {
                return ss[1];
            } else {
                return name;
            }
        };
    })
    .filter('auto_fold_class', function(){
        return function(value) {
            if (value) {
                return "glyphicon glyphicon-triangle-bottom";
            } else {
                return "glyphicon glyphicon-triangle-top";
            }
        };
    })
    .filter('servers_enabled_text', function(){
        return function(enabled) {
            if (!enabled) {
                return "启用服务器"
            } else {
                return "禁用服务器"
            }
        };
    })
    .filter('get_hms', function(){
        return function(seconds) {
            if (!seconds) {
                return "未知";
            }
            return absolute_seconds_to_HHMMSS(seconds);
        };
    })
    .filter('get_tracker_dump', function(){
        return function(obj) {
            if (!obj) {
                return "";
            }
            return tracker_plugin_pid_dump(obj);
        };
    })
    .filter('to_trusted', ['$sce', function($sce){
        return function(text) {
            return $sce.trustAsHtml(text);
        };
    }]);

mgmtServices
    .factory('MHistoryData', ['$resource', function($resource){
        return $resource('/api/v1.0/data', {}, {
            data_get: {method: 'GET'}
        });
    }]);

mgmtServices.provider('mgmt_utility', [function() {
    this.$get = ['$rootScope', function($rootScope) {
        return {
            http_error_handler: function(code, status) {
                $rootScope.$broadcast('mgmt_on_error', code, status);
            },
            /*
             event: obj // angularjs http event obj
             code: number
             // 如果http请求不正确，那么只有status值，没有code值，code值为null
             // 如果请求正确，但服务器返回错误，那么status为200，code值
             status: number // http response or request status，例如200, 401
             **/
            on_response_error: function($scope) {
                $scope.$on('mgmt_on_error', function(event, code, status) {
                    if (!code) {
                        if (status == Errors.UINotFound) {
                            var message = "[" + status + "] 访问的资源不存在";
                            $scope.log_error(message);
                        }
                        return;
                    }

                    // TODO: 依据后端生成的错误码对照js文件，打印对应的错误信息
                    var message = "[" + code + "] API返回错误";
                    $scope.log_error(message);
                });
            }
        };
    }];
}]);

mgmtServices.factory('MHttpInterceptor', ['$q', 'mgmt_utility', function($q, mgmt_utility){
    // register the interceptor as a service
    // @see: https://code.angularjs.org/1.2.0-rc.3/docs/api/ng.$http
    // @remark: the function($q) should never add other params.
    return {
        'request': function(config) {
            return config || $q.when(config);
        },
        'requestError': function(rejection) {
            return $q.reject(rejection);
        },
        'response': function(response) {
            if (response.data.code && response.data.code != Errors.Success) {
                mgmt_utility.http_error_handler(response.data.code, response.status);
                // the $q.reject, will cause the error function of controller.
                // @see: https://code.angularjs.org/1.2.0-rc.3/docs/api/ng.$q
                return $q.reject(response.data.code);
            }
            return response || $q.when(response);
        },
        'responseError': function(rejection) {
            mgmt_utility.http_error_handler(null, rejection.status);
            return $q.reject(rejection.status);
        }
    };
}]);

mgmtServices
// 分页配置项初始化
    .service('limit_change', function() {
        return {
            init: function($scope, callback) {
                $scope.bigCurrentPage = 1;
                $scope.maxSize = 5;
                $scope.page_counts = [
                    {num: 10, selected: true},
                    {num: 50, selected: false},
                    {num: 100, selected: false}
                ];
                for (var k in $scope.page_counts) {
                    if ($scope.page_counts[k].selected) {
                        $scope.itemsPerPage = $scope.page_counts[k].num;
                        break;
                    }
                }
                $scope.changePageNum = function(num, order) {
                    if (num != $scope.itemsPerPage) {
                        angular.forEach($scope.page_counts, function(data, index) {
                            data.selected = (order == index);
                        });
                        $scope.itemsPerPage = num;
                        $scope.bigCurrentPage = 1;
                        callback()
                    }
                };
            }
        }
    });