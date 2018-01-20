var finance_realtime_refresh_interval = 15000;
var realtime_sort_number = 10;// enum for warning data
var SHOW_LEVEL_LOAD_WARN = 3;
var SHOW_LEVEL_LOAD_ERROR = 5;
var SHOW_LEVEL_AVAILABLE_WARN = 0.95; // [0, 1], means [0%, 100%]
var SHOW_LEVEL_AVAILABLE_ERROR = 0.80; // [0, 1], means [0%, 100%]
var SHOW_LEVEL_CPU_WARN = 50; // cpu使用率percent
var SHOW_LEVEL_CPU_ERROR = 80;
var SHOW_LEVEL_MEM_WARN = 50; // 内存使用率 percent
var SHOW_LEVEL_MEM_ERROR = 80;
var SHOW_LEVEL_IOUTIL_WARN = 80; // io繁忙度 percent
var SHOW_LEVEL_IOUTIL_ERROR = 100;
var SHOW_LEVEL_DISK_WARN = 70; // 磁盘使用率percent
var SHOW_LEVEL_DISK_ERROR = 90;
var SHOW_LEVEL_NETWORK_WARN = 10 * 1024 * 1024; // bps
var SHOW_LEVEL_NETWORK_ERROR = 20 * 1024 * 1024; // bps
var SHOW_LEVEL_CONNECTION_WARN = 10000; // number of ESTABLISHED tcp connections.
var SHOW_LEVEL_CONNECTION_ERROR = 20000; // number of ESTABLISHED tcp connections.
// warning class for show levels.
var SHOW_LEVEL_PRIMARY_CLASS = "label label-primary";
var SHOW_LEVEL_WARN_CLASS = "label label-warning";
var SHOW_LEVEL_ERROR_CLASS = "label label-danger";
var WARN_HTML = "<div><span class='" + SHOW_LEVEL_WARN_CLASS  + "'>未知</span></div>";
var GLOBAL_LOG_START = 100; // log info start number.
var rtmfpd = "rtmfpd";
var tracker = "tracker";

var server_status = {
    online: "已上线",
    offline: "离线中"
};

var server_enabled_status = "已启用";
var server_disabled_status = "已禁用";

function finance_refresh_ms() {
    return finance_realtime_refresh_interval;
}

function bill_human_readable(bill) {
    var nb = {};
    nb.basic = basic_bill_human_readable(bill.basic);
    nb.area = {};
    nb.isp = {};
    nb.jlu = {};
    for (var item in bill.area.items) {
        nb.area[item] = basic_bill_human_readable(bill.area.items[item]);
    }
    for (var item in bill.isp.items) {
        nb.isp[item] = basic_bill_human_readable(bill.isp.items[item]);
    }
    for (var item in bill.jlu.items) {
        nb.jlu[item] = basic_bill_human_readable(bill.jlu.items[item]);
    }
    return nb;
}

function basic_bill_human_readable(bill) {
    var nb = {};
    nb.clients = bill.cli;
    nb.fluency = bill.flu.toFixed(1);
    return nb;
}
/**
 * convert_objs_to_lists
 */
function convert_dict_objs_to_list_objs(objs) {
    var lists = [];
    if (!typeof objs == Object) {
        return objs;
    }
    for (var o in objs){
        if (!typeof objs[o] == Object) {
            return lists;
        }
        if (objs[o].clients == 0) {
            continue;
        }
        var lo = objs[o];
        lo.name = o;
        lists.push(lo);
    }
    return lists;
}

function resort_dict_info(area, type, get_map) {
    var final_result = [];
    var result = convert_dict_objs_to_list_objs(area);
    // sort
    result.sort(function (a, b) {
        return b[type] - a[type];
    });
    // get the top number objs
    var len = realtime_sort_number;
    if (result.length < realtime_sort_number) {
        len = result.length;
    }
    for (var i = 0; i < len; i ++) {
        result[i].name = get_map(result[i].name);
        final_result.push(result[i]);
    }
    return final_result;
}

