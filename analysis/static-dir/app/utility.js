'use strict';
var autoRefresh;

var refresh = {
    interval: 5000,
    is_spinner: true
};

var becHttpApi = '/api/v1.0/';

var promptTime = {
    success: 3000,
    error: 5000
};

var Errors = {
    success: 0,
    unauthorized: 401,
    notAllowed: 403,
    notFound: 404,
    interfaceUrlError: 500
};
var hls_url;

/**
 * 获取当天零点时间戳
 * for example, (2014-01-08 10:01:20 GMT+0800) formated to 1389110400
 */
function getCurrentTimeZeroStamp () {
    return new Date().setHours(0, 0, 0, 0);
}

/**
 * padding the output.
 * padding(3, 5, '0') is 00003
 * padding(3, 5, 'x') is xxxx3
 * @see http://blog.csdn.net/win_lin/article/details/12065413
 */
function padding (number, length, prefix) {
    if (String(number).length >= length) {
        return String(number);
    }
    return padding(prefix + number, length, prefix);
}

function get_token () {
    var current_href, token;
    current_href = window.location.href;
    if (current_href.indexOf('token=') < 0) {
        //window.location.href = ums_root_url + login_api;
        return '';
    }
    token = current_href.split('token=')[1];
    if (token.indexOf('#/bec')) {
        token = token.split('#/bec')[0];
    }
    return token;
}

function network_human_readable (network) {
    var kb = parseInt(network / 1024);
    var mb = parseInt(network / 1024 / 1024);
    var gb = network / 1024 / 1024 / 1024;
    var tb = network / 1024 / 1024 / 1024 / 1024;

    // sometimes, mb/gb is 0, but tb is not 0.
    if (kb > 0) {
        if (mb > 0) {
            if (gb > 1) {
                if (tb > 1) {
                    return tb.toFixed(2) + 'T';
                }
                return gb.toFixed(1) + 'G';
            }
            return mb + 'M';
        }
        return kb + 'K'
    }
    return network;
}

function absolute_seconds_to_YYYYmmdd_hhmm(seconds) {
    var date = new Date();
    date.setTime(Number(seconds) * 1000);

    var ret = date.getFullYear()
        + "-" + padding(date.getMonth() + 1, 2, '0')
        + "-" + padding(date.getDate(), 2, '0')
        + " " + padding(date.getHours(), 2, '0')
        + ":" + padding(date.getMinutes(), 2, '0');

    return ret;
}

function absolute_seconds_to_YYYYmmdd_hhmmss(seconds) {
    var date = new Date();
    date.setTime(Number(seconds) * 1000);

    var ret = date.getFullYear()
        + "-" + padding(date.getMonth() + 1, 2, '0')
        + "-" + padding(date.getDate(), 2, '0')
        + " " + padding(date.getHours(), 2, '0')
        + ":" + padding(date.getMinutes(), 2, '0')
        + ":" + padding(date.getSeconds(), 2, '0');

    return ret;
}

function AsyncRefresh2() {
    this.on_before_call_pfn = null;

    // use a anonymous function to call, and check the enabled when actually invoke.
    this.__call = {
        pfn: null,
        timeout: 0,
        __enabled: false,
        __handler: null
    };
}
// singleton
var async_refresh2 = new AsyncRefresh2();
/**
 * initialize or refresh change. cancel previous request, setup new request.
 * @param pfn a function():void to request after timeout. null to disable refresher.
 * @param timeout the timeout in ms, to call pfn. null to disable refresher.
 */
AsyncRefresh2.prototype.initialize = function(pfn, timeout) {
    this.refresh_change(pfn, timeout);
};
/**
 * stop refresh, the refresh pfn is set to null.
 */
AsyncRefresh2.prototype.stop = function() {
    this.__call.__enabled = false;
};
/**
 * restart refresh, use previous config.
 */
AsyncRefresh2.prototype.restart = function() {
    this.__call.__enabled = true;
    this.request(0);
};
/**
 * change refresh pfn, the old pfn will set to disabled.
 */
AsyncRefresh2.prototype.refresh_change = function(pfn, timeout) {
    // cancel the previous call.
    if (this.__call.__handler) {
        clearTimeout(this.__handler);
    }
    this.__call.__enabled = false;

    // setup new call.
    this.__call = {
        pfn: pfn,
        timeout: timeout,
        __enabled: true,
        __handler: null
    };
};
/**
 * start new request, we never auto start the request,
 * user must start new request when previous completed.
 * @param timeout [optional] if not specified, use the timeout in initialize or refresh_change.
 */
AsyncRefresh2.prototype.request = function(timeout) {
    var self = this;
    var this_call = this.__call;

    // clear previous timeout.
    if (this_call.__handler) {
        clearTimeout(this_call.__handler);
    }

    // override the timeout
    if (timeout == undefined) {
        timeout = this_call.timeout;
    }

    // if user disabled refresher.
    if (this_call.pfn == null || timeout == null) {
        return;
    }

    this_call.__handler = setTimeout(function(){
        // cancelled by refresh_change, ignore.
        if (!this_call.__enabled) {
            return;
        }

        // callback if the handler installled.
        if (self.on_before_call_pfn) {
            if (!self.on_before_call_pfn()) {
                return;
            }
        }

        // do the actual call.
        this_call.pfn();
    }, timeout);
};

