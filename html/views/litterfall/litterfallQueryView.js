define([ 
	'jquery',
	'underscore', 
	'backbone',
	'models/litterfall/litterfallQuery',
	'collections/litterfall/selectionOptions',
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
			$('.dropdown-toggle').dropdown();
			$('.query-options').click({thisPtr: this}, this.queryItem);
			
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
		},
		events: {
			'click .query-options': 'queryItem'
		},
		queryItem: function(event) {
			console.log("in queryItem");
			console.log(event.target);
			// get the anchor tag for the list item clicked (make sure that the icon is not returned as the event target!)
			var $list_item_clicked = ( $(event.target).prop('tagName') == "I") ? $(event.target).parent() :  $(event.target);

			// get the value clicked and the type of query it is (i.e. 'Beech', which is a 'site' query)
			var query_value = $list_item_clicked.attr("name");
			var query_type = $list_item_clicked.attr('class').replace('not-in-query', '').replace('in-query', '').trim();
			console.log(query_value, query_type);
			
			// check if we are adding or removing a query item
			if ($list_item_clicked.attr('class').search('not-in-query') !== -1) {
				// the list item clicked *is not* currently in query
				event.data.thisPtr.addQueryItem($list_item_clicked, query_type, query_value);
			} else {
				// the list item clicked *is* currently in query
				event.data.thisPtr.removeQueryItem($list_item_clicked, query_value);
			}
		},
		addQueryItem: function($list_item_clicked, query_type, query_value){
			var query_template = 
				'<button class="btn btn-info ' + query_type + '" disabled="disabled" value="'+ query_value +'">\
					' + query_value + '\
					<a href="#litterfall">\
						<i class="icon-black icon-remove"></i>\
					</a>\
				 </button>';
				   			 
			var $to_add = $(query_template).hide().fadeTo(500, 0.8);
			$('#query-items-selected').append($to_add);
					
			$list_item_clicked.addClass("in-query");
			$list_item_clicked.removeClass("not-in-query");
		},
		removeQueryItem: function($list_item_clicked, query_value){
			// the list item clicked *is* currently in query
			$list_item_clicked.removeClass("in-query");
			$list_item_clicked.addClass("not-in-query");
						
			var $to_remove = $('#query-items-selected > .btn-info:contains('+query_value+')');
			$to_remove.hide('slow', function() {
				$to_remove.remove();
			});
		}
	});
	return litterfallQueryView;
});
