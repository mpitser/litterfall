define([ 
	'jquery',
	'underscore', 
	'backbone',
	'models/litterfall/litterfallQuery',
	'collections/litterfall/selectionOptions',
	'views/litterfall/selectionOptionsView',
	'views/litterfall/reportsView'
], function($, _, Backbone, litterfallQuery, selectionOptions, selectionOptionsView, reportsView){
	var litterfallQueryView = Backbone.View.extend({
	
		
		/* HELPFUL CODE: 
		
		these are things I wrote, then they either broke or I needed to move on because I got stuck.  if it's helpful read it, otherwise jsut gnore!
		
		//remove item using the actual x icons.
		var query_type = $to_remove.attr("class").replace("btn-info", "").replace("btn", "").trim();
		var $corresponding_list_item = $('.query-options-dropdown.'+query_type + ' > li > a:contains("'+$to_remove.val()+'")');
		$corresponding_list_item.removeClass("in-query");
		$corresponding_list_item.addClass("not-query");
		
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
			console.log("rendering the litterfallQueryView");

			/* populate fields*/
			this.populateSiteOptions();
			this.addObserversTypeahead();
			this.populateDataOptions();	
			this.populateTable();
			var dis = this;		
			
			/* initialize bootstrap plugin things */
			$('.dropdown-toggle').dropdown();
			$('.query-options-datepicker').datepicker({
				dateFormat: "mm/dd/yy", 
				maxDate: 0, 
				changeYear: true, 
				changeMonth: true, 
				yearRange: '2000:c', // allow years to be edited back to the start of collection, and up to current year
				//constrainInput: true,
				onSelect: function(dateText) {
					if ($(this).attr('id') == 'date-begin'){
						text = "All dates after " + dateText;
						dis.addQueryItem("date-begin", text);
					} else if ($(this).attr('id') == 'date-end'){
						text = "All dates before " + dateText;
						dis.addQueryItem("date-end", text);
					}
				}
			});
			
			/* bind events (idk why but i can't get events to bind to fxns in the backbone events delegation function..  */
			// add/remove a query item when the corresponding list item clicked
			$('.query-options.dropdown-menu').click({thisPtr: this}, this.queryListItem);
			// bind typeahead change
			$('#query-options-observers').on('change', function() {
				// when observers field changed, validation called
				var obs_to_add = dis.validateObservers();
				// if validation passes, add the value to the query well
				if (obs_to_add) {
					dis.addQueryItem('observer', obs_to_add);
					$('#query-options-observers').val('');	 // clear the field to the placeholder
				}
				
			});
			
			// start a query to the mongoDB
			$('#analyze-data').click(this.queryOnSelectedItems);
			
			// clear the query well of query items
			$('#clear-all').click(function() {
				dis.clearAll(dis, "all");
			});
			$('#hide-form').click(function() {
				$("#hide-form").hide();
				$("#show-form").show();
				$(".conditions").toggle();
			});
			$('#show-form').click(function() {
				$("#show-form").hide();
				$("#hide-form").show();
				$(".conditions").toggle();
			});

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
						
			location_options.fetch({success: function(){
				if (navigator.userAgent.indexOf("fox") != -1) {
					console.log("You should use a better browser.");
					$(".icon-ok").removeClass("pull-right");
					$(".icon-remove").removeClass("pull-right");

				}
			}});
		},
		
		populateDataOptions: function() {
			/* populates Data Type dropdown */			

			non_leaf_type_options = new selectionOptions({}, { id: "type" } );
				
			non_leaf_type_options.url = 'data/non_leaf_type_options.json';

			var non_leaf_type_select = new selectionOptionsView({
				el: $('#query-options-type'),																//populates new selectionOptionsView with locations (sites)
				collection: non_leaf_type_options
			});
			non_leaf_type_options.fetch({success: function(){
				$('#query-options-type').find(".not-query").addClass("non-leaf");
				$('#query-options-type').append('<li class="divider"></li>');
				console.log("whay?");
				
				leaf_type_options = new selectionOptions({}, { id: "type" } );
				
				leaf_type_options.url = 'data/leaf_type_options.json';

				var data_type_select = new selectionOptionsView({
					el: $('#query-options-type'),																//populates new selectionOptionsView with locations (sites)
					collection: leaf_type_options
				});
				leaf_type_options.fetch({success: function(){
					if (navigator.userAgent.indexOf("fox") != -1) {
						console.log("You should use a better browser.");
						$(".icon-ok").removeClass("pull-right");
						$(".icon-remove").removeClass("pull-right");
					}
				}});
			}});
		},
		populateTable: function() {
			$.getJSON("data/leaf_type_options.json", function(data){
				$.each(data, function(index, value) {
					$("#last").before("<th>"+value+"</th>")
				});
			});
		},
		addObserversTypeahead: function() {
			/* initializes and populates the typeahead for observers */

			$.getJSON(app.config.cgiDir + 'litterfall.py?observers=getList', function(data){
           	 	
           	 	// initialize the typeahead
				$("#query-options-observers").typeahead({
					minLength: 0,	// should make the typeahead open on focus instead of having to type anything
					items: Infinity,
					source: data,
					jsonSource: data,
					type: "observers"	// this field is used in conditional stuff in app.js (extension of the typeahead prototype) if you edit that!
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
			console.log($list_item_clicked);
			// get query value & query type 
			// (i.e. 'Beech', which is a 'site' query)
			var query_value = $list_item_clicked.attr("name").toString();
			query_value = query_value.charAt(0).toUpperCase() + query_value.slice(1).replace("_", " ");
			var query_type = $list_item_clicked.parent().parent().attr('class').replace('query-options', '').replace('dropdown-menu', '').trim();
						
			// check for checkall/clearall button click
			if ($list_item_clicked.hasClass("check-all")) {
				
				/* toggle list item from check all to clear all */
				$list_item_clicked.hide();
				var data_type = "";
				if ($list_item_clicked.hasClass("leaf")) {
					$("."+query_type+" > li > a.clear-all.leaf").show();
					data_type = ".leaf";
				} else if ($list_item_clicked.hasClass("non-leaf")) {
					$("."+query_type+" > li > a.clear-all.non-leaf").show();
					data_type = ".non-leaf";
				} else {
					$("."+query_type+" > li > a.clear-all").show();
				}

				/* add each item to query well and check in the dropdown */
				$("ul." + query_type + " > li > a.not-query" + data_type).each(function(index, li) {
					event.data.thisPtr.addQueryItem(query_type, li.name);
					$(li).addClass("in-query").removeClass("not-query");
				});
				
				return;
				
			} else if ($list_item_clicked.hasClass("clear-all")) {
				
				/* toggle list item from check all to clear all */
				$list_item_clicked.hide();
				if ($list_item_clicked.hasClass("leaf")) {
					$("."+query_type+" > li > a.check-all.leaf").show();
					$(".leaf.in-query").removeClass("in-query").addClass("not-query");

				} else if ($list_item_clicked.hasClass("non-leaf")) {
					$("."+query_type+" > li > a.check-all.non-leaf").show();
				} else {
					$("."+query_type+" > li > a.check-all").show();
				}
				
				/* clear all items from query well and unclick in dropdowns */
				event.data.thisPtr.clearAll(event.data.thisPtr, query_type);				
				
				return;
			}

			// check if we are adding or removing a query item
			if ($list_item_clicked.attr('class').search('not-query') !== -1) {
				// the list item clicked *is not* currently in query (so add it)
				event.data.thisPtr.addQueryItem( query_type, query_value);
				$list_item_clicked.removeClass("not-query").addClass("in-query");
			} else {
				// the list item clicked *is* currently in query (so remove it)
				event.data.thisPtr.removeQueryItem(event.data.thisPtr, query_type, query_value);
				$list_item_clicked.removeClass("in-query").addClass("not-query");
			}
		},
		clearAll: function(dis, type_to_clear) {
			if (type_to_clear == "all") {
				$.each($('.query-item'), function(index, value) {
					var query_type = value.className.split(/\s+/)[3];
					dis.removeQueryItem(dis, query_type, $(value).val());
				});
			} else {
				$.each($('.query-item.'+type_to_clear), function(index, value) {
					var query_type = value.className.split(/\s+/)[3];
					dis.removeQueryItem(dis, query_type, $(value).val());
				});
			}
		},
		addQueryItem: function(query_type, query_value) {
			var dis = this;

			// template for the button that shows up in query well
			var query_template = 
				'<button class="btn btn-info query-item ' + query_type + '" disabled="disabled" value="'+ query_value +'">' + query_value + ' <a href="#data/litterfall/reports"> <i class="icon-black icon-remove" href="#"></i></a></button>';
			if (query_type.indexOf("date") != -1){
				query_template = '<button class="btn btn-info query-item ' + query_type + '" disabled="disabled" value="'+ query_value.substring(query_value.length-10, query_value.length) +'">' + query_value + ' <a href="#data/litterfall/reports"> <i class="icon-black icon-remove" href="#"></i></a></button>';
				$to_remove = $("#query-items-selected > ." + query_type)
				$to_remove.hide('slow', function() {
					$to_remove.remove();
				});
				
			}
			// add to the query well with animation
			var $to_add = $(query_template).hide().fadeTo(500, 0.8);
			$('#query-items-selected').append($to_add);
			if (navigator.userAgent.indexOf("fox") != -1) {
				console.log("You should use a better browser.");
				$(".query-item > a").remove(); // get rid of x icons within query well.
			} else {
				$('.icon-remove').click(function() {
					console.log("remove clicked");
					event.preventDefault();
					dis.removeQueryItem(dis, query_type, $(this).parent().parent().val());
				});
			}
		},
		
		removeQueryItem: function(thisPtr, query_type, query_value) {
			// called when user clicks remove button from an item in the query well (not in dropdown list)

			var $to_remove = $('#query-items-selected > .btn-info:contains('+query_value+')');
			console.log($to_remove);
			$('#query-options-'+query_type+' > li > a:contains('+query_value+')').removeClass("in-query").addClass("not-query");
			$to_remove.hide('slow', function() {
				$to_remove.remove();
			});
			if ($('#query-options-'+query_type+' > li > a.all').hasClass("in-query")){
				$('#query-options-'+query_type+' > li > a.all').removeClass("in-query").addClass("not-query");
			
				var $to_remove = $('#query-items-selected > .btn-info.'+query_type);
				$to_remove.hide('slow', function() {
					$to_remove.remove();
				});
				// add all the other items to the query well (since "all" will no longer be listed but other items might still be selected
				var $to_add = $('#query-options-'+query_type+' > li > a.in-query');
				
				$to_add.each(function(i, v) {
					thisPtr.addQueryItem(query_type, $(v).attr("name").charAt(0).toUpperCase() + $(v).attr("name").slice(1).replace("_", " "));
				});
			}			
			
				
		},
		
		queryOnSelectedItems: function() {
			/* get the items that are in the query well.. should have .query-item class
			   then I guess ask the db? */
			$("#litterfall-table > tbody > tr").remove();
			$("#litterfall-table > thead > tr > th").show();
			$("#not-found").hide();

			var query_string = "";
			if ($(document).find(".query-item.plot") != [] && !($(document).find(".query-item.plot").hasClass('all'))) {
				var eachh = $(document).find(".query-item.plot");
				$.each(eachh, function(index, value) {
					query_string += "&plot=" + ($(value).val().replace("Plot ", ""));
				});	
			}
			if ($(document).find(".query-item.trap") != [] && !($(document).find(".query-item.trap").hasClass('all'))) {
				var eachh = $(document).find(".query-item.trap");
				$.each(eachh, function(index, value) {
					query_string += "&trap=" + ($(value).val().replace("Trap ", ""));
				});	
			}			
			var types = ["site", "date-begin", "date-end", "date", "observer", "type", "collection_type", "precipitation", "sky"];
			for (var i = 0; i < 9; i++) {
				var type = types[i];
				if ($(document).find(".query-item." + type) != []) {
					var eachh = $(document).find(".query-item." + type);
					$.each(eachh, function(index, val) {
						var value = $(val).val()
						if (value.indexOf("All") == -1 || value == "All reproductive") {
							query_string += "&" + type + "=" + value;
						}
					});
				}
			}
				
			query_string = query_string.replace("&", "?");				
			var row = new reportsView();
			row.render(query_string);
		},
		
		validateObservers: function() {
		
			//validation of observers so that they can't type in an observer that isn't already in the typeahead source			
			
			// get the array of observers in input box and extract most recently added observer
			var obs_entered = $('#query-options-observers').val();
			//console.log(obs_entered);

			// check observer entered against list of observers already existing in database
			var obs_allowed = $('#query-options-observers').data("typeahead").source;
			
			//console.log(obs_entered_array);
			//console.log(obs_entered);
			//console.log(obs_allowed.indexOf(obs_entered));
			
			// add error flag to input box if observer not allowed
			if (obs_allowed.indexOf(obs_entered) == -1) {
				//TODO fix this so it actually shows some sort of error
				$('#query-options-observers').parent().addClass("error");
				return false;
			}
			
			$('#query-options-observers').parent().removeClass("error");
			return obs_entered; 	// return the observer that needs to be added to the query well
		}
		
	});
	
	return litterfallQueryView;
});
