'use strict';
angular.module('filter', [])
// absolute_seconds_to_YYYYmmdd_hhmmss
.filter('humanTimestamp2', function () {
    return function (timestamp) {
        if (timestamp == 0) {
            return "--"
        }
        var date = new Date();
        date.setTime(Number(timestamp) * 1000);

        var ret = date.getFullYear()
            + "-" + padding(date.getMonth() + 1, 2, '0')
            + "-" + padding(date.getDate(), 2, '0')
            + " " + padding(date.getHours(), 2, '0')
            + ":" + padding(date.getMinutes(), 2, '0')
            + ":" + padding(date.getSeconds(), 2, '0');
        return ret;
    };
})
.filter('RMB', function () {
    return function (value) {
        return number_format(value, 0, ".", ",");//1,234,567.08
    };
});