function array_object_sort(arr_objs) {
    var result = [];
    for (var i = 0; i < arr_objs.length; i ++) {
        result.push(arr_objs[i]);
    }
    result.sort(function(a, b) {
        if (a.time > b.time) {
            return 1;
        }
        if (a.time < b.time) {
            return -1;
        }
        return 0;
    });

    return result;
}

var province_map = {
    beijing: '北京',
    tianjin: '天津',
    shanghai: '上海',
    chongqing: '重庆',
    hebei: '河北',
    henan: '河南',
    yunnan: '云南',
    liaoning: '辽宁',
    heilongjiang: '黑龙江',
    hunan: '湖南',
    anhui: '安徽',
    shandong: '山东',
    xinjiang: '新疆',
    jiangsu: '江苏',
    zhejiang: '浙江',
    jiangxi: '江西',
    hubei: '湖北',
    guangxi: '广西',
    gansu: '甘肃',
    shan1xi: '山西',
    neimeng: '内蒙古',
    shan3xi: '陕西',
    jilin: '吉林',
    fujian: '福建',
    guizhou: '贵州',
    guangdong: '广东',
    qinghai: '青海',
    xizang: '西藏',
    sichuan: '四川',
    ningxia: '宁夏',
    hainan: '海南',
    taiwan: '台湾',
    xianggang: '香港',
    aomen: '澳门',
    oversea: '海外',
    other: '其他',
    unknown: "其他"
};

var isp_map = {
    ctl:  "电信",
    cnc:  "网通",
    cmb: "移动",
    cuc: "联通",
    crc: "铁通",
    dxt: "电信通",
    cer: "教育网",
    bgctv: "歌华",
    oversea: "海外",
    colnet: "有线通",
    citic: "邮电",
    ehome: "E家",
    fbwn: "方正",
    gdvnet: "珠江宽频",
    gwbn: "长城",
    wasu: "华数",
    twnet: "天威",
    other: "其他",
    unknown:"其他"
};

var get_isp_mapping_info = function (info) {
    if (isp_map[info]) {
        return isp_map[info];
    } else {
        return info;
    }
};
var get_area_mapping_info = function (info) {
    if (province_map[info]) {
        return province_map[info];
    } else {
        return info;
    }
};
var get_default_mapping_info = function (info) {
    return  info;
};

/**
 * get current datetime in "YYYY-mm-dd HH:MM:SS"
 */
function get_current_datetime() {
    var now = new Date().getTime() / 1000;
    return absolute_seconds_to_YYYYmmdd(now) + " " + absolute_seconds_to_HHMMSS(now);
}

function server_info_to_human_readable(infos) {
    var new_infos = [];
    for (var m = 0; m < infos.length; m ++) {
        var info = infos[m];
        var new_info = {};

        var db = info.db;
        new_info.id = db.id;
        new_info.enabled = db.enabled;
        new_info.status = db.status;
        new_info.device_id = db.device_id;
        new_info.update_time = db.time;
        new_info.labels = db.labels == null? []: db.labels;
        if (db.host.length > 0) {
            new_info.tag = "<div>" + db.host + "</div>";
        }
        if (db.local_ip.length > 0) {
            new_info.tag += "<div>" + db.local_ip + "</div>";
        }
        if (db.public_ip.length > 0) {
            new_info.tag += "<div>" + db.public_ip + "</div>";
        }

        var sample = info.sample;
        if (sample) {
            new_info.mem = sample.mem;
            new_info.cpu = sample.cpu;

            // deal ios
            new_info.ios = "";
            for (var item in sample.ios) {
                var s_class = servers_io_class(sample.ios[item]);
                new_info.ios += "<div><span class='" + s_class + "'>" + drop_value_head(item) + ": " + servers_io_stat(sample.ios[item])  + "</span></div>";
            }
            if (new_info.ios.length == 0) {
                new_info.ios = WARN_HTML;
            }

            // deal loads
            new_info.loads = "";
            for (var item in sample.loads) {
                var s_class = servers_load_class(sample.loads[item]);
                new_info.loads += "<div><span class='" + s_class + "'>" + item + ": " + server_load(sample.loads[item])  + "</span></div>";
            }
            if (new_info.loads.length == 0) {
                new_info.loads = WARN_HTML;
            }

            new_info.disk = sample.disk;
            new_info.conn = sample.conn;

            // deal netifs
            new_info.netifs = "";
            for (var item in sample.netifs) {
                var s_class = servers_net_class(sample.netifs[item]);
                new_info.netifs += "<div><span class='" + s_class + "'>" + drop_value_head(item) + ": " + servers_net(sample.netifs[item])  + "</span></div>";
            }
            if (new_info.netifs.length == 0) {
                new_info.netifs = WARN_HTML;
            }
            // deal plugins
            new_info.plugins = sample.plugins;
        }

        new_infos.push(new_info);
    }

    return new_infos;
}

