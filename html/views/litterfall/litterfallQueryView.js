define([ 
	'jquery',
	'underscore', 
	'backbone',
	'models/litterfall/litterfallQuery',
	'collections/litterfall/selectionOptions',
	'views/litterfall/selectionOptionsView'
], function($, _, Backbone, litterfallQuery, selectionOptions, selectionOptionsView){
	var litterfallQueryView = Backbone.View.extend({
	
		
		// HELPFUL CODE: when writing remove item using the actual x icons.
		/*var query_type = $to_remove.attr("class").replace("btn-info", "").replace("btn", "").trim();
		var $corresponding_list_item = $('.query-options-dropdown.'+query_type + ' > li > a:contains("'+$to_remove.val()+'")');
		$corresponding_list_item.removeClass("in-query");
		$corresponding_list_item.addClass("not-in-query");
		
		$('#date-begin :input').on('change', function() {
			console.log("in fxn");
				if (dis.validateDate()) {
					dis.addDateQuery();
				} else {
					console.log("validation failed so I should do something like alert the user...");
				}
		});
		
		validateDate: function() {
			// return true if passes validation, false if fails
			console.log("in validating date");
			return true;
		},
		addDateQuery: function() {
			console.log("in adding date query");
		},
		
		
		
		*/


		tagName: 'div',
		initialize: function(){	
			this.render();	
		},
		render: function() {
			var dis = this;

			console.log("in the litterfallQueryView");

			this.populateFields();			
			
			/* initialize bootstrap plugin things */
			$('.dropdown-toggle').dropdown();
			$('.query-options-datepicker :input').datepicker({
				dateFormat: "mm/dd/yy", 
				maxDate: 0, 
				changeYear: true, 
				changeMonth: true, 
				yearRange: '2000:c', // allow years to be edited back to the start of collection, and up to current year
				//constrainInput: true,
				onSelect: function(dateText) {
					dis.addQueryItem("date", dateText)
				}
			});
			
			
			/* bind events */
			$('.query-options.dropdown-menu').click({thisPtr: this}, this.queryListItem);
			$('#analyze-data').click(this.queryOnSelectedItems);
			/* TODO fix this below that doesn't work. */
			$('.icon-remove').click(this.removeQueryItem); //DOESN"T WORK BLEAHHHH WHAY NOT?

			// bind typeahead change
			$('#query-options-observers').on('change', function() {
				if (dis.validateObservers()) {
					console.log("can add to well");
					var query_value =  $('#query-options-observers').siblings().find('.active').text();
					var query_type = 'observer';
					dis.addQueryItem(query_type, query_value);
				} else {
					console.log("need to add error message? actually I think it's done in validation already...");
				}
			});
			$('#date-specific').click(function() {
				$('#date-end').hide();
			});
			$('#date-range').click(function() {
				$('#date-end').show();
			});

			return this;
		},
		
		populateFields: function () {
			this.populateSiteOptions();
			this.addObserversAutocomplete();
			this.populateDataOptions();
	
		},
		
		populateSiteOptions: function() {
			/* populates Site dropdown */
			
			location_options = new selectionOptions;
////////////////////////////////////////////
//TODO: uncomment the call to the litterfall script and delete call to tree_data script once real data has been enetered.			
////////////////////////////////////////////		
			//location_options.url = app.config.cgiDir + "litterfall.py?site=getList";						//creates list with all possible locations
			location_options.url = app.config.cgiDir + "tree_data.py?site=all";
			console.log(location_options);
				
			var location_select = new selectionOptionsView({
				el: $('#query-options-site'),																//populates new selectionOptionsView with locations (sites)
				collection: location_options
			});
						
			location_options.fetch();
			console.log($('#query-options-site').find("li"));
			$('#query-options-site > button').addClass('site');
		},
		
		populateDataOptions: function() {
			/* populates Data Type dropdown */
			
			
				
				data_type_options = new selectionOptions({}, { id: "data-type" } );
				
				data_type_options.url = 'data/data_type_options.json';
								console.log(data_type_options);

				var data_type_select = new selectionOptionsView({
					el: $('#query-options-data-type'),																//populates new selectionOptionsView with locations (sites)
					collection: data_type_options
				});
				data_type_options.fetch();
			
			
			
			/*console.log(data_type_options);
				
			var data_type_select = new selectionOptionsView({
				el: $('.query-options-dropdown.data-type'),																//populates new selectionOptionsView with locations (sites)
				collection: data_type_options
			});
						
			location_options.fetch();*/
		},
		
		addObserversAutocomplete: function() {
			/* initializes and populates the typeahead for observers */

			// APPARENTLY THIS IS NONFUNCTIONAL BLEAHHH
			$.getJSON(app.config.cgiDir + 'litterfall.py?observers=getList', function(data){
				console.log(" in autoasdf");
           	 	// add All Observers as an option
           	 	data.splice(0, 0, "All Observers");
           	 	console.log(data);
           	 	
           	 	// initialize the typeahead
				$("#query-options-observers").typeahead({
					minLength: 0,
					items: Infinity,
					source: data,
					jsonSource: data,
					type: "observer"	// this field is used in conditional stuff in app.js (extension of the typeahead prototype) if you edit that!
				});
   			});
		},
		
		events: {
			/* NOT WORKING... not sure whyyy no events are bound here*/
			'click .icon-remove': 'removeQueryItem',
			//'change .query-options-typeahead.observers': 'validateObservers'
		},
		
		queryListItem: function(event) {
			/* called when any dropdown list item selected. */
			
			//console.log("in queryItem");
			//console.log(event.target);

			// which list item clicked ?  
			// (make sure that the icon is not returned as the event target!)
			var $list_item_clicked = ( $(event.target).prop('tagName') == "I") ? $(event.target).parent() :  $(event.target);

			// get value clicked & query type 
			// (i.e. 'Beech', which is a 'site' query)
			var query_value = $list_item_clicked.attr("name").toString();
			query_value = query_value.charAt(0).toUpperCase() + query_value.slice(1).replace("_", " ");
			console.log($list_item_clicked.parent().parent());
			var query_type = $list_item_clicked.parent().parent().attr('class').replace('query-options', '').replace('dropdown-menu', '').trim();
			//console.log(query_value, query_type);
			
			// check if we are adding or removing a query item
			if ($list_item_clicked.attr('class').search('not-in-query') !== -1) {
				// the list item clicked *is not* currently in query (so addit)
				event.data.thisPtr.addQueryItem( query_type, query_value);
				$list_item_clicked.addClass("in-query");
				$list_item_clicked.removeClass("not-in-query");
			} else {
				// the list item clicked *is* currently in query (so remove it)
				event.data.thisPtr.removeQueryItem(event.data.thisPtr, query_type, query_value);
				$list_item_clicked.removeClass("in-query");
				$list_item_clicked.addClass("not-in-query");
			}
		},
		addQueryItem: function(query_type, query_value) {
			if (query_value.search("All") != -1) {
				// take out all query well items that have same type
				var $btns_to_remove = $('#query-items-selected > button.'+query_type);
				var vals_to_remove = [];
				$btns_to_remove.each(function(i, val) {
					vals_to_remove.push($(val).val());
				});
				console.log(vals_to_remove);
				$btns_to_remove.hide('slow', function() {
					$btns_to_remove.remove();
				});
				$('#query-options-'+query_type+' > li > a.not-in-query').removeClass("not-in-query").addClass("in-query");
				// add query item for All (done below)
				// make all other items look clicked
				console.log($('#query-options-'+query_type+' > li > a'));
				// change All to Clear all
			}
		
			var query_template = 
				'<button class="btn btn-info query-item ' + query_type + '" disabled="disabled" value="'+ query_value +'">\
					' + query_value + '\
					<a href="#data/litterfall/reports">\
						<i class="icon-black icon-remove"></i>\
					</a>\
				 </button>';
				   			 
			var $to_add = $(query_template).hide().fadeTo(500, 0.8);
			$('#query-items-selected').append($to_add);
		},
		removeQueryItem: function(thisPtr, query_type, query_value) {
			// called when user clicks remove button from an item in the query well (not in dropdown list)
			console.log("in remove query item");
			if (query_value.search("All") != -1){
				// clear all from search
				$('#query-options-'+query_type+' > li > a.in-query').removeClass("in-query").addClass("not-in-query");
			} else if ($('#query-options-'+query_type+' > li > a.all').hasClass("in-query")){
				console.log("doing sthit)");
				$('#query-options-'+query_type+' > li > a.all').removeClass("in-query").addClass("not-in-query");
				var $to_remove = $('#query-items-selected > .btn-info.'+query_type);
					$to_remove.hide('slow', function() {
				$to_remove.remove();
				
				var $to_add = $('#query-options-'+query_type+' > li > a.in-query');
				
				$to_add.each(function(i, v) {
					//console.log(v);
					thisPtr.addQueryItem(query_type, $(v).attr("name"));
				});
			});
				console.log($('#query-options-'+query_type+' > li > a.in-query'));
			}
			// if all is selected, we need to unselect it and change class of all items that aren't in query..  otherwise just remove as usual
			
			var $to_remove = $('#query-items-selected > .btn-info:contains('+query_value+')');
			$to_remove.hide('slow', function() {
				$to_remove.remove();
			});
		},
		queryOnSelectedItems: function() {
			console.log("abpout to query");
			console.log($(document).find(".query-item"));
		},
		validateObservers: function() {
			console.log("in observer validation");
			var obs_entered = $('#query-options-observers').val();
			var obs_allowed = $('#query-options-observers').data("typeahead").source;
			//console.log(obs_entered);
			//console.log(obs_allowed);
			//console.log(obs_allowed.indexOf(obs_entered));
			if (obs_allowed.indexOf(obs_entered) == -1) {
				console.log("observer not in database");
				$('#query-options-observers').parent().addClass("error");
				return false;
			}
			$('#query-options-observers').parent().removeClass("error");
			return true;
		}
		
	});
	return litterfallQueryView;
});
