define([
  'jquery', 
  'underscore', 
  'backbone',
  'router' // Request router.js
], function($, _, Backbone, Router){
  var initialize = function(){
  
	var orig = {
		matcher: $.fn.typeahead.Constructor.prototype.matcher,
		updater: $.fn.typeahead.Constructor.prototype.updater,
		select: $.fn.typeahead.Constructor.prototype.select,
		listen: $.fn.typeahead.Constructor.prototype.listen
	};
  
	$.extend($.fn.typeahead.Constructor.prototype, {
		matcher: function(item) {
			//console.log(this.source);
			if (this.options.type == 'observers') {
				var observers = this.query.split(",");
				var last_observer = observers[observers.length - 1];
				var last_observer = last_observer.replace(/^\s+/,"");
				
				if (last_observer == "") return false;
				
				for (i = 0; i < observers.length - 2; i++) {
					if (observers[i].replace(/^\s+|\s+$/g, '') == item) return false;
				}
				
				var last_observer = last_observer.toLowerCase();
				
				return last_observer.length && ~item.toLowerCase().indexOf(last_observer);
			} else if (this.options.type == 'species') {
				
				var is_matched = item.toLowerCase().indexOf(this.query.toLowerCase()) == 0;
				if (is_matched) return true;
				
				// always keep unidentified as an option
				if (item == 'Unidentified spp.') return true;
				
				// keep Genus spp. as an option--if the genus matches the query
				var query_genus = this.query.split(" ")[0];
				var item_genus = item.split(" ")[0];
				if (query_genus.toLowerCase() == item_genus.toLowerCase() && item.toLowerCase() == query_genus.toLowerCase() + " spp.") return true;
				
				return false;
			} else {
				return orig.matcher.call(this, item);
			}
		},
		updater: function(item) {
			
			if (this.options.type != 'observers') {
				return orig.updater.call(this, item);
			}
			
			if (this.query.indexOf(",") == -1) return item+", ";
			
			return this.query.replace(/,[^,]*$/, ", "+item+", ");
			
		},
		select: function() {
			
			if (this.options.type != 'observers') {
				return orig.select.call(this);
			}
			
			var to_return = orig.select.call(this);
			this.$element.focus();
			return to_return;
			
		},
		listen: function() {
			if (this.options.type == 'species') {
				this.$element.on('focus', $.proxy(this.lookup, this));
				this.$menu.css({
					'overflow-x': 'hidden',
					'overflow-y': 'auto',
					'max-height': '150px',
					'min-width': this.$element.outerWidth()
				});
			}
			orig.listen.call(this);
		}
	});
  
    // Pass in our Router module and call it's initialize function
    Router.initialize();
  };

  return { 
    initialize: initialize
  };
});