define([
  'jquery',
  'underscore',
  'backbone'
], function($, _, Backbone) {
	var selectionOptionsView = Backbone.View.extend({
    	template: '<option value="<%= value %>"><%= name %></option>',
    	initialize: function(){
    		_.bindAll(this, 'render'); // fixes loss of context for 'this' within methods
    		console.log(this.el);
			this.collection.on('add', this.render); 
			this.collection.on('reset',  this.render);
    	},
    	render: function(){ 
    		this.collection.each(function(option){
    			this.$el.append(_.template(this.template, option.toJSON()));
    		}, this);
    	}
	});
	return selectionOptionsView;
});
