'use strict';
angular.module('service', [])
.service('vacApi', ['$http',
    function ($http) {
        return {
            /**
             * 添加                : POST
             * 查看                : GET
             * 修改(信息/转码参数)  : PUT
             * 删除                : DELETE
             * 刷新/启用/禁用       : PUT
             */
            data: function (queryString, config, callback) {
                var http = {
                    url: becHttpApi + 'data' + queryString,
                    method: config.method
                };
                config.data && (http.data = config.data);
                config.url && (http.url += config.url);
                $http(http).success(callback);
            }
        }
    }
])
.service('httpApiCancel', function ($q) {
    return {
        canceler: $q.defer(),
        cancel_request: function ($q) {
            var self = this;
            self.canceler.resolve();
            self.canceler = $q.defer();
        }
    }
})
.service('datepicker', function () {
    return {
        init_date: function($scope) {
            $scope.status = {
                start_opened: false,
                end_opened: false
            };
            $scope.format = 'yyyy/MM/dd';
            $scope.dateOptions = {
                dateDisabled: disabled,
                formatYear: 'yy',
                startingDay: 1,
                showWeeks: false
            };
            // start dt, 今天0点
            $scope.start_dt = get_today_date_objs();
            // end dt, 当天时间
            $scope.end_dt = new Date(Date.now());
            // Disable weekend selection
            function disabled(data) {
                var date = data.date,
                    mode = data.mode;
                if ($scope.status.start_opened) {
                    // return mode === 'day' && (date < new Date(get_current_day_time_zero_stamp() - 86400000 * 30 * 6)
                    //     || date >= new Date($scope.end_dt.getTime() + 86400000));
                } else {
                    // return mode === 'day' && (date <= new Date(get_appoint_day_time_zero($scope.start_dt)));
                }
            }
            $scope.open_datepicker = function(sign) {
                (sign == 'start') ? $scope.status.start_opened = true : $scope.status.end_opened = true;
            };
        },
        log_date: function($scope) {
            $scope.status = {
                start_opened: false,
                end_opened: false
            };
            $scope.format = 'yyyy/MM/dd';
            $scope.dateOptions = {
                dateDisabled: disabled,
                formatYear: 'yy',
                startingDay: 1,
                showWeeks: false
            };
            $scope.start_dt = get_today_date_objs();
            $scope.end_dt = new Date(Date.now());
            function disabled(data) {
                var date = data.date,
                    mode = data.mode;
            }
            $scope.open_datepicker = function(sign) {
                (sign == 'start') ? $scope.status.start_opened = true : $scope.status.end_opened = true;
            };
        }
    }
})
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
})
//vac_check
.service('vac_check', function (growl) {
    return {
        //id: 判断条件不同，需手动传入
        init_check: function ($scope, array, id) {
            $scope.checkboxes = {
                checked: false,
                items: []
            };
            //多选
            $scope.item_check = function () {
                $scope.checkboxes.items = [];
                var check = 0, total = array.length;
                angular.forEach(array, function (data) {
                    if (data.check) {
                        $scope.checkboxes.items.push(data[id]);
                        check++;
                    }
                });
                $scope.checkboxes.checked = (check == total);
            };

            //全选
            $scope.check_all = function () {
                $scope.checkboxes.items = [];
                if ($scope.checkboxes.checked) {
                    angular.forEach(array, function (data) {
                        data.check = true;
                        $scope.checkboxes.items.push(data[id]);
                    });
                } else {
                    angular.forEach(array, function (data) {
                        data.check = false;
                    });
                }
            };
        },
        //带状态多选/单选操作
        batch_status: function (obj, callback) {
            var data = {};
            if (!obj.id) {
                if (!obj.$scope.checkboxes.items.length) {
                    growl.addErrorMessage("请至少选择一条数据", {ttl: promptTime.error});
                    return false;
                }
                for (var i = 0; i < objs.array.length; i++) {
                    var item = obj.array[i];
                    if ((_.indexOf(obj.$scope.checkboxes.items, item.id) >= 0) && (item.status == objs.status)) {
                        obj.$scope.checkboxes.items = _.without(obj.$scope.checkboxes.items, item.id);
                    }
                }
                data.status = obj.status;
                data[obj.data_param] = obj.$scope.checkboxes.items;
            } else {
                data.status = (objs.status == 1) ? 0 : 1;
                data[obj.data_param] = [obj.id];
            }
            if (!data[obj.data_param].length) {
                growl.addErrorMessage("您选择的数据有误", {ttl: promptTime.error});
                obj.$scope.checkboxes.checked = false;
                obj.$scope.checkboxes.items = [];
                angular.forEach(obj.array, function (data) {
                    data.check = false;
                });
                return false;
            }
            callback(data);
        },
        //无状态单选操作
        batch_operation: function (obj, callback) {
            var data = {};
            if (!obj.id) {
                if (!obj.$scope.checkboxes.items.length) {
                    growl.addErrorMessage("请至少选择一条数据", {ttl: promptTime.error});
                    return false;
                }
                data[obj.data_param] = obj.$scope.checkboxes.items;
            } else {
                data[obj.data_param] = [obj.id];
            }
            callback(data);
        }
    }
})
.provider('httpError', [function () {
    this.$get = ['$rootScope', 'growl', function ($rootScope, growl) {
        return {
            httpErrorHandler: function (meta, status) {
                $rootScope.$broadcast('httpOnError', meta, status);
            },
            /*
             event: obj // angularjs http event obj
             code: number
             // 如果http请求不正确，那么只有status值，没有code值，code值为null
             // 如果请求正确，但服务器返回错误，那么status为200，code值
             status: number // http response or request status，例如200, 401
             **/
            onResponseError: function ($scope, callback) {
                $scope.$on('httpOnError', function (event, error, status) {
                    if (status === Errors.unauthorized) {
                        window.location.href = ums_root_url + login_api;
                        return;
                    }
                    growl.addErrorMessage('【' + error["code"] + '】:' + error["msg"], {ttl: promptTime.error});
                    callback && callback();
                });
            }
        };
    }];
}])
// intercept http error
.factory('MHttpInterceptor', ['$q', 'httpError', '$log', function ($q, httpError, $log) {
    // register the interceptor as a service
    // @see: https://code.angularjs.org/1.2.0-rc.3/docs/api/ng.$http
    // @remark: the function($q) should never add other params.
    return {
        request: function (config) {
            return config || $q.when(config);
        },
        requestError: function (rejection) {
            return $q.reject(rejection);
        },
        /*
         response: {
         config: obj
         data: {
         code: 400, // http response code
         data: obj // http response data
         },
         headers:  function,
         status: 200, // http response status
         statusText: "OK"
         }
         **/
        response: function (response) {
            if (response.data.error && response.data.error.code !== Errors.success) {
                httpError.httpErrorHandler(response.data.error, response.status);
                return $q.reject(response.data.error.code);
            }
            return response || $q.when(response);
        },
        /*
         rejection: {
         data: string, // http response data
         status: 401, // http response status
         config: obj,
         headers:  function,
         statusText: "Unauthorized"
         }
         **/
        responseError: function (rejection) {
            httpError.httpErrorHandler(null, rejection.status);
            return $q.reject(rejection.status);
        }
    };
}])
.config(['$httpProvider', function ($httpProvider) {
    $httpProvider.interceptors.push('MHttpInterceptor')
}]);