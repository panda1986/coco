'use strict';
angular.module('directive', [])
.directive('navToggle', function () {
    return {
        restrict: 'EA',
        link: function (scope, element, attr) {
            var _this;
            element.click(function () {
                _this = $(this);
                if (_this.hasClass('u-unfold')) {
                    _this.removeClass('u-unfold');
                    $('.g-mn1').css({marginLeft: '210px'});
                    $('.g-sd1').show();
                } else {
                    _this.addClass('u-unfold');
                    $('.g-sd1').hide();
                    $('.g-hd,.g-mn1').css({marginLeft: '0'});
                }
            });
        }
    };
})
.directive('switch', function () {
    return {
        restrict: 'AE',
        replace: true,
        transclude: true,
        template: function (element, attrs) {
            var html = '';
            html += '<span';
            html +=   ' class="switch' + (attrs.class ? ' ' + attrs.class : '') + '"';
            html +=   attrs.ngModel ? ' ng-click="' + attrs.disabled + ' ? ' + attrs.ngModel + ' : ' + attrs.ngModel + '=!' + attrs.ngModel + (attrs.ngChange ? '; ' + attrs.ngChange + '()"' : '"') : '';
            html +=   ' ng-class="{ checked:' + attrs.ngModel + ', disabled:' + attrs.disabled + ' }"';
            html +=   '>';
            html +=   '<small></small>';
            html +=   '<input type="checkbox"';
            html +=     attrs.id ? ' id="' + attrs.id + '"' : '';
            html +=     attrs.name ? ' name="' + attrs.name + '"' : '';
            html +=     attrs.ngModel ? ' ng-model="' + attrs.ngModel + '"' : '';
            html +=     ' style="display:none" />';
            html +=     '<span class="switch-text">';                                  /* adding new container for switch text */
            html +=     attrs.on ? '<span class="on">' + attrs.on + '</span>' : '';        /* switch text on value set by user in directive html markup */
            html +=     attrs.off ? '<span class="off">' + attrs.off + '</span>' : ' ';  /* switch text off value set by user in directive html markup */
            html += '</span>';
            return html;
        }
    }
});