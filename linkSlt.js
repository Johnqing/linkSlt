var $ = require('jq');
var request = require('../libs/request');

var LinkSlt = function(el, options){
    this.el = el;
    this.settings = options;
    this.selectsArr = [];
    this.selectsLen = options.selects.length;

    this.init();
};

LinkSlt.prototype.init = function(){
    var _self = this;
    for (var i = 0; i < _self.selectsLen; i++) {
        if (!_self.el.find('select.' + _self.settings.selects[i])) {break};

        _self.selectsArr.push(_self.el.find('select.' + _self.settings.selects[i]));
    };

    _self.selectsLen = _self.selectsArr.length;

    // 选择器不存在
    if(!_self.selectsLen)
        return;

    if(typeof _self.settings.url == 'string'){
        request({
            url: _self.settings.url
        }).resolve(function(data){
            _self.data = data;
            _self.create();
        });
        return;
    }

    if(typeof _self.settings.url == 'object'){
        _self.data = _self.settings.url;
        _self.create();
    }
};

LinkSlt.prototype.create = function(){
    var _self = this;
    _self.el.on('change', 'select', function(){
        var key = $(this).data('key');
        _self.selectChange(key);
    });

    var _html = _self.getNewOptions(_self.selectsArr[0], _self.data);
    _self.selectsArr[0].html(_html).prop('disabled', false).trigger('change');

    _self.setDefaultValue();
};

LinkSlt.prototype.setDefaultValue = function(n){
    n = n || 0;

    var _this = this;
    var _value;

    // 超出范围
    if (n >= _this.selectsLen || !_this.selectsArr[n])
        return;

    _value = _this.selectsArr[n].data('value');

    if (typeof _value === 'string' || typeof _value === 'number' || typeof _value === 'boolean') {
        _value = _value.toString();

        setTimeout(function(){
            _this.selectsArr[n].val(_value).trigger('change');
            n++;
            _this.setDefaultValue(n);
        }, 1);
    }
}


LinkSlt.prototype.selectChange = function(key){
    var _self = this;
    var i=0;

    var selectValues = [];
    var selectIndex;
    // 获取当前select的位置
    for(;i<_self.selectsLen; i++){
        selectValues.push(_self.getIndex(_self.selectsArr[i][0].selectedIndex));

        if (typeof selectIndex === 'number' && i > selectIndex) {
            _self.selectsArr[i].empty().prop('disabled', true);

            if (_self.settings.nodata) {
                _self.selectsArr[i].addClass(_self.settings.nodata);
            }
        };

        if (key.indexOf( _self.settings.selects[i]) > -1) {
            selectIndex = i;
        };
    }

    var next = selectIndex + 1;
    var data = _self.data;

    for (var i = 0; i < next; i++){
        var item = data[selectValues[i]];
        if (typeof item === 'undefined'
            || $.isArray(item.child) === false
            || !item.child.length) {
            return;
        };
        data = item.child;
    }
    var nextSlt = _self.selectsArr[next];
    if(nextSlt){
        var html = _self.getNewOptions(nextSlt, data);
        nextSlt.html(html).prop('disabled', false).removeClass(_self.settings.nodata).trigger('change');
    }

};

LinkSlt.prototype.getNewOptions = function(node, data){
    if(!node)
        return;
    var _self = this;
    var _title = _self.settings.firstTitle;
    var _value = _self.settings.firstValue;
    var _dataTitle = node.data('firstTitle');
    var _dataValue = node.data('firstValue');
    var _html = '';

    if (typeof _dataTitle === 'string' || typeof _dataTitle === 'number' || typeof _dataTitle === 'boolean') {
        _title = _dataTitle.toString();
    }

    if (typeof _dataValue === 'string' || typeof _dataValue === 'number' || typeof _dataValue === 'boolean') {
        _value = _dataValue.toString();
    }

    if (!_self.settings.required) {
        _html='<option value="' + _value + '">' + _title + '</option>';
    }
    // each时生成
    var fn = function(i, v){
        if (typeof(v.code) === 'string' || typeof(v.code) === 'number' || typeof(v.code) === 'boolean') {
            _html += '<option value="'+v.code+'">' + v.name + '</option>';
        } else {
            _html += '<option value="'+v.code+'">' + v.name + '</option>';
        };
    };

    // 调用时重置
    if(typeof _self.settings.getNewOptions == 'function'){
        fn = _self.settings.getNewOptions;
    }

    $.each(data, fn);

    return _html;
}

LinkSlt.prototype.getIndex = function(n){
    return (this.settings.required) ? n : n - 1;
}

module.exports = function(el, options){
    el = $(el);

    var __DEFAULT = {
        selects: [],			// 下拉选框组
        url: null,				// 列表数据文件路径，或设为对象
        nodata: null,			// 无数据状态
        required: false,		// 是否为必选
        firstTitle: '请选择',	// 第一个选项选项的标题
        firstValue: '0',		// 第一个选项的值
        getNewOptions: false    // 显示不同的数据结构
    };

    options = $.extend({}, __DEFAULT, options);

    return el.each(function(){
        return new LinkSlt(el, options)
    });
}
