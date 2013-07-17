define([
  'underscore',
  'backbone'
], function(_, Backbone) {	
	var newObservation = Backbone.Model.extend({
		initialize: function() {
		}
	});								//creates empty Model (to be an observation, once information is loaded)
	return newObservation;
});
