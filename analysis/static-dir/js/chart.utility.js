/**
 * Created by panda on 2015/3/27.
 */

/*
 * transform_data_to_bandwidth_samples
 * 将从server得到的监控数据转换为折线图指令需要的多维数据格式
 */
var transform_data_to_source_samples = function (data, property) {
    var multi_dimensional_samples = {
        title: property.title,
        value_dest_unit: property.unit,                                                  //原始数据单位
        data_zoom_enabled: true,
        show_legend: true,
        show_toolbox: true,
        show_xaxis: true,
        is_main: true,
        value_magnification: 1,                                   //单位倍率
        legend_data: [],          //图例
        x_data: [],                                                                       //x 轴坐标
        samples_series: []                                                                //采样数据列表
    };

    if (property.slaves) {
        multi_dimensional_samples.slaves = property.slaves;
    } else {
        multi_dimensional_samples.slaves = [];
    }

    multi_dimensional_samples.legend_data.push("p2p");
    multi_dimensional_samples.legend_data.push("cdn");
    multi_dimensional_samples.legend_data.push("分享率");
    multi_dimensional_samples.x_data.splice(0, multi_dimensional_samples.x_data.length);//清空数组
    var serire1 = {name: "p2p", yaxis_index: 0, samples: [], markPoint:{name:"P2P峰值带宽"}};
    var serire2 = {name: "cdn", yaxis_index: 0, samples: [], markPoint:{name:"CDN峰值带宽"}};
    var serire3 = {name: "分享率", yaxis_index: 1, samples: [], markPoint:{name:"分享率峰值"}};
    for (var i = 0; i < data.length; i++) {
        var item = data[i];
        multi_dimensional_samples.x_data.push(absolute_seconds_to_YYYYmmdd_hhmm(item["time"]));
        var share_rate = item["p2pb"] + item["cdnb"] == 0 ? 0 : (item["p2pb"] / (item["p2pb"] + item["cdnb"]) * 100).toFixed(2);
        serire1.samples.push(parseFloat((item["p2pb"] / multi_dimensional_samples.value_magnification).toFixed(2)));
        serire2.samples.push(parseFloat((item["cdnb"] / multi_dimensional_samples.value_magnification).toFixed(2)));
        serire3.samples.push(parseFloat(share_rate));
    }
    multi_dimensional_samples.samples_series.push(serire1);
    multi_dimensional_samples.samples_series.push(serire2);
    multi_dimensional_samples.samples_series.push(serire3);

    return multi_dimensional_samples;
};

/*
 * transform_data_to_bandwidth_samples
 * 将从server得到的监控数据转换为折线图指令需要的多维数据格式
 */
var transform_data_to_bandwidth_samples = function (data, property) {
    var multi_dimensional_samples = {
        title: property.title,
        value_dest_unit: property.unit,                                                  //原始数据单位
        data_zoom_enabled: true,
        show_legend: true,
        show_toolbox: true,
        show_xaxis: true,
        is_main: true,
        value_magnification: property.magnification,                                   //单位倍率
        legend_data: [],          //图例
        x_data: [],                                                                       //x 轴坐标
        samples_series: []                                                                //采样数据列表
    };

    if (property.slaves) {
        multi_dimensional_samples.slaves = property.slaves;
    } else {
        multi_dimensional_samples.slaves = [];
    }

    multi_dimensional_samples.legend_data.push("p2p");
    multi_dimensional_samples.legend_data.push("cdn");
    multi_dimensional_samples.legend_data.push("分享率");
    multi_dimensional_samples.x_data.splice(0, multi_dimensional_samples.x_data.length);//清空数组
    var serire1 = {name: "p2p", yaxis_index: 0, samples: [], markPoint:{name:"P2P峰值带宽"}};
    var serire2 = {name: "cdn", yaxis_index: 0, samples: [], markPoint:{name:"CDN峰值带宽"}};
    var serire3 = {name: "分享率", yaxis_index: 1, samples: [], markPoint:{name:"分享率峰值"}};
    for (var i = 0; i < data.length; i++) {
        var item = data[i];
        multi_dimensional_samples.x_data.push(absolute_seconds_to_YYYYmmdd_hhmm(item["time"]));
        var share_rate = item["p2pb"] + item["cdnb"] == 0 ? 0 : (item["p2pb"] / (item["p2pb"] + item["cdnb"]) * 100).toFixed(2);
        serire1.samples.push(parseFloat((item["p2pb"] / multi_dimensional_samples.value_magnification).toFixed(2)));
        serire2.samples.push(parseFloat((item["cdnb"] / multi_dimensional_samples.value_magnification).toFixed(2)));
        serire3.samples.push(parseFloat(share_rate));
    }
    multi_dimensional_samples.samples_series.push(serire1);
    multi_dimensional_samples.samples_series.push(serire2);
    multi_dimensional_samples.samples_series.push(serire3);

    return multi_dimensional_samples;
};

