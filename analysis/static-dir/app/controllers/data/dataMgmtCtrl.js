'use strict';
// 历史数据
vac.controller('dataMgmtCtrl', ['$scope', '$uibModal', 'datepicker', 'vacApi', 'growl', '$filter', '$interval', 'httpError', 'limit_change', 'vac_check',
    function ($scope, $uibModal, datepicker, vacApi, growl, $filter, $interval, httpError, limit_change, vac_check) {
        datepicker.log_date($scope);
        $scope.actual_diff = {
            start: 0,
            end: 0
        };
        $scope.buy_option = 'not_empty';

        var analysis_source = function () {
            $scope.result = {
                total: $scope.sources.length,
                win: 0,
                lose: 0,
                idiot: 0,
                invalid: 0,
                error: 0,
                boss_win_money: 0,
                boss_lose_money: 0
            };

            for (var i = 0; i < $scope.sources.length; i ++) {
                var s = $scope.sources[i];
                if (s.set_master == 0 || s.set_master == 0) {
                    $scope.result.invalid += 1;
                    continue
                }
                if (s.account_value == 0 || s.last_account_value == 0) {
                    $scope.result.error += 1;
                    continue
                }
                if (s.state == -1) {
                    $scope.result.lose += 1;
                    $scope.result.boss_lose_money += Math.abs(s.actual_diff)
                } else if (s.state == 1) {
                    $scope.result.win += 1;
                    $scope.result.boss_win_money += Math.abs(s.actual_diff)
                } else {
                    $scope.result.idiot += 1;
                }
            }
        };
        var get_data = function () {
            var query = "?start_time=" + parseInt(Number($scope.start_dt) / 1000) + "&end_time=" + parseInt(Number($scope.end_dt) / 1000);
            if ($scope.actual_diff.start != 0 || $scope.actual_diff.end != 0) {
                query += "&actual_diff_start=" + $scope.actual_diff.start + "&actual_diff_end=" + $scope.actual_diff.end;
            }
            if ($scope.buy_option.length > 0) {
                query += "&buy_option=" + $scope.buy_option;
            }
            vacApi.data("" + query, {method: 'GET'}, function (res) {
                $scope.sources = res.data;
                analysis_source();

                var chart_info = {};
                chart_info.title = "账户余额";
                chart_info.unit = ["RMB"];
                chart_info.data_type = ["account_value"];
                chart_info.mark_point = "余额峰值";
                chart_info.legends = ["当前余额"];

                var chart_option = {};
                var option_data = transform_data_to_line_samples($scope.sources, chart_info);
                chart_option.option = echart_set_common_line_data(option_data);
                chart_option.container = document.getElementById('echart_bd_account');

                chart_info.title = "下注额庄闲差值";
                chart_info.unit = ["RMB"];
                chart_info.data_type = ["set_diff", "actual_diff"];
                chart_info.mark_point = "差值峰值";
                chart_info.legends = ["下注时差值", "最终差值"];

                var chart_option2 = {};
                var option_data2 = transform_data_to_line_samples($scope.sources, chart_info);
                chart_option2.option = echart_set_common_line_data(option_data2);
                chart_option2.container = document.getElementById('echart_bd_diff');

                chart_info.title = "状态";
                chart_info.unit = ["win"];
                chart_info.data_type = ["state"];
                chart_info.mark_point = "win";
                chart_info.legends = ["win"];

                var chart_option3 = {};
                var option_data3 = transform_data_to_line_samples($scope.sources, chart_info);
                chart_option3.option = echart_set_common_line_data(option_data3);
                chart_option3.container = document.getElementById('echart_bd_state');

                RenderCharts([chart_option, chart_option2, chart_option3])
            })
        };
        
        $scope.Search = function() {
            get_data();
        };
        
        $scope.clear = function () {
            $uibModal.open({
                animation: true,
                templateUrl: 'views/modal/clear.html',
                controller: 'clearCtrl',
                backdrop: 'static',
                size: 'w380',
                resolve: {
                }
            }).result.then(function() {
                get_data();
            });
        };

        get_data();
    }
]);

// 清理异常数据
vac.controller('clearCtrl', ['$scope', '$uibModalInstance', 'vacApi', 'growl',
    function ($scope, $uibModalInstance, vacApi, growl) {
        $scope.max_actual_diff = 50000000;
        $scope.ok = function() {
            vacApi.data("/clear?max_actual_diff=" + $scope.max_actual_diff, {method:'PUT'}, function(res) {
                var count = res.data.count;
                growl.addSuccessMessage("清理数据成功,count=" + count,{ttl: promptTime.success});
                $uibModalInstance.close();
            })
        };
        $scope.cancel = function() {
            $uibModalInstance.dismiss('cancel');
        };
    }
]);