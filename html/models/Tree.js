define([
	'jquery',
	'underscore',
	'backbone',
	'views/plotRowUpdateView',
	'views/plotRowReportsView',
	'views/treeUpdateView',
	'views/treeReportsView'
], function($, _, Backbone, plotRowUpdateView, plotRowReportsView, treeUpdateView, treeReportsView) {
	var Tree = Backbone.Model.extend({
		defaults: {
			site: '',
			plot: '',
			//_id: '',
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
			
			// sort, the latest goes to the top
		//	response.diameter = _.sortBy(response.diameter, function (entry) {
				//console.log(entry);
		//		return 0 - (entry.date.d + entry.date.m*32 + entry.date.y*366);
		//s	});
			// format full tree ID for display
			response.full_tree_id = response.tree_id + ((response.sub_tree_id == 0) ? '' : ('.' + response.sub_tree_id));
			
			// get latest status (dead or alive) and set to the model
			if (response.diameter.length > 0) {
				//alert(response.diameter[0].status);
				response.status = response.diameter[0].status;
			} else {
				response.status = "alive";
			}
			
			
		//	var newEntryArray = [];
			
		//	console.log(response.diameter);
		//	_.each(response.diameter, function(entry, key) {
		//		console.log(new Date(response.diameter[key].date.$date));
			//	response.diameter[key].date = new Date(response.diameter[key].date.$date);
		///		console.log(response.diameter[key]);
		//		console.log(response.diameter[key].date.getFullYear());
		//	});
			
			return response;
		},
		// overriding the save method, so that when the model saves it updates its inside to match what the server sends back
		save: function(attrs, options) {
			
			var result = Backbone.Model.prototype.save.call(this, attrs, options);
			
			tree_model = this;
			result.done(function(data) {
				
				tree_model.set(data);
				
			});
			
			return result;
		},
		// ** Normally, it would not have to go through save, but somehow destroy doesn't work
		// I think there is something wrong with the DELETE request method
		destroy: function(options) {
			return this.save({delete: true}, options);
		},
		validate: function(attrs, options){
			//this is where we validate the model's data
			var isInt = [];
			var isFloat = [];
		},
		/*
		newSubTreeRowViewInitialize: function() {
			var sub_tree_row = new newSubTreeRowView({
				model: this
			});
		}
		*/
	});
	return Tree;
});