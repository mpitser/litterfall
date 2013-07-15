define([ 
	'jquery',
	'underscore', 
	'backbone',
	'models/litterfall/litterfallQuery',
	'collections/tree_data/selectionOptions',
	'views/litterfall/selectionOptionsView'
], function($, _, Backbone, litterfallQuery, selectionOptions, selectionOptionsView){
	var litterfallQueryView = Backbone.View.extend({
		tagName: 'div',
		template: '',
		initialize: function(){	
			this.render();	
		},
		render: function() {
			console.log("in the litterfallQueryView");
			this.populateFields();
			
		},
		populateFields: function () {
			location_options = new selectionOptions;
			location_options.url = app.config.cgiDir + "tree_data.py?site=all";						//creates list with all possible locations
			console.log(location_options);
				
			var location_select = new selectionOptionsView({
				el: $('.query-options.site'),																//populates new selectionOptionsView with locations (sites)
				collection: location_options
			});
						
			location_options.fetch();
		}
	});
	return litterfallQueryView;
});
