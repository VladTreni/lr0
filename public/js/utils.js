(function ($) {
    if ($('body').hasClass('no-scroll'))
        window.scrollTo(0, 0);
    $(':text[autocomplete]').each(function () {
        var cur = $(this);
        if (!cur.is("[nocomplete]"))
            cur.removeAttr('autocomplete');
        cur.placeholder();
    });
    // ajax
    $.ajaxSetup({type: "POST", cache: false, dataType: "json"});
    $.ajaxPrefilter(function (options) {
        if (options.data == undefined)
            options.data = '';
        if (options.data == '')
            options.data = 'csrf=' + $.cookie(cookiecsrf);
        else
            options.data += '&csrf=' + $.cookie(cookiecsrf);
    });
    // protection from iframe loading
    if ((self.parent && !(self.parent === self)) && (self.parent.frames.length != 0))
        self.parent.location = document.location;
})(jQuery);
// COMPONENTS
(function ($) {
    /* M COMPONENTS */
    /* M components shared */
    $.fn.componentMVal = function () {
        return $(this).find('.selected:first').valM();
    }
    /*
     selectM component
     */
    $.fn.selectM = function (func) {
        // jsp1 is a style for jscrollpane
        $(this).each(function () {
            var selectM = $(this);
            selectM.addClass('jsp1').append('<div class="pointer caret"></div>').find('ul').wrap('<div class="scroll-pane list">');
            var ul = selectM.find('ul'), li = ul.children(), input = selectM.find('input'), list = selectM.find('.list'), txt = selectM.children('.txt');
            selectM.attr('initHeight', list.css('height'))
            selectM.click(function (e) {
                e.stopPropagation();
                var selected = $(this);
                list = selectM.find('.list')
                ul = selectM.find('ul')
                if (list.is(':visible'))
                    return $(list).selectMHide();
                $().selectMHide();
                list.show();
                ul.show();
                if (!list.hasClass('init')) {
                    if (ul.outerHeight() > list.outerHeight()) {
                        list.jsp();
                        li.each(function () {
                            var cur = $(this);
                            if (cur.attr('val') == input.val() || cur.text() == input.val()) {
                                cur.addClass('selected');
                                return false;
                            }
                        });
                        list.find('.jspVerticalBar').click(function (e) {
                            e.stopPropagation();
                        });
                        if (list.outerWidth() <= selected.outerWidth()) {
                            list.find('.jspContainer').css('width', '100%');
                            list.css('width', '100%');
                        }
                        list.find('.jspPane').css('width', '100%');
                    } else {
                        list.height(ul.outerHeight());
                        if (list.outerWidth() <= selected.outerWidth())
                            list.css('width', '100%');
                    }
                    list.addClass('init');
                }
                if (list.hasClass('jspScrollable'))
                    list.data('jsp').scrollToElement(ul.find('.selected'));
            });
            li.click(function (e) {
                e.stopPropagation();
                var selected = $(this), val = $(selected).valM();
                var anotherSelected = !selected.is(li.filter('.selected:first'));
                li.removeClass('selected');
                selected.addClass('selected');
                input.val(val);
                txt.text(selected.text());
                $(list).selectMHide();
                if (anotherSelected)
                    func.call(this, [val])
            });

            var selected = li.filter('.selected:first');
            if (selected.length == 0)
                selected = li.filter(':first');
            txt.text(selected.text())
            input.val($(selected).valM());
        });
        return $(this);
    }
    $.fn.selectMRefresh = function () {
        $(this).each(function () {
            var cur = $(this), list = cur.find('.list');
            var data = list.data('jsp');
            if (data != undefined)
                list.data('jsp').destroy();
            cur.find('.list').hide().removeClass('init').height(cur.attr('initHeight'))
        });
        return $(this)
    }
    $('html').click(function () {
        $().selectMHide();
    });
    $.fn.selectMHide = function () {
        if ($(this).length > 0)
            $(this).hide();
        else
            $('.selectm .list:visible').hide();
    }
    /*
     dropdownM
     adds .dropdownM
     */
    $.fn.dropdownM = function (func) {
        $(this).each(function () {
            var dropdown = $(this).addClass('dropdownM'), li = dropdown.find('li'),
                input = dropdown.find('input[type="hidden"]'), txt = dropdown.find('.title');
            if (!input.hasAttr('value'))
                input.val($(li.get(0)).attr('val'));
            li.click(function () {
                var cur = $(this);
                if (cur.hasClass('selected'))
                    return;
                li = dropdown.find('li')
                li.removeClass('selected');
                cur.addClass('selected');
                input.val(cur.attr('val'));
                txt.text(cur.text());
                func.call(this, [cur.attr('val'), cur.text()]);
            });
            dropdown.click(function (e) {
                var cur = $(this).addClass('selected'), ul = cur.find('ul');
                if (ul.is(':visible')) {
                    ul.hide();
                    cur.removeClass('selected')
                } else
                    ul.show();
                $('.dropdownM').each(function () {
                    if (!$(this).is(cur))
                        $(this).removeClass('selected').find('ul').hide();
                });
                e.stopPropagation();
            });
            var selected = li.filter('.selected');
            if (selected.length == 0)
                selected = li.filter(':first').addClass('selected');
            input.val(selected.valM())
            txt.text(selected.text());
        });
    };
    $('html').click(function () {
        $('.dropdownM').removeClass('selected').find('ul').hide();
    });
    /* toggleM */
    $.fn.toggleM = function (controls, func) {
        $(this).each(function () {
            var cur = $(this), cont = cur.find(controls), input = cur.find('input[type="hidden"]');
            cont.click(function () {
                cont.removeClass('selected');
                $(this).addClass('selected');
                input.val($(this).valM())
                func.call(this, [$(this).valM()])
            });
            var selected = cont.filter('.selected');
            if (selected.length == 0)
                selected = cont.filter(':first').addClass('selected');
            input.val(selected.valM())
        });
        return $(this);
    }

    // -- TOOLTIP 1 --    position: left, right, middle; text
    $.fn.tooltip1 = function (params) {
        var cur = $(this);
        var tooltip = $('#tooltip1').find('.txt').html(params.text).end();
        var pointer = tooltip.find('.pointer');
        var body = $('body');

        params = $.extend({position: tooltip1Dictionary.right}, params);

        cur.hover(function () {

            var extraWidth = 3;
            var extraHeight = 5;

            var offset = $(this).offset();
            pointer.hide();

            var verticalSameTop = offset.top - extraHeight;
            var verticalSameBottom = offset.top + extraHeight + cur.outerHeight() - tooltip.outerHeight();
            var verticalTop = offset.top - tooltip.outerHeight() - tooltip.find('.top').outerHeight();
            var verticalBottom = offset.top + tooltip.find('.bottom').outerHeight() + cur.outerHeight();
            var horizontalRight = offset.left + cur.outerWidth() + extraWidth + pointer.outerWidth();
            var horizontalLeft = offset.left - extraWidth - pointer.outerWidth() - tooltip.outerWidth();
            var horizontalCenter = offset.left + cur.outerWidth() / 2 - tooltip.outerWidth() / 2;

            var verticalShowOnTop = verticalSameTop + tooltip.outerHeight(true) < $(window).height() || verticalSameBottom - tooltip.outerHeight(true) < 0;

            if (params.position == tooltip1Dictionary.right) {
                if (verticalShowOnTop)
                    tooltip.css({top: verticalSameTop + body.scrollTop(), left: horizontalRight}).find('.right-bottom').show();
                else
                    tooltip.css({top: verticalSameBottom + body.scrollTop(), left: horizontalRight}).find('.right-top').show();
            } else if (params.position == tooltip1Dictionary.left) {
                if (verticalShowOnTop)
                    tooltip.css({top: verticalSameTop + body.scrollTop(), left: horizontalLeft}).find('.left-bottom').show();
                else
                    tooltip.css({top: verticalSameBottom + body.scrollTop(), left: horizontalLeft}).find('.left-top').show();
            } else {
                if (offset.top - tooltip.outerHeight() > 0)
                    tooltip.css({top: verticalTop + body.scrollTop(), left: horizontalCenter}).find('.top').show();
                else
                    tooltip.css({top: verticalBottom + body.scrollTop(), left: horizontalCenter}).find('.bottom').show();
            }

            tooltip.stop(true, true).fadeIn(200);
        }, function () {
            tooltip.stop(true, true).fadeOut().css('top', -1000);
        });

    }

    // --- TIPBOX ---
    /*
     tipboxShow API. text - text to display, pointer - css rule for custom pointer, icon - pointer icon see tipboxDictionary
     */
    $(document).ready(function () {
        // init tipbox
        $('.tipbox').each(function () {
            var cur = $(this);
            cur.addClass('f').append('<span class="text"></span>').append('<div class="pointer sprite">').append('<div class="icon sprite"></div>').append('<div class="line"></div>').append('<span class="close">X</span>');
            cur.find('.close').click(function () {
                cur.tipboxHide();
                $(window).trigger('resize');
            });
        });
    });
    $.fn.tipboxShow = function (params) {
        var settings = $.extend({text: '', pointer: '', icon: ''}, params);
        var cur = $(this);
        cur.find('.pointer').attr('class', $.trim('pointer sprite ' + settings.pointer));
        cur.find('.icon').attr('class', 'icon sprite ' + settings.icon);
        cur.find('.text').html(settings.text);
        cur.stop(true, true).show(600, function () {
            $(window).trigger('resize');
        });
    }
    $.fn.tipboxHide = function () {
        $(this).stop(true, true).hide(600, function () {
            $(window).trigger('resize');
        });
    }
    // --- PAGE ALERT ---
    $.fn.pageAlert = function (type) {
        if (type == 'show')
            $(this).fadeIn(300);
        else
            $(this).fadeOut(300);
    }

    $.fn.pageAlertHide = function () {
        back.stop().animate({opacity: 0}, 800, function () {
            pageAlert.hide();
        });
        box.stop().fadeOut(300);
    }

    /* jScrollPane */
    $.fn.jsp = function () {
        $(this).jScrollPane({showArrows: true})
            .bind('mousewheel',function (e) {
                e.preventDefault();
            }).find('.jspDrag').append('<div class="line"></div>');
    }

})(jQuery);
// COMPONENTS HELPERS
function pageAlertButton(title, txt) {
    $().pageAlert(pageAlertDictionary.button, title, txt);
}
function pageAlertPreloader(txt) {
    txt = typeof pointer === 'undefined' ? i18n['SITE_PLEASE_WAIT'] : i18n[txt];
    $().pageAlert(pageAlertDictionary.preloader, '', txt);
}
function tipboxWait(tipbox, pointer) {
    pointer = typeof pointer !== 'undefined' ? pointer : '';
    tipbox.tipboxShow({text: i18n.SITE_PLEASE_WAIT, icon: tipboxDictionary.iconPreloader1, pointer: pointer});
}
function tipboxMsg(data, tipbox, pointer) {
    var icon, loc, obj, isSuccess;
    if (isset(data, 'success')) {
        icon = tipboxDictionary.iconSuccess;
        loc = isset(i18n, data['success']) ? i18n[data['success']] : i18n.SITE_ANY_SUCCESS;
        isSuccess = true;
    } else {
        icon = tipboxDictionary.iconError;
        loc = isset(data, 'error') && isset(i18n, data['error']) ? i18n[data['error']] : i18n.SITE_UNKNOWN_ERROR;
        isSuccess = false;
    }
    obj = {text: loc, icon: icon};
    if (typeof pointer !== 'undefined')
        obj['pointer'] = pointer;
    tipbox.tipboxShow(obj);
    return isSuccess;
}
function tipboxAjaxError(tipbox, jqXHR) {
    if (jqXHR.status == 200)
        tipbox.tipboxShow({text: i18n.SITE_AJAX_FAILED, icon: tipboxDictionary.iconError});
    else
        tipbox.tipboxShow({text: i18n.SITE_INACCESSIBLE, icon: tipboxDictionary.iconError});
}
// $ HELPERS
(function ($) {
    // input validation
    $.fn.onlyNumericInput = function () {
        $(this).keydown(function (event) {
            // Allow: backspace, delete, tab, escape, and enter
            if (event.keyCode == 46 || event.keyCode == 8 || event.keyCode == 9 || event.keyCode == 27 || event.keyCode == 13 ||
                // Allow: Ctrl+A
                (event.keyCode == 65 && event.ctrlKey === true) ||
                // Allow: home, end, left, right
                (event.keyCode >= 35 && event.keyCode <= 39)) {
                // let it happen, don't do anything
            }
            else {
                // Ensure that it is a number and stop the keypress
                if (event.shiftKey || (event.keyCode < 48 || event.keyCode > 57) && (event.keyCode < 96 || event.keyCode > 105 )) {
                    event.preventDefault();
                }
            }
        });
    };
    $.fn.disableTxtSelection = function () {
        return $(this).bind(( $.support.selectstart ? "selectstart" : "mousedown" ), function (event) {
            event.preventDefault();
        });
    }
    // html
    $.fn.liSort = function () {
        var li = $(this).find('li:not(.nosort)').detach().sort(function (a, b) {
            a = $(a).text();
            b = $(b).text();
            return (a < b) ? -1 : ((a > b) ? 1 : 0);
        });
        $(this).append(li);
    }
    $.fn.valM = function () {
        return $(this).hasAttr('val') ? $(this).attr('val') : $(this).text()
    }
    $.fn.hasScrollBar = function () {
        return this.get(0).scrollHeight > this.height();
    }
    $.fn.hasAttr = function (name) {
        var attr = $(this).attr(name);
        return typeof attr !== 'undefined' && attr !== false;
    }
    // array, sets, selections, conversions
    $.fn.reverse = [].reverse;
    $.fn.serializeObject = function () {
        var o = {};
        var a = this.serializeArray();
        $.each(a, function () {
            if (o[this.name] !== undefined) {
                if (!o[this.name].push) {
                    o[this.name] = [o[this.name]];
                }
                o[this.name].push(this.value || '');
            } else {
                o[this.name] = this.value || '';
            }
        });
        return o;
    };
})(jQuery);
// ARRAY HELPERS
Array.prototype.move = function (old_index, new_index) {
    if (new_index >= this.length) {
        var k = new_index - this.length;
        while ((k--) + 1) {
            this.push(undefined);
        }
    }
    this.splice(new_index, 0, this.splice(old_index, 1)[0]);
    return this; // for testing purposes
};
// SECURITY HELPERS, VALIDATION HELPERS
function isset(obj, val) {
    return !(obj === null || typeof obj === 'undefined' || typeof obj[val] === 'undefined');
}

