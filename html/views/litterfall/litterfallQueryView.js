define([ 
	'jquery',
	'underscore', 
	'backbone',
	'models/litterfall/litterfallQuery',
	'collections/litterfall/selectionOptions',
	'views/litterfall/selectionOptionsView'
], function($, _, Backbone, litterfallQuery, selectionOptions, selectionOptionsView){
	var litterfallQueryView = Backbone.View.extend({
	
		
		/* HELPFUL CODE: 
		
		these are things I wrote, then they either broke or I needed to move on because I got stuck.  if it's helpful read it, otherwise jsut gnore!
		
		//remove item using the actual x icons.
		var query_type = $to_remove.attr("class").replace("btn-info", "").replace("btn", "").trim();
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

			console.log("in the litterfallQueryView");

			/* populate fields*/
			this.populateSiteOptions();
			this.addObserversAutocomplete();
			this.populateDataOptions();	
			
			var dis = this;		
			
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
			
			
			/* bind events (idk why but i can't get events to bind to fxns in the backbone events delegation function..  */
			// add/remove a query item when the corresponding list item clicked
			$('.query-options.dropdown-menu').click({thisPtr: this}, this.queryListItem);
			// bind typeahead change
			$('#query-options-observers').on('change', function() {
				// when observers field changed, validation called
				if (dis.validateObservers()) {
					// if validation passes, add the value to the query well
					var query_value =  $('#query-options-observers').siblings().find('.active').text();
					var query_type = 'observer';
					dis.addQueryItem(query_type, query_value);
				}
			});
			// show 1 or 2 datepicker input fields depending on radio buttons
			$('#date-specific').click(function() {
				$('#date-end').hide();
			});
			$('#date-range').click(function() {
				$('#date-end').show();
			});
			// start a query to the mongoDB
			$('#analyze-data').click(this.queryOnSelectedItems);

			return this;
		},
		populateSiteOptions: function() {
			/* populates Site dropdown */
			
			location_options = new selectionOptions;
////////////////////////////////////////////
//TODO:  once *real* data has been enteered into litterfall DB
//       change to comment-ed out version.  right now you only get Beech or something like that because all the sites aren't listed in the DB			
////////////////////////////////////////////		
			//location_options.url = app.config.cgiDir + "litterfall.py?site=getList";						//creates list with all possible locations
			location_options.url = app.config.cgiDir + "tree_data.py?site=all";
			//console.log(location_options);
				
			var location_select = new selectionOptionsView({
				el: $('#query-options-site'),																//populates new selectionOptionsView with locations (sites)
				collection: location_options
			});
						
			location_options.fetch();
		},
		
		populateDataOptions: function() {
			/* populates Data Type dropdown */			
				
			data_type_options = new selectionOptions({}, { id: "data-type" } );
				
			data_type_options.url = 'data/data_type_options.json';

			var data_type_select = new selectionOptionsView({
				el: $('#query-options-data-type'),																//populates new selectionOptionsView with locations (sites)
				collection: data_type_options
			});
			data_type_options.fetch();
			
		},
		
		addObserversAutocomplete: function() {
			/* initializes and populates the typeahead for observers */

			// APPARENTLY THIS IS NONFUNCTIONAL BLEAHHH -- could be in app.js, but I think the issue is that this getJSON call 
			// isn't going through and even getting any data... I can't get the console log to happen.
			$.getJSON(app.config.cgiDir + 'litterfall.py?observers=getList', function(data){
				console.log("haven't gotten to this log lately. if you see this be happy!");
           	 	
           	 	// add All Observers as an option
           	 	data.splice(0, 0, "All Observers");
           	 	
           	 	console.log(data);
           	 	
           	 	// initialize the typeahead
				$("#query-options-observers").typeahead({
					minLength: 0,	// should make the typeahead open on focus instead of having to type anything
					items: Infinity,
					source: data,
					jsonSource: data,
					type: "observer"	// this field is used in conditional stuff in app.js (extension of the typeahead prototype) if you edit that!
				});
   			});
		},
		
		events: {
			/* NOT WORKING... not sure whyyy no events are bound here... that's why they are all bound in render()*/
			//'click .icon-remove': 'removeQueryItem',
		},
		
		queryListItem: function(event) {
			/* called when any dropdown list item selected. */

			// which list item clicked ?  
			// (make sure that the icon is not returned as the event target! We need the Anchor tag.)
			var $list_item_clicked = ( $(event.target).prop('tagName') == "I") ? $(event.target).parent() :  $(event.target);

			// get query value & query type 
			// (i.e. 'Beech', which is a 'site' query)
			var query_value = $list_item_clicked.attr("name").toString();
			query_value = query_value.charAt(0).toUpperCase() + query_value.slice(1).replace("_", " ");
			var query_type = $list_item_clicked.parent().parent().attr('class').replace('query-options', '').replace('dropdown-menu', '').trim();
			
			// check if we are adding or removing a query item
			if ($list_item_clicked.attr('class').search('not-in-query') !== -1) {
				// the list item clicked *is not* currently in query (so add it)
				event.data.thisPtr.addQueryItem( query_type, query_value);
				$list_item_clicked.removeClass("not-in-query").addClass("in-query");
			} else {
				// the list item clicked *is* currently in query (so remove it)
				event.data.thisPtr.removeQueryItem(event.data.thisPtr, query_type, query_value);
				$list_item_clicked.removeClass("in-query").addClass("not-in-query");
			}
		},
		
		addQueryItem: function(query_type, query_value) {
		
			// add "All ___" 
			if (query_value.search("All") != -1) {
				
				// take out any query well items that have same type
				var $btns_to_remove = $('#query-items-selected > button.'+query_type);
				$btns_to_remove.hide('slow', function() {	// animation that makes them hide cool
					$btns_to_remove.remove();
				});
				// highlight each item in list as in the query
				$('#query-options-'+query_type+' > li > a.not-in-query').removeClass("not-in-query").addClass("in-query");
			}
		
			// template for the button that shows up in query well
			var query_template = 
				'<button class="btn btn-info query-item ' + query_type + '" disabled="disabled" value="'+ query_value +'">\
					' + query_value + '\
					<a href="#data/litterfall/reports">\
						<i class="icon-black icon-remove"></i>\
					</a>\
				 </button>';
				   			 
			// add to the query well with animation
			var $to_add = $(query_template).hide().fadeTo(500, 0.8);
			$('#query-items-selected').append($to_add);
			
		},
		
		removeQueryItem: function(thisPtr, query_type, query_value) {
			// called when user clicks remove button from an item in the query well (not in dropdown list)
			console.log("in remove query item");
			
			// "All ___" was unselected
			if (query_value.search("All") != -1){
				// clear all from search
				$('#query-options-'+query_type+' > li > a.in-query').removeClass("in-query").addClass("not-in-query");
				
			// if the "all" option is selected, when any other option is removed, the "all" option needs to be unselected!
			} else if ($('#query-options-'+query_type+' > li > a.all').hasClass("in-query")){
				$('#query-options-'+query_type+' > li > a.all').removeClass("in-query").addClass("not-in-query");
			
				var $to_remove = $('#query-items-selected > .btn-info.'+query_type);
				$to_remove.hide('slow', function() {
					$to_remove.remove();
				});
				
				// add all the other items to the query well (since "all" will no longer be listed but other items might still be selected
				var $to_add = $('#query-options-'+query_type+' > li > a.in-query');
				
				$to_add.each(function(i, v) {
					thisPtr.addQueryItem(query_type, $(v).attr("name"));
				});
			}			
			
			// default remove behavior
			var $to_remove = $('#query-items-selected > .btn-info:contains('+query_value+')');
			$to_remove.hide('slow', function() {
				$to_remove.remove();
			});
				
		},
		
		queryOnSelectedItems: function() {
			/* get the items that are in the query well.. should have .query-item class
			   then I guess ask the db? */
			
			console.log("analyze button clicked; about to query");
			console.log($(document).find(".query-item"));	// should be the items in query well
		},
		
		validateObservers: function() {
			/* validation of observers so that they can't type in an observer that isn't already in the typeahead source */
			//NOTE we do need to provide a way for new observers to be added...
			
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
