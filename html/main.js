// Filename: main.js

// Require.js allows us to configure shortcut alias
require.config({
  paths: {
    jquery: 'lib/jquery-min',
    underscore: 'lib/underscore-min',
    backbone: 'lib/backbone-min',
    templates: 'templates'
  },
  shim: {
        backbone: {
            deps: ['jquery','underscore'],
            exports: 'Backbone'
        },
         'underscore': {
            exports: '_'
        }
    }

});

var app = {
	config: {
		cgiDir: './cgi-bin/'
	}
};

<<<<<<< HEAD
require([
  // Load our app module and pass it to our definition function
  'app',

], function(App){
  // The "app" dependency is passed in as "App"
  // Again, the other dependencies passed in are not "AMD" therefore don't pass a parameter to this function
  App.initialize();
});

Date.prototype.toTreeDataDateObject = function() {
	return {
		'y': this.getFullYear(),
		'm': this.getMonth() + 1,
		'd': this.getDate()
	};
};

Date.prototype.fromTreeDataDateObject = function(date) {
	this.setFullYear(date.y);
	this.setMonth(date.m - 1);
	this.setDate(date.d);
};
var orig = {
    matcher: $.fn.typeahead.Constructor.prototype.matcher,
    updater: $.fn.typeahead.Constructor.prototype.updater,
    select: $.fn.typeahead.Constructor.prototype.select,
    listen: $.fn.typeahead.Constructor.prototype.listen
};
//app object contains global app information

// Start Active Nav Tracking

$(function(){
  $(".nav a").click(function(){
    $(this).parent().addClass('active'). // <li>
      siblings().removeClass('active');
  });
});
// End Active Nav Tracking

function toFormattedDate(date){
	
	var return_string = "";
	
	function looper(num, i, num_digit, string) {
		
		var this_digit = (num%(Math.pow(10,i)) - num%(Math.pow(10,i-1)))/Math.pow(10,i-1);
		
		string = this_digit + string;
		
		if (i == num_digit) return string;
		
		i++;
		return looper(num, i, num_digit, string);
	}
	
	return looper(date.m, 1, 2, "") + "/" + looper(date.d, 1, 2, "") + "/" + looper(date.y, 1, 4, "");
	
}

function htmlEntities(str) {
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/\'/g, '&#39;');
}
