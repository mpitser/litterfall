define([
  'jquery',
  'underscore',
  'backbone',
  'collections/selectionOptions'
], function($, _, Backbone, selectionOptions) {
	var selectionOptionsView = Backbone.View.extend({
    	template: '<option value="<%= value %>"><%= name %></option>',
    	initialize: function(){
    		//_.bindAll(this, 'render'); // fixes loss of context for 'this' within methods
			this.collection.on('add', this.render(this)); 
			this.collection.on('reset',  this.render(this));
    	},
    	render: function(){ 
    		this.collection.each(function(option){
    			console.log("eachhh");
    			this.$el.append(_.template(this.template, option.toJSON()));
    		}, this);
    	}
	});
	return selectionOptionsView;
});