var fs = require('fs'),
    path = require('path'),
    extend = require('node.extend'),
    through = require('through2'),
    artTemplate = require('ued-art-template').getNative();


var defaults = {
    base: null,
    openTag: '<%',
    closeTag: '%>',
    replaceOpenTag: '[%',
    replaceCloseTag: '%]'
};

var preInclude = function(options) {

    options = extend({}, defaults, options);

    // get `include('hello.html');` out from <% include('hello.html'); %>
    ///(<%\s*?)(\binclude\b[^\(]*?\([^\)]*?\);?)(?=[\s\S]*?%>)/g,
    var GET_INCLUDE_STR_REGEXP = new RegExp('(' + options.openTag + '\\s*?)(\\binclude\\b[^\\(]*?\\([^\\)]*?\\);?)(?=[\\s\\S]*?' + options.closeTag + ')', 'g'),
        // get `includeNative('hello.html');` out from <% includeNative('hello.html'); %>
        // GET_INCLUDE_NATIVE_STR_REGEXP = /(<%\s*?)(\bincludeNative\b[^\(]*?\([^\)]*?\);?)(?=[\s\S]*?%>)/g,
        GET_INCLUDE_NATIVE_STR_REGEXP = new RegExp('(' + options.openTag + '\\s*?)(\\bincludeNative\\b[^\\(]*?\\([^\\)]*?\\);?)(?=[\\s\\S]*?' + options.closeTag + ')', 'g'),

        GET_INCLUDE_PURE_STR_REGEXP = new RegExp('(' + options.openTag + '\\s*?)(\\bincludePure\\b[^\\(]*?\\([^\\)]*?\\);?)(?=[\\s\\S]*?' + options.closeTag + ')', 'g'),
        // parse data , include('hello.html', { data: data }) -> get `{ data: data }`;
        // GET_DATA_REGEPX= /.*?(\binclude\b[^\(]*?\([^,]*?),([\s\S]*?)\)/;
        GET_DATA_REGEPX= new RegExp('.*?(\\binclude\\b[^\\(]*?\\([^,]*?),([\\s\\S]*?)\\)', 'g');

    function readFile(html, basePath) {

        // process include('a.html'), and replace `include('a.html')` with processed a.html
        html = readIncludeNative(html, basePath);
        html = readIncludePure(html, basePath);
        html = readInclude(html, basePath);

        return html;
    };

// process include('a.html');
    var readInclude = function(html, basePath) {

        var self = arguments.callee;

        return html.replace(GET_INCLUDE_STR_REGEXP, function($0, $1, $2) {

            // 如果匹配成功，即有include方法存在
            // $2 -> `include('hello.html', data) || `include('hello.html'); `;
            var resultData = GET_DATA_REGEPX.exec($2),
                evalFun = $2,
                dataParam = '';

            // 如果用户有传入 data, 即 include('hello.html', data)
            if(resultData) {

                // include('hello.html', data) -> include('hello.html') -> evalFun
                evalFun = $2.replace(GET_DATA_REGEPX, function($0, $1) { return $1 + ')'});

                // 将 include('hello.html', data), 的data -> dataParam
                dataParam = resultData[2];
            }

            // 整个代码块分为 headerCode
            //              contentCode
            //              footerCode

            var headerCode = $1 + ' ' + options.closeTag + ' \n ' + options.openTag + ' (function($$data) {' + options.closeTag + '\n';

            // evalFun = (functoin(include) {
            //            return include('hello.html');
            //         })(include);
            evalFun = (new Function('include', 'return ' + evalFun ))(include);

            // fs.readFileSync('hello.html', 'utf-8') -> contentCode
            var contentCode = evalFun(basePath, options.base);

            // artTemplate当中的方法，通过正则获取content里面的变量
            var variables = getVariables(contentCode.content);

            // 将变量加到headerCode后面
            headerCode += (variables.length > 0 ? (' ' + options.openTag + ' var ' + variables.join(',') + '; ' + options.closeTag + ' \n') : '');

            // 当返回的content里面还有include的时候，进行递归
            contentCode = self(contentCode.content, contentCode.basePath);

            // 如果contentCode中无<% %>的内嵌逻辑代码就直接返回contentCode
            var regEmptyTagContent = new RegExp(options.openTag + '[\\s\\S]*?' + options.closeTag);
            if(!regEmptyTagContent.test(contentCode)) {
                return $1 + ' ' + options.closeTag + contentCode + ' ' + options.openTag;
            }

            // footerCode闭合整代码和headerCode相呼应
            var footerCode = ' \n ' + options.openTag + ' })(' + dataParam + '); ' + options.closeTag + ' \n ' + options.openTag;

            return headerCode + contentCode + footerCode;
        });
    };

// process includeNative('a.html');
// simply replace `includeNative('a.html')` with original a.html compared with `readInclude` which is compiled
    var readIncludeNative = function(html, basePath) {

        var self = arguments.callee;

        return html.replace(GET_INCLUDE_NATIVE_STR_REGEXP, function($0, $1, $2) {

            // 如果匹配成功，即有includeNative 方法存在
            // $2 -> `include('hello.html', data) || `include('hello.html'); `;
            var evalFun = $2;

            evalFun = (new Function('includeNative', 'return ' + evalFun ))(include);

            // fs.readFileSync('hello.html', 'utf-8') -> contentCode
            var contentCode = evalFun(basePath, options.base);

            // 暂时includeNative不做递归替换
            // set [% %] to open tag && close tag
            // return $1 + '%>' + contentCode.content.replace(/<%/g, '[%').replace(/%>/g, '%]') + '<%';
            var retStr = $1 + options.closeTag,
                retContent = contentCode.content;

            if(options.replaceOpenTag !== null) {
                retContent = retContent.replace(new RegExp(options.openTag, 'g'), options.replaceOpenTag);
            }

            if(options.replaceCloseTag !== null) {
                retContent = retContent.replace(new RegExp(options.closeTag, 'g'), options.replaceCloseTag);
            }

            return retStr + retContent + options.openTag;
        });
    };

    var readIncludePure = function(html, basePath) {

        var self = arguments.callee;

        return html.replace(GET_INCLUDE_PURE_STR_REGEXP, function($0, $1, $2) {

            // 如果匹配成功，即有includePure 方法存在
            // $2 -> `include('hello.html', data) || `include('hello.html'); `;
            var evalFun = $2;

            evalFun = (new Function('includePure', 'return ' + evalFun ))(include);

            // fs.readFileSync('hello.html', 'utf-8') -> contentCode
            var contentCode = evalFun(basePath, options.base);

            // 暂时includeNative不做递归替换
            // set [% %] to open tag && close tag
            // return $1 + '%>' + contentCode.content.replace(/<%/g, '[%').replace(/%>/g, '%]') + '<%';
            var retStr = $1 + options.closeTag,
                retContent = contentCode.content;

            return retStr + retContent + options.openTag;
        });
    };

// 此方法提供给<% include(); %>的 include 使用
// 也能提供给<% includeNative(); %> 使用
// var includedHtmlText =
//         (function() {
//             return include('hello.html');
//         })(include)(basePath, base);
    function include(includeFilePath) {

        return function(basePath, base) {

            // <% include('/header.html') %>
            // => include(defaults.base + '/header.html');
            if (path.isAbsolute(includeFilePath)) {

                // 如果includeFilePath是以 '/'开头的，则认为是相对于base进行定位的
                if (includeFilePath[0] === '/') {
                    includeFilePath = (base ? base : '') + includeFilePath;
                }

            } else {

                // 如果是相对地址，进入这个逻辑
                // 通过basePath和includeFilePath来拼接成完全的地址
                includeFilePath = path.resolve(basePath, includeFilePath);

            }

            var content = '';

            try {
                content = fs.readFileSync(includeFilePath, 'utf-8');
            } catch(e) {
                console.error(e);
            }

            return {
                content: content,

                // 同时返回basePath, 用于多层include的时候，保证引用的正确性
                basePath: path.dirname(includeFilePath)
            }
        };
    };

// 下面是artTemplate取过来的
// from artTemplate, 用来获取模板中的变量
// 静态分析模板变量
    var KEYWORDS =
        // 关键字
        'break,case,catch,continue,debugger,default,delete,do,else,false'
        + ',finally,for,function,if,in,instanceof,new,null,return,switch,this'
        + ',throw,true,try,typeof,var,void,while,with'

            // 保留字
        + ',abstract,boolean,byte,char,class,const,double,enum,export,extends'
        + ',final,float,goto,implements,import,int,interface,long,native'
        + ',package,private,protected,public,short,static,super,synchronized'
        + ',throws,transient,volatile'

            // ECMA 5 - use strict
        + ',arguments,let,yield'

        + ',undefined';

    var REMOVE_RE = /\/\*[\w\W]*?\*\/|\/\/[^\n]*\n|\/\/[^\n]*$|"(?:[^"\\]|\\[\w\W])*"|'(?:[^'\\]|\\[\w\W])*'|\s*\.\s*[$\w\.]+/g;
    var SPLIT_RE = /[^\w$]+/g;
    var KEYWORDS_RE = new RegExp(["\\b" + KEYWORDS.replace(/,/g, '\\b|\\b') + "\\b"].join('|'), 'g');
    var NUMBER_RE = /^\d[^,]*|,\d[^,]*/g;
    var BOUNDARY_RE = /^,+|,+$/g;