function tracker_plugin_pid_dump(obj) {
    var rtn = "";
    for (var i=0; i < obj.length; i++) {
        ch = obj[i];
        rtn += "<div><span>" + ch["channelId"] + ": <b>" + ch["peers"]  + "</b></span></div>";
    }
    return rtn;
}

function servers_load_class(load){
    if (!load && load != 0) {
        return SHOW_LEVEL_WARN_CLASS;
    } else if (load < SHOW_LEVEL_LOAD_WARN) {
        return "";
    } else if (load < SHOW_LEVEL_LOAD_ERROR) {
        return SHOW_LEVEL_WARN_CLASS;
    } else {
        return SHOW_LEVEL_ERROR_CLASS;
    }
}

function server_load(load){
    if (!load && load != 0) {
        return "未知";
    }
    return load.toFixed(1);
}

function servers_io_class(io_stat){
    if (!io_stat || (!io_stat.util && io_stat.util != 0)) {
        return SHOW_LEVEL_WARN_CLASS;
    } else if ((io_stat.util) < SHOW_LEVEL_IOUTIL_WARN) {
        return "";
    } else if ((io_stat.util) < SHOW_LEVEL_IOUTIL_ERROR) {
        return SHOW_LEVEL_WARN_CLASS;
    } else {
        return SHOW_LEVEL_ERROR_CLASS;
    }
}

function servers_io_stat(io_stat){
    if (!io_stat) {
        return "未知";
    }
    return network_human_readable(io_stat.read_bytes) + "/ "
        + network_human_readable(io_stat.write_bytes) + ", " + (io_stat.util).toFixed(1) + '%';
}

function servers_net_class(net){
    if (!net) {
        return SHOW_LEVEL_WARN_CLASS;
    } else if (net.out_bytes_300s < SHOW_LEVEL_NETWORK_WARN) {
        return "";
    } else if (net.out_bytes_300s < SHOW_LEVEL_NETWORK_ERROR) {
        return SHOW_LEVEL_WARN_CLASS;
    } else {
        return SHOW_LEVEL_ERROR_CLASS;
    }
}

function servers_net(net){
    if (!net) {
        return "未知";
    }
    return network_human_readable(net.out_bytes_300s) + "/ "
        + network_human_readable(net.in_bytes_300s);
}

/**
 * return a human readable in K/M/G/T bit for network.
 */
