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
		listen: $.fn.typeahead.Constructor.prototype.listen,
		render: $.fn.typeahead.Constructor.prototype.render
	};
  
	$.extend($.fn.typeahead.Constructor.prototype, {
		matcher: function(item) {
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
			} else if (this.options.type == 'observer') {
				//console.log(this.query);
				//console.log(this.options.source);
				//console.log(this.options.source.indexOf(this.query.toString()) != -1);
				//console.log(this.query == "");
				
				var is_matched = false;
				for (i in this.options.source) {
					if (this.options.source[i].toLowerCase().indexOf(this.query.toLowerCase()) == 0) is_matched = true;
				}
				
				//console.log(is_matched);
				if ((! is_matched) && (item != 'All Observers') && (this.query != "")) {
					this.$element.parent().addClass("error");
					this.$element.tooltip({title:"No such observer"}).tooltip("show");
					return false;
				} else {
					this.$element.parent().removeClass("error");
					this.$element.tooltip("destroy");
					return true;
				}
			
			} 
			return orig.matcher.call(this, item);
			
		},
		updater: function(item) {
			console.log("updater called");
			if (this.options.type != 'observers') {
				return orig.updater.call(this, item);
			}
			
			if (this.query.indexOf(",") == -1) return item+", ";
			
			return this.query.replace(/,[^,]*$/, ", "+item+", ");
			
		},
		select: function() {
			console.log("select called");
			if (this.options.type == 'observer') {
				this.$element.parent().removeClass("error");
				this.$element.parent().tooltip("destroy");
				return orig.select.call(this);
			} else if (this.options.type == 'species') {
				var to_return = orig.select.call(this);
				this.$element.focus();
				return to_return;
			} 
			return orig.select.call(this);

		},
		listen: function() {
			if ((this.options.type == 'species') || (this.options.type == 'observer')) {
				this.$element.on('focus', $.proxy(this.lookup, this));
				this.$menu.css({
					'overflow-x': 'hidden',
					'overflow-y': 'auto',
					'max-height': '150px',
					'min-width': this.$element.outerWidth()
				});
			}
			orig.listen.call(this);
		}/*,
		render: function(items) {
 			console.log(this.options.item);
     		for (i in items) {
     			console.log(items[i]);
     			if (items[i] == "All Observers") {
     				console.log(this.options.items[i]);
     				$(this.options.items[i]).attr("id", "default-value");
     				console.log(this.options.items[i]);
     			}
       			/*var i = $(that.options.item).attr('data-value', item);
       			i.find('a').html(that.highlighter(item));
       			return i[0];
    		}
 
     		//this.$menu.html(items);
     		
     		return orig.render.call(this);
		}*/
	});
  
    // Pass in our Router module and call it's initialize function
    Router.initialize();
  };

  return { 
    initialize: initialize
  };
});