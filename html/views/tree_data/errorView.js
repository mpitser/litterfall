define [
	'jquery',
  	'underscore',
  	'backbone'
], function($, _, Backbone) 
	var errorView = Backbone.View.extend({
		
		tagName: 'div',
		className: 'alert alert-error fade in',
		defaults: {
			title: "Error",
			message: "Hey, something just did go wrong."
		},
		initialize: function() {},
		render: function() {
		
			var has_xhr = this.options.xhr !== undefined;
		
			this.$el.html('<button type="button" class="close" data-dismiss="alert">&times;</button>\
			<h4>' + (has_xhr ? ("Error " + this.options.xhr.status + ": " + this.options.xhr.statusText) : this.options.title) + '</h4>\
			' + (has_xhr ? this.options.xhr.responseText : this.options.message) + '\
			');
		
			return this;
		}
		
	});
	return errorView;
});