function network_human_readable(network) {
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

function isObject(obj) {
    return Object.prototype.toString.call(obj) === '[object Object]';
}

function get_server_netifs(obj) {
    var netifs = [];
    for (var item in obj) {
        if (item.indexOf("out_bytes_300") > 0 || item.indexOf("in_bytes_300") > 0) {
            netifs.push(item);
        }
    }
    return netifs;
}

function get_server_flow_ifaces(obj) {
    var ifaces = [];
    for (var item in obj) {
        if (item.indexOf("in_flow") > 0 || item.indexOf("out_flow") > 0) {
            ifaces.push(item);
        }
    }
    return ifaces;
}

function convert_obj_to_flow(obj) {
    var flow_obj = {
        summary: {}
    };
    var times_flow = [];

    for (var item in obj) {
        if (obj[item].netifs) {
            var flow = {
                time: obj[item].time
            };
            for (var iface in obj[item].netifs) {
                var key = iface.split("=")[1];
                flow[key + "." + "in_flow"] = obj[item].netifs[iface].in_bytes_300s * 300 / 8;
                flow[key + "." + "out_flow"] = obj[ item].netifs[iface].out_bytes_300s * 300 / 8;
                if (!flow_obj.summary[key]) {
                    flow_obj.summary[key] = {
                        in_flow: 0,
                        out_flow: 0
                    };
                }
                flow_obj.summary[key].in_flow += flow[key + "." + "in_flow"];
                flow_obj.summary[key].out_flow += flow[key + "." + "out_flow"];
            }
            times_flow.push(flow);
        }
    }
    flow_obj.flows = times_flow;

    return flow_obj;
}

/*
* convert objs have 3level items to 1level item
* for example:
* {
*   cpu_percent: 30.1,
*   mem_percent: 70,
*   conn: {
*       close: 26,
*       estab: 100,
*       tw: 26
*   },
*   netifs: {
*       iface=eth0: {
*           out_300: 1234,
*           in_300: 200
*       },
*       iface=eth1: {
 *           out_300: 5678,
 *           in_300: 400
*       }
*   }
* }
* to
 * {
 *   cpu_percent: 30.1,
 *   mem_percent: 70,
 *   conn.close: 26,
 *   conn.estab: 100,
 *   conn,tw: 26,
 *   eth0.out_300: 1234,
 *   eth0.in_300: 200,
 *   eth1.out_300: 1234,
 *   eth1.in_300: 200
 * }
*
* */
function convert_obj_sub3items_to_items(arrays) {
    var results = [];
    for (var i = 0; i < arrays.length; i ++) {
        var res = {};
        var obj = arrays[i];
        for (var item in obj) {
            var obj_item = obj[item];
            if (isObject(obj_item)) {
                for (var item2 in obj_item) {
                    var obj_item2 = obj_item[item2];
                    if (isObject(obj_item2)) {
                        for (var item3 in obj_item2) {
                            var value_item = obj_item2[item3];
                            var tag = drop_value_head(item2) + "." + item3;
                            res[tag] = value_item;
                        }
                    } else {
                        res[item + "." + item2] = obj_item2;
                    }
                }
            } else {
                res[item] = obj_item;
            }
        }
        results.push(res);
    }
    return results;
}

function drop_value_head(value) {
    var index = value.indexOf("=");

    if (index >= 0) {
        return value.substring(index + 1);
    }
    return value;
}

Object.size = function(obj) {
    var size = 0;
    for (key in obj) {
        if (obj.hasOwnProperty(key)) size++;
    }
    return size;
};

/*
* convert server config objs to html
* {
     listen: 1935,
     srs_log_tank: "console",
     srs_log_level: "trace",
     http_api: {
         enabled: true,
         listen: 19851
     },
     rtmfp: {
         enabled: true,
         listen: 1935,
         overload_strategy: {
             max_sessions: 10000,
             strategy: "reject",
             redirect_to: "127.0.0.1:1936"
         },
         keep_alive_server: 15,
         keep_alive_peer: 10,
         peer_timeout: 100,
         disable_ssl: false,
         stat_interval: 10,
         bravo_tracker: true,
         tracker_url: "127.0.0.1:1998"
     }
 }
*/
function convert_config_objs_to_html(config) {
    var result = "<div>{</div>";
    for (var item in config) {
        result += "<div class='col-md-offset-1'><b>" + item + ":</b> ";
        if (!isObject(config[item])) {
            result += config[item] + "</div>";
        } else {
            result += "{ </div>";
            for (var ii in config[item]) {
                result += "<div class='col-md-offset-2'><b>" + ii + ":</b> ";
                if (!isObject(config[item][ii])) {
                    result += config[item][ii] + "</div>";
                } else {
                    result += "{</div>";
                    for (var iii in config[item][ii]) {
                        result += "<div class='col-md-offset-3'><b>" + iii + ":</b> " + config[item][ii][iii] + "</div>";
                    }
                    result += "<div class='col-md-offset-2'>}</div>"
                }
            }
            result += "<div class='col-md-offset-1'>}</div>"
        }
    }
    result += "<div>}</div>";
    return result;
}