var transform_data_to_slave_line_samples = function (data, property) {
    var multi_dimensional_samples = {
        title: property.title,
        value_dest_unit: property.unit,                                                  //原始数据单位
        x_data: [],                                                                       //x 轴坐标
        samples_series: [],                                                               //采样数据列表
        legend_data: property.legends,                                                   //图例
        data_zoom_enabled: false,
        show_xaxis: true,
        value_magnification: 1,                                                         //单位倍率
        slaves: [],                                                                       // 子级图
        show_legend: false,
        show_toolbox: false
    };

    var serire = {name: property.title, yaxis_index: 0, samples: []};
    for (var i = 0; i < data.length; i++) {
        var item = data[i];
        multi_dimensional_samples.x_data.push(absolute_seconds_to_YYYYmmdd_hhmm(item["time"]));
        serire.samples.push(parseFloat(item[property.data_type]).toFixed(1));
    }
    multi_dimensional_samples.samples_series.push(serire);
    return multi_dimensional_samples;
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
        multi_dimensional_samples.x_data.push(absolute_seconds_to_YYYYmmdd_hhmm(item["time"]));
        for (var j = 0; j < property.data_type.length; j++) {
            var value = item[property.data_type[j]] / multi_dimensional_samples.value_magnification;
            series[j].samples.push(parseFloat(value.toFixed(1)));
        }
    }
    return multi_dimensional_samples;
};

/*
 * transform_data_to_server_samples
 * 将从server得到的监控数据转换为折线图指令需要的多维数据格式
 */
var transform_data_to_pie_samples = function (data, property) {
    var pie_chart_samples = {
        title: property.title,
        samples: []
    };
    for(var item in data) {
        if (data[item].clients> 0) {
            var sample = {y: data[item].clients, x: get_isp_mapping_info(item)};
            pie_chart_samples.samples.push(sample);
        }
    }
    return pie_chart_samples;
};

var transform_data_to_map_samples = function (data, property) {
    var map_dimensional_samples = {
        title: property.title,
        legend: property.title,                      //数据标签
        dataRange_min: 0,                          //值域选择的最小值
        dataRange_max: 0,                          //值域选择的最大值
        mark_item: "",
        samples: [],
        unit: property.unit
    };
    var max_data_range = 0;
    var min_data_range = 0;

    for(var item in data) {
        if (data[item].clients == 0) {
            continue
        }
        var sample = {x: get_area_mapping_info(item), y: data[item].clients};
        if (!max_data_range) {
            max_data_range = data[item].clients;
            map_dimensional_samples.mark_item = get_area_mapping_info(item);
        } else {
            if (data[item].clients > max_data_range) {
                max_data_range = data[item].clients;
                map_dimensional_samples.mark_item = get_area_mapping_info(item);
            }
        }

        if (!min_data_range) {
            min_data_range = data[item].clients;
        } else {
            if (data[item].clients < min_data_range) {
                min_data_range = data[item].clients;
            }
        }
        map_dimensional_samples.samples.push(sample);
    }
    map_dimensional_samples.dataRange_max = max_data_range;
    map_dimensional_samples.dataRange_min = min_data_range;
    return map_dimensional_samples;
};

var echart_set_pie_option_data = function (chart) {
    var option = {
        title : {
            text: chart.title,
            x:'left'
        },
        tooltip : {                          // 气泡提示配置
            trigger: 'item',                        // 触发类型，数据触发
            formatter: "{a} <br/>{b} : {c} ({d}%)"
        },
        toolbox: {
            show: true,
            orient : 'vertical',
            x: 'right',
            y: 'center',
            feature : {
                dataView : {show: true, readOnly: true},
                saveAsImage : {show: true}
            }
        },
        calculable : true,
        series : [
            {
                name: chart.title,
                type: 'pie',
                radius: '55%',
                center: ['50%', '60%'],
                data: []
            }
        ],
        color : [
            '#2ec7c9','#b6a2de','#5ab1ef','#ffb980','#d87a80',
            '#8d98b3','#e5cf0d','#97b552','#95706d','#dc69aa',
            '#07a2a4','#9a7fd1','#588dd5','#f5994e','#c05050',
            '#59678c','#c9ab00','#7eb00a','#6f5553','#c14089'
        ]
    };
    for(var i = 0; i < chart.samples.length; i ++){
        var sample = chart.samples[i];
        option.series[0].data.push({name:sample.x, value:sample.y});
    }
    return option;
};

