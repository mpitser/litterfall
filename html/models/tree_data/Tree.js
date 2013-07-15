/* 
Model: Tree
Represents: An otter?
----------------

Methods:
	initialize()	Nothing interesting...
	
	showError()		It shows errors in the console log
	
	plotViewInitialize()
					It initializes a plotRowView. Initializing a plotRowView will automatically
					render() the row and place it in the appropriate location.
					
	parse()			Format the data sent from the server before sending it to the constructor
	save()			Is overrode because I want the model to be up-to-date with the calculated
					data from the server side--for example, the tree_id that can only be known by
					querying the database
					
	destroy()		***THIS FUNCTION IS REALLY VULNERABLE*** Seriously, though. We cannot make it
					properly RESTful.
	
	validate()		Validates the data before saving. Might need to be rewritten. Its function is
					replaced mostly by the methods in Backbone Views. Not a neat thing to do I know.

*/
define([
	'jquery',
	'underscore',
	'backbone',
	'views/tree_data/plotRowUpdateView',
	'views/tree_data/plotRowReportsView',
	'views/tree_data/treeUpdateView',
	'views/tree_data/treeReportsView'
], function($, _, Backbone, plotRowUpdateView, plotRowReportsView, treeUpdateView, treeReportsView) {
	var Tree = Backbone.Model.extend({
		defaults: {
			site: '',
			plot: '',
			//_id: '', it is sort of crucial that this is commented out, trust me
			tree_id: -1,
			sub_tree_id: 0,
			angle: 0.0,
			distance: 0,
			diameter: [],
			species: 'Unknown',
			species_certainty: 0,
			status: "",
			dbh_marked: false,
			url: '',
			lat: 0,
			lng: 0,
			collection_type: 'tree'
		},
		initialize: function(){
			// this.editViewInitialize();
			this.on('invalid', this.showError);
		},
		showError: function(){
			//TODO show the validation error that is set in the validate method
			console.log(this.validationError);
		},
		plotViewInitialize: function(mode){
			if (mode == 'reports') {
				var plot_row = new plotRowReportsView({
					targetEl: $("#plot-table"),
					model: this
				});
			} else if (mode == 'update') {
				var plot_row = new plotRowUpdateView({
					targetEl: $("#plot-table"),
					model: this
				});
			}
		},
		editViewInitialize: function(mode){
			if (mode == 'reports') {
				var edit_form = new treeReportsView({
					el: $("#tree-edit-view"),
					model: this
				});
			} else if (mode == 'update') {
				var edit_form = new treeUpdateView({
					el: $("#tree-edit-view"),
					model: this
				});
			}
		},
		parse: function(response){
			
			// format full tree ID for display
			response.full_tree_id = response.tree_id + ((response.sub_tree_id == 0) ? '' : ('.' + response.sub_tree_id));
			
			// get latest status (dead or alive) and set to the model
			if (response.diameter.length > 0) {
				response.status = response.diameter[0].status;
			} else {
				response.status = "alive";
			}
			
			return response;
		},
		// overriding the save method, so that when the model saves it updates its inside to match what the server sends back
		save: function(attrs, options) {
			
			var result = Backbone.Model.prototype.save.call(this, attrs, options);
			
			var tree_model = this;
			if (result !== false) {
				result.done(function(data) {
					tree_model.set(data);
				});
			}
			
			return result;
		},
		// ** Normally, it would not have to go through save, but somehow destroy doesn't work
		// I think there is something wrong with the DELETE request method
		destroy: function(options) {
			
			var result = this.save({delete: true}, options);
			var tree_model = this;
			if (result !== false) {
				result.done(function() {
					console.log(tree_model.collection);
					tree_model.trigger('destroy', tree_model, tree_model.collection, options);
				});
			}
			return result;
		},
		validate: function(attrs, options){
			//this is where we validate the model's data
			var isInt = [];
			var isFloat = [];
		}
	});
	return Tree;
});
