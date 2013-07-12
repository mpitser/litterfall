/*
Model: singleOption
Represents: an option that represents each site
--------------------

Well, there is nothing much, as you can probably see. It's essentially an empty model.

*/
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
