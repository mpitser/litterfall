define([
  'jquery',
  'underscore',
  'backbone',
  'collections/litterfall/selectionOptions'
], function($, _, Backbone, selectionOptions) {
	var selectionOptionsView = Backbone.View.extend({
    	template: "<li><a class='not-in-query <%= type %>' name='<%= value %>'><i class='icon-black icon-ok'></i><%= name %></a></li>",
    	initialize: function(){
    		_.bindAll(this, 'render'); // fixes loss of context for 'this' within methods
    		console.log(this);
    		
			this.collection.on('add', this.render); 
			this.collection.on('reset',  this.render);
    	},
    	render: function(){ 
    		//console.log(this.$el);
    		console.log(this.collection);
    		this.collection.each(function(option){
    			console.log(option.toJSON());
    			this.$el.append(_.template(this.template, option.toJSON()));
    		}, this);
    	}
	});
	return selectionOptionsView;
});