// 获取变量
    function getVariable (code) {
        return code
            .replace(REMOVE_RE, '')
            .replace(SPLIT_RE, ',')
            .replace(KEYWORDS_RE, '')
            .replace(NUMBER_RE, '')
            .replace(BOUNDARY_RE, '')
            .split(/^$|,+/);
    };

    var getVariables = function(source) {

        var options = extend({}, artTemplate.defaults, options);

        var openTag = options.openTag,
            closeTag = options.closeTag;

        var uniq = {$data:1,$filename:1,$utils:1,$helpers:1,$out:1,$line:1};

        var headerCode = [];

        // html与逻辑语法分离
        source.split(openTag).forEach(function(code) {

            code = code.split(closeTag);

            var $0 = code[0];
            var $1 = code[1];

            // code: [html]
            if (code.length === 1) {

                // code: [logic, html]
            } else {

                headerCode = headerCode.concat(logic($0, uniq));
            }
        });

        return headerCode;
    }

// 处理逻辑语句
    function logic (code, uniq) {

        var headerCode = [];
        var utils = artTemplate.utils;
        var helpers = artTemplate.helpers;

        // 提取模板中的变量名
        getVariable(code).forEach(function(name) {

            // name 值可能为空，在安卓低版本浏览器下
            if (!name || uniq[name]) {
                return;
            }

            var value;

            // 声明模板变量
            // 赋值优先级:
            // [include, print] > utils > helpers > data
            if (name === 'print') {
                return;
            } else if (name === 'include') {
                return;
            } else if (utils[name]) {

                value = "$utils." + name;

            } else if (helpers[name]) {

                value = "$helpers." + name;

            } else {

                value = "$$data." + name;
            }

            headerCode.push(name + "=" + value);
            uniq[name] = true;
        })

        return headerCode;
    };


    return through.obj(function(file, encoding, callback) {

        // is null doesn't supported
        if (file.isNull()) {

            // 传给下一个through对象
            this.push(file);
            return callback();
        }

        // stream doesn't supported
        if (file.isStream()) {

            return callback(new Error('Streaming not supported'));
        }

        var html = String(file.contents),
            basePath = path.dirname(file.path);

        file.contents = new Buffer(readFile(html, basePath).replace(new RegExp(options.openTag + '\\s*?' + options.closeTag,'g'),''));
        this.push(file);
        callback();

    });


};


exports = module.exports = preInclude;

// set some configs
exports.config = function(key, value) {
    defaults[key] = value;
}
