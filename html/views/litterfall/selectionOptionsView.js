define([
  'jquery',
  'underscore',
  'backbone',
  'collections/litterfall/selectionOptions'
], function($, _, Backbone, selectionOptions) {
	var selectionOptionsView = Backbone.View.extend({
    	template: "<li><a class='not-in-query' name='<%= value %>'><%= name %><i class='icon-black icon-ok pull-right'></i></a></li>",
    	initialize: function(){
    		_.bindAll(this, 'render'); // fixes loss of context for 'this' within methods
    		console.log(this.collection);
    		
			this.collection.on('add', this.render); 
			this.collection.on('reset',  this.render);
    	},
    	render: function(){ 
    		//console.log(this.$el);
    		//console.log(this.collection);
    		this.collection.each(function(option){
    			//console.log(option.toJSON());
    			this.$el.append(_.template(this.template, option.toJSON()));
    		}, this);
    	}
	});
	return selectionOptionsView;
});
