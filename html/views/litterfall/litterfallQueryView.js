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
		initialize: function(){	
			this.render();	
		},
		render: function() {
			console.log("in the litterfallQueryView");

			this.populateFields();
			$('.dropdown-toggle').dropdown();
			$('.query-options-dropdown').click({thisPtr: this}, this.queryListItem);
			$('.icon-remove').click(this.removeQueryItem); //DOESN"T WORK BLEAHHHH WHAY NOT?
			$('#analyze-data').click(this.queryOnSelectedItems);
			//$('.query-options-typeahead.observers').on('blur', this.validateObservers);
			$("#litterfall-records").tablesorter({headers: { 0: { sorter: false}}}); 


			return this;

		},
		populateFields: function () {
			this.populateSites();
			this.addObserversAutocomplete();
		},
		populateSites: function() {
			location_options = new selectionOptions;
			location_options.url = app.config.cgiDir + "tree_data.py?site=all";						//creates list with all possible locations
			console.log(location_options);
				
			var location_select = new selectionOptionsView({
				el: $('.query-options-dropdown.site'),																//populates new selectionOptionsView with locations (sites)
				collection: location_options
			});
						
			location_options.fetch();
		},
		addObserversAutocomplete: function() {
			//console.log("in autocomplete add");
			$.getJSON(app.config.cgiDir + '/litterfall.py?observers=all', function(data){
           	 	//console.log(data);
				$(".query-options-typeahead.observers").typeahead({
					minLength: 0,
					items: Infinity,
					source: data,
					jsonSource: data,
					type: "observer"
				});
				
				
   			});
		},
		events: {
			'click .icon-remove': 'removeQueryItem',
			//'change .query-options-typeahead.observers': 'validateObservers'
		},
		queryListItem: function(event) {
			console.log("in queryItem");
			console.log(event.target);

			// get the anchor tag for the list item clicked (make sure that the icon is not returned as the event target!)
			var $list_item_clicked = ( $(event.target).prop('tagName') == "I") ? $(event.target).parent() :  $(event.target);

			// get the value clicked and the type of query it is (i.e. 'Beech', which is a 'site' query)
			var query_value = $list_item_clicked.attr("name").toString();

			query_value = query_value.charAt(0).toUpperCase() + query_value.slice(1).replace("_", " ");
			var query_type = $list_item_clicked.attr('class').replace('not-in-query', '').replace('in-query', '').trim();
			console.log(query_value, query_type);
			
			// check if we are adding or removing a query item
			if ($list_item_clicked.attr('class').search('not-in-query') !== -1) {
				// the list item clicked *is not* currently in query
				event.data.thisPtr.listAddQueryItem($list_item_clicked, query_type, query_value);
			} else {
				// the list item clicked *is* currently in query
				event.data.thisPtr.listRemoveQueryItem($list_item_clicked, query_value);
			}
		},
		listAddQueryItem: function($list_item_clicked, query_type, query_value){
			// called when user selects item to be queried for from dropdown *list*
			var query_template = 
				'<button class="btn btn-info query-item ' + query_type + '" disabled="disabled" value="'+ query_value +'">\
					' + query_value + '\
					<a href="#data/litterfall/reports">\
						<i class="icon-black icon-remove"></i>\
					</a>\
				 </button>';
				   			 
			var $to_add = $(query_template).hide().fadeTo(500, 0.8);
			$('#query-items-selected').append($to_add);
					
			$list_item_clicked.addClass("in-query");
			$list_item_clicked.removeClass("not-in-query");
		},
		listRemoveQueryItem: function($list_item_clicked, query_value){
			// called when user selects item to be deleted from query for from dropdown *list*
			// the list item clicked *is* currently in query
			$list_item_clicked.removeClass("in-query");
			$list_item_clicked.addClass("not-in-query");
						
			var $to_remove = $('#query-items-selected > .btn-info:contains('+query_value+')');
			$to_remove.hide('slow', function() {
				$to_remove.remove();
			});
		},
		removeQueryItem: function(event) {
			// called when user clicks remove button from an item in the query well (not in dropdown list)
			console.log("in remove query item");
			var $to_remove = $(event.target).parent().parent();
						$to_remove.hide('slow', function() {
							$to_remove.remove();
						});
						var query_type = $to_remove.attr("class").replace("btn-info", "").replace("btn", "").trim();
						var $corresponding_list_item = $('.query-options-dropdown.'+query_type + ' > li > a:contains("'+$to_remove.val()+'")');
						$corresponding_list_item.removeClass("in-query");
						$corresponding_list_item.addClass("not-in-query");
		},
		queryOnSelectedItems: function() {
			console.log("abpout to query");
			console.log($(document).find(".query-item"));
			var query_string = ""
			$("#litterfall-records > tr").remove();
			$("#litterfall-records").show();
			$.getJSON('data/tree_species.json' + query_string, function(data){
				$.each(data, function(index, value) {
					var $row = $("<tr><td class='id'>" + index + "</td><td class='site'>" +value+ "</td><td class=plot>"+ value+"</td></tr>")
					$("#litterfall-records tbody").append($row);
				});			
				$("#litterfall-records").tableNav(); 

			});

		}
		/*,
		validateObservers: function() {
			console.log("in observer validation");
			var obs_entered = $('.query-options-typeahead.observers').val();
			var obs_allowed = $('.query-options-typeahead.observers').data("typeahead").source;
			//console.log(obs_entered);
			//console.log(obs_allowed);
			//console.log(obs_allowed.indexOf(obs_entered));
			if (obs_allowed.indexOf(obs_entered) == -1) {
				console.log("observer not in database");
				$('.query-options-typeahead.observers').parent().addClass("error");
				return false;
			}
			$('.query-options-typeahead.observers').parent().removeClass("error");
			return true;
		}*/
		
	});
	return litterfallQueryView;
});