function validUsername(name) {
    return (name.length >= 2 && name.length <= 100 && /^[A-Za-z]+\.?[A-Za-z0-9]+$/.test(name));
}
function validEmail(emailVal) {
    return (/^([a-z0-9\+_\-]+)(\.[a-z0-9\+_\-]+)*@([a-z0-9\-]+\.)+[a-z]{2,6}$/.test(emailVal) && emailVal.length <= 100 && emailVal.length >= 6);
}

function validPass(password) {
    return (password.length >= 6 && password.length <= 30 && /^[A-Za-z0-9@!#\$%\^&\*\(\)_\+\-:;,\.]+$/.test(password));
}
function addCSRFTag(form) {
    form.append('<input type="hidden" name="csrf" class="remove" value="' + $.cookie(cookiecsrf) + '">');
}
function removeCSRFTag(form) {
    form.find('[name="csrf"]').remove();
}

// NETWORK HELPERS
function getHashParam(name) {
    name = name.replace(/[\[]/, "\\\[").replace(/[\]]/, "\\\]");
    var regexS = name + "=([^&#]*)";
    var regex = new RegExp(regexS);
    var hash = window.location.toString().split('#!')[1];
    var results = regex.exec(hash);
    return results == null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
}

function addHashParam(param, val) {
    if (!!(window.history && history.pushState)) {
        // https://developer.mozilla.org/en-US/docs/DOM/Manipulating_the_browser_history
    } else {

    }
    var hash = window.location.toString().split('#!')[1];
    if (hash == undefined || hash == '') {
        location.hash = '!' + param + '=' + val;
    } else {
        var reg = /^[a-z|1-9\-]+$/;
        var arr = hash.split('&');
        var finalArray = [];
        for (var i = 0; i < arr.length; i++) {
            if (arr[i].indexOf('=') == -1) return;
            var loc = arr[i].toLocaleLowerCase().split('=');
            if (reg.test(loc[0]) && reg.test(loc[1]) && loc[0] != param)finalArray.push(arr[i]);
        }
        if (reg.test(param) && reg.test(val))
            finalArray.push(param + '=' + val);
        location.hash = finalArray.length > 0 ? '!' + finalArray.join('&') : '';
    }
}

function redirect(url, time) {
    if (time == undefined || time == 0)
        window.location.replace(url);
    else
        setTimeout(function () {
            window.location.replace(url);
        }, time * 1000);
}

function log(data) {
    if (window.console && window.console.log) {
        window.console.log(data);
    }
}

// FILE HELPERS
function fileInfo(file) {
    var obj = {};
    if (isset(file, 'name')) {
        obj['name'] = file['name'];
        var ext = file['name'].split('.');
        if (ext.length > 1) {
            ext = ext[ext.length - 1];
            obj['isImage'] = ext == 'jpg' || ext == 'jpeg' || ext == 'png' || ext == 'gif';
        }
    }
    if (!window.FileReader)
        return obj;

    if (isset(file, 'size')) {
        obj['kb'] = (file['size'] / 1024).toFixed(2);
        obj['mb'] = (file['size'] / (1024 * 1024)).toFixed(2);
        obj['gb'] = (file['size'] / (1024 * 1024 * 1024)).toFixed(2);
    }
    if (isset(file, 'type')) {
        obj['mime'] = file['type'];
        obj['isImage'] = file['type'] == 'image/jpeg' || file['type'] == 'image/pjpeg' || file['type'] == 'image/png' || file['type'] == 'image/x-png' || file['type'] == 'image/gif';
    }
    return obj;
}
// FORMAT HELPERS

function number_format(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}
function ucfirst(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

// CONSTANTS, DICTIONARIES
function TipboxDictionary() {
    this.iconError = 'error';
    this.iconPreloader1 = 'preloader1';
    this.iconSuccess = 'success';
}
var tipboxDictionary = new TipboxDictionary();

function Tooltip1Dictionary() {
    this.left = 'left';
    this.right = 'right';
    this.middle = 'middle';
}
var tooltip1Dictionary = new Tooltip1Dictionary();
