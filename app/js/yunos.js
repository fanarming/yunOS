;(function($, window, document,undefined) {   
    //在插件中使用Beautifier对象
    $.fn.countPlugin = function(options) {    
        var defaults = {
         	'strs': '',
	        'min': 1,
	        'max': 20
	    };
	    var settings = $.extend({},defaults, options);//将一个空对象做为第一个参数
	    
	    var cont = $(settings.el),
	    	strs = settings.strs,
	    	min = settings.min,
	    	max = settings.max,
	    	len = strs.length,
	    	reg = /['")-><&\\\/\.]/;

	    if(len>max) {
	    	cont.addClass('count_warn');
	    	cont.text(len+'/'+max);
	    }else {	  
	    	cont.removeClass('count_warn');  	
	    	cont.text(len+'/'+max);
	    }
    }
})(jQuery, window, document);