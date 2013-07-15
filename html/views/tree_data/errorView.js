/*
View: errorView
Model: (none)
-------------------

Creates a Bootstrap-styled alert to tells the user of the error encountered
Takes in an jqXHR object as an option. Will generate the error alert according to
the status of the jqXHR object and its responseText
*/
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
		render: function() {
			
			if (this.options.targetId !== undefined) $('#'+targetId).remove();
			
			// check if the jqXHR object is specified
			// (since Backbone uses AJAX it will send back jqXHR when it is successful or encounters some error
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