var echart_set_common_line_data = function (chart) {
    var option = {
        title: {
            text: chart.title
        },
        legend: {                           //图例配置
            padding: 5,                             //图例内边距，单位px，默认上下左右内边距为5
            itemGap: 10,                            //Legend各个item之间的间隔，横向布局时为水平间隔，纵向布局时为纵向间隔
            data: chart.legend_data    //各个图例
        },
        tooltip: {                          //气泡提示配置
            trigger: 'axis'                        //触发类型，默认数据触发，可选为：'axis'
        },
        toolbox: {
            show : true,
            feature : {
                dataZoom : {show: true},
                dataView : {show: true, readOnly: true},
                magicType : {show: true, type: ['stack']},
                restore : {show: true},
                saveAsImage : {show: true}
            }
        },
        grid: {
            x: 80,
            y: 60,
            x2: 40,
            y2: 60
        },
        dataZoom: {
            show : true,
            realtime : true,
            start : 0,
            end : 100
        },
        xAxis: [                             //直角坐标系中横轴数组
            {
                type: 'category',                   //坐标轴类型，横轴默认为类目轴，数值轴则参考xAxis说明
                boundaryGap : false,
                data: chart.x_data,     //x轴坐标值
                scale: true
            }
        ],
        yAxis: [
            {
                type: 'value',                      //左侧 坐标轴类型，纵轴默认为数值轴，类目轴则参考yAxis说明
                name: chart.value_dest_unit[0],
                axisLabel : {
                    formatter: '{value} '
                }
            }
        ],
        series: []
    };
    for(var i = 0; i < chart.samples_series.length; i ++){
        var serie = chart.samples_series[i];
        var option_serie = {
            name: serie.name,
            type: 'line',
            yAxisIndex: serie.yaxis_index,
            itemStyle: {normal: {areaStyle: {type: 'default'}}},
            data:serie.samples
        };
        if (serie.markPoint) {
            option_serie.markPoint = {
                data : [
                    {type : 'max', name: serie.markPoint.name}
                ]
            }
        }
        option.series.push(option_serie);
    }
    return option;
};

var transform_data_to_line_samples = function (data, property) {
    var multi_dimensional_samples = {
        title: property.title,
        value_dest_unit: property.unit,                                                  //原始数据单位
        x_data: [],                                                                       //x 轴坐标
        samples_series: [],                                                               //采样数据列表
        legend_data: [],                                                   //图例
        value_magnification: 1                                                         //单位倍率
    };

    if (property.magnification) {
        multi_dimensional_samples.value_magnification = property.magnification;
    }

    var series = multi_dimensional_samples.samples_series;
    for (var i = 0; i < property.data_type.length; i++) {
        var d_type = property.data_type[i];
        multi_dimensional_samples.legend_data.push(d_type);
        var serire = {name: d_type, yaxis_index: 0, samples: [], markPoint:{name: d_type + "峰值"}};
        series.push(serire);
    }

    for (var i = 0; i < data.length; i++) {
        var item = data[i];
        multi_dimensional_samples.x_data.push(absolute_seconds_to_YYYYmmdd_hhmm(item["create_time"]));
        for (var j = 0; j < property.data_type.length; j++) {
            var value = item[property.data_type[j]] / multi_dimensional_samples.value_magnification;
            series[j].samples.push(parseFloat(value.toFixed(1)));
        }
    }
    return multi_dimensional_samples;
};

var RenderCharts =function(options) {
    require(
        [
            'echarts',
            'echarts/chart/line',
            'echarts/chart/pie',
            'echarts/chart/map'
        ],
        function (ec) {
            echarts = ec;
            var length = options.length;
            for (var i = 0; i < length; i++) {
                var option = options[i];
                if (option.chart && option.chart.dispose) {
                    option.chart.dispose();
                }
                option.chart = echarts.init(option.container, e_macarons);
                option.chart.setOption(option.option, true);
            }

            if (length > 1) {
                for (var i = 0; i < length; i++) {
                    var option = options[i];
                    var connects = [];
                    for (var j = 0; j < length; j++) {
                        if (i == j) {
                            continue;
                        }
                        connects.push(options[j].chart);
                    }
                    option.chart.connect(connects);
                }
            }
        }
    );
};

function get_today_date_objs() {
    var date = new Date();
    date.setHours(0);
    date.setMinutes(0);
    date.setSeconds(0);
    date.setMilliseconds(0);
    return date;
}

function number_format(number, decimals, dec_point, thousands_sep) {
    /*
     * 参数说明：
     * number：要格式化的数字
     * decimals：保留几位小数
     * dec_point：小数点符号
     * thousands_sep：千分位符号
     * */
    number = (number + '').replace(/[^0-9+-Ee.]/g, '');
    var n = !isFinite(+number) ? 0 : +number,

        prec = !isFinite(+decimals) ? 0 : Math.abs(decimals),
        sep = (typeof thousands_sep === 'undefined') ? ',' : thousands_sep,
        dec = (typeof dec_point === 'undefined') ? '.' : dec_point,
        s = '',
        toFixedFix = function (n, prec) {
            var k = Math.pow(10, prec);
            return '' + Math.floor(n * k) / k;
        };
    s = (prec ? toFixedFix(n, prec) : '' + Math.floor(n)).split('.');
    var re = /(-?\d+)(\d{3})/;
    console.log(s)
    while (re.test(s[0])) {
        s[0] = s[0].replace(re, "$1" + sep + "$2");
    }

    if ((s[1] || '').length < prec) {
        s[1] = s[1] || '';
        s[1] += new Array(prec - s[1].length + 1).join('0');
    }
    return s.join(dec);
}