var echart_set_map_option_data = function (chart) {
    var option = {
        title : {
            text: chart.title,
            x:'left'
        },
        tooltip : {
            trigger: 'item'
        },
        dataRange: {
            min: chart.dataRange_min,
            max: chart.dataRange_max,
            x: 'left',
            y: 'bottom',
            text:[(chart.dataRange_max).toString() + chart.unit, chart.dataRange_min.toString() + chart.unit],
            color: ["#006edd", "#e0ffff"],
            calculable: false
        },
        toolbox: {
            show: true,
            orient : 'vertical',
            x: 'right',
            y: 'center',
            feature : {
                dataView : {show: true, readOnly: true},
                saveAsImage : {show: true}
            }
        },
        series : [
            {
                name: chart.title,
                type: 'map',
                mapType: 'china',
                roam: false,
                itemStyle:{
                    normal:{label:{show:true}},
                    emphasis:{label:{show:true}}
                },
                data:[]
            }
        ]
    };
    for(var i = 0; i < chart.samples.length; i ++){
        var sample = chart.samples[i];
        option.series[0].data.push({name:sample.x, value:sample.y});
    }
    return option;
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

var echart_set_line_option_data = function (dimensional_chart) {
    var option = {
        legend: {
            data: dimensional_chart.legend_data
        },
        tooltip: {
            trigger: 'axis',             // 显示延迟，添加显示延迟可以避免频繁切换，单位ms
            formatter: function (params) {
                var res = params[0].name;
                var len = params.length;
                if (dimensional_chart.slaves) {
                    len = params.length - dimensional_chart.slaves.length;
                }
                for (var i = 0; i < len; i++){
                    if (params[i].value) {
                        res += '<br/>' + params[i].seriesName + ': ' + params[i].value;
                    }
                }
                return res;
            }
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
        dataZoom: {
            show : true,
            realtime: true,
            start : 0,
            end : 100
        },
        grid: {
            x: 80,
            y: 5,
            x2: 60,
            y2: 20
        },
        xAxis : [
            {
                type : 'category',
                boundaryGap : true,
                axisTick: {onGap:false},
                splitLine: {show:false},
                data : dimensional_chart.x_data
            }
        ],
        yAxis : [
            {
                type: 'value',                      //左侧 坐标轴类型，纵轴默认为数值轴，类目轴则参考yAxis说明
                name: dimensional_chart.value_dest_unit[0],
                axisLabel : {
                    formatter: '{value} '
                }
            }
        ],
        series: []
    };
    if (dimensional_chart.is_main) {
        option.grid = {
            x: 80,
            y: 65,
            x2:60,
            y2:60
        };
    }
    if (!dimensional_chart.show_xaxis) {
        option.xAxis[0].axisLabel = {show:false};
    }
    if (!dimensional_chart.data_zoom_enabled) {
        option.dataZoom.y = 290;
    }
    if (!dimensional_chart.show_legend) {
        option.legend.y = -30;
    }
    if (!dimensional_chart.show_toolbox) {
        option.toolbox.y = -30;
    }
    if (dimensional_chart.value_dest_unit.length >= 2) {
        option.yAxis.push(
            {
                type: 'value',                      //右侧 坐标轴类型，纵轴默认为数值轴，类目轴则参考yAxis说明
                name: dimensional_chart.value_dest_unit[1],
                axisLabel : {
                    formatter: '{value} '
                },
                min: 0,
                max: 100
            }
        )
    } else {
        option.yAxis[0].axisLabel.formatter = function (v) {
            return v  +  ' ' +  dimensional_chart.value_dest_unit[0];
        }
    }
    for(var i = 0; i < dimensional_chart.samples_series.length; i ++){
        var serie = dimensional_chart.samples_series[i];
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
    for(var i = 0; i < dimensional_chart.slaves.length; i ++) {
        var item = dimensional_chart.slaves[i];
        option.legend.data.push(item);
        option.series.push({
            name: item,
            type:'line',
            data:[]
        });
    }
    return option;
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
