define([
  'underscore',
  'backbone'
], function(_, Backbone) {	
	var singleOption = Backbone.Model.extend({
		initialize: function() {
		}
	});								//creates empty Model (to be a site, once information is loaded)
	return singleOption;
});