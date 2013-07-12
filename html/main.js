// Filename: main.js

// Require.js allows us to configure shortcut alias
require.config({
  paths: {
    jquery: 'lib/jquery-min',
    underscore: 'lib/underscore-min',
    backbone: 'lib/backbone-min',
    templates: 'templates'
  },
  shim: {
        backbone: {
            deps: ['jquery','underscore'],
            exports: 'Backbone'
        },
         'underscore': {
            exports: '_'
        }
    }

});

var app = {
	config: {
		cgiDir: './cgi-bin/'
	}
};

<<<<<<< HEAD
require([
  // Load our app module and pass it to our definition function
  'app',
=======
Date.prototype.toTreeDataDateObject = function() {
	return {
		'y': this.getFullYear(),
		'm': this.getMonth() + 1,
		'd': this.getDate()
	};
};

Date.prototype.fromTreeDataDateObject = function(date) {
	this.setFullYear(date.y);
	this.setMonth(date.m - 1);
	this.setDate(date.d);
};

var orig = {
    matcher: $.fn.typeahead.Constructor.prototype.matcher,
    updater: $.fn.typeahead.Constructor.prototype.updater,
    select: $.fn.typeahead.Constructor.prototype.select,
    listen: $.fn.typeahead.Constructor.prototype.listen
};

$.extend($.fn.typeahead.Constructor.prototype, {
	matcher: function(item) {
		
		// Matcher function for observers typeahead
		if (this.options.type == 'observers') {
			
			// split the query from the field
			var observers = this.query.split(",");
			// get the last observer
			var last_observer = observers[observers.length - 1];
			// trim the query
			var last_observer = last_observer.replace(/^\s+/,"");
			
			// if empty, don't show the autocomplete
			if (last_observer.length == 0) return false;
			
			// not matching the observer already entered
			for (i = 0; i < observers.length - 1; i++) {
				if (observers[i].replace(/^\s+|\s+$/g, '').toLowerCase() == item.toLowerCase()) return false;
			}
			
			// case insensitive
			var last_observer = last_observer.toLowerCase();
			
			// find whether the item has the last observer
			return ~item.toLowerCase().indexOf(last_observer);
		} else if (this.options.type == 'species') {
			
			// matched only when the first characters match
			var is_matched = item.toLowerCase().indexOf(this.query.toLowerCase()) == 0;
			if (is_matched) return true;
			
			// always keep unidentified as an option
			if (item == 'Unidentified spp.') return true;
			
			// keep Genus spp. as an option--if the genus matches the query
			var query_genus = this.query.split(" ")[0];
			var item_genus = item.split(" ")[0];
			if (query_genus.toLowerCase() == item_genus.toLowerCase() && item.toLowerCase() == query_genus.toLowerCase() + " spp.") return true;
			
			// if all else fails, then no, it doesn't match
			return false;
		} else {
			// if it's a normal typeahead, then call the original function
			return orig.matcher.call(this, item);
		}
	},
	updater: function(item) {
		
		if (this.options.type != 'observers') {
			return orig.updater.call(this, item);
		}
		
		if (this.query.indexOf(",") == -1) return item+", ";
		
		return this.query.replace(/,[^,]*$/, ", "+item+", ");
		
	},
	select: function() {
		
		if (this.options.type != 'observers') {
			return orig.select.call(this);
		}
		
		var to_return = orig.select.call(this);
		this.$element.focus();
		return to_return;
		
	},
	listen: function() {
		if (this.options.type == 'species') {
		
			// bind focus to lookup, so that the menu shows up even though user still has not typed in anything
			this.$element.on('focus', $.proxy(this.lookup, this));
			
			// style the menu
			// i'm doing it here just because listen is called every time typeahead is constructed
			// though structure-wise and semantically it does not make sense
			// (binding focus above makes sense though!
			this.$menu.css({
				'overflow-x': 'hidden',
				'overflow-y': 'auto',
				'max-height': '150px',
				'min-width': this.$element.outerWidth()
			});
		}
		
		orig.listen.call(this);
	}
});
>>>>>>> 114965f2c73617ad50225567f71de2a374addc3b

<<<<<<< HEAD
$(document).ready(function(){
	require.config({});
	
    //The global router declaration, handles all of the app's URLs
	var AppRouter = Backbone.Router.extend({
        routes: {
            "data": "accessObservations", //inits the add record "wizard", leads to the edit pages
            "data/update": "accessObservations", //inits the add record "wizard", leads to the edit pages
            "data/reports": "accessObservations",
            "data/update/trees/site/:location/plot/:plot": "goToPlot",
            "data/reports/trees/site/:location/plot/:plot": "goToPlot",
          	//"update/trees/site/:location/plot/:plot/treeid/new": "newTree",
            "data/update/trees/site/:location/plot/:plot/treeid/:treeid/subtreeid/new": "newSubTree",
            "data/update/trees/site/:location/plot/:plot/treeid/:treeid(/subtreeid/:subTreeId)": "goToTree",
            "data/reports/trees/site/:location/plot/:plot/treeid/:treeid(/subtreeid/:subTreeId)": "goToTree",
            "*actions": "defaultRoute" // Backbone will try match the route above first
        }
	});

	//build an options list
	var selectionOptionsView = Backbone.View.extend({
    	template: '<option value="<%= value %>"><%= name %></option>',
    	initialize: function(){
    		 _.bindAll(this, 'render'); // fixes loss of context for 'this' within methods
			 this.collection.on('add', this.render); 
			 this.collection.on('reset',  this.render);
    	},
    	render: function(){
    		this.collection.each(function(option){
    			this.$el.append(_.template(this.template, option.toJSON()));
    		}, this);
    	}
	});

<<<<<<< HEAD
=======
	//build a Bootstrap modal
	var newTreeModal = Backbone.View.extend({
		tagName: 'div',
		className: 'modal hide fade',
		id: 'add-new-tree-modal',
		template: '\
		<div class="modal-header">\
			<button type="button" class="close" data-dismiss="modal" aria-hidden="true">&times;</button>\
			<h3>Add a new tree</h3>\
		</div>\
		<div class="modal-body" style="overflow-y:visible;">\
			<form class="form-horizontal">\
				<div class="control-group">\
					<label class="control-label" for="new-tree-species">Species</label>\
					<div class="controls">\
						<input type="text" id="new-tree-species" placeholder="Species" style="font-style: italic;">\
						<small class="help-inline"></small>\
						<span class="help-block"></span>\
					</div>\
				</div>\
				\
				<div class="control-group">\
					<label class="control-label" for="new-tree-angle">Angle</label>\
					<div class="controls">\
						<input type="text" id="new-tree-angle" placeholder="Angle">\
						<small class="help-inline">Degrees</small>\
						<span class="help-block"></span>\
					</div>\
				</div>\
				\
				<div class="control-group">\
					<label class="control-label" for="new-tree-distance">Distance</label>\
					<div class="controls">\
						<input type="text" id="new-tree-distance" placeholder="Distance">\
						<small class="help-inline">Meters</small>\
						<span class="help-block"></span>\
					</div>\
				</div>\
			</form>\
		</div>\
		<div class="modal-footer">\
			<a class="btn btn-danger" data-dismiss="modal">Cancel</a>\
			<a class="btn btn-save-and-back">Save and Go Back</a>\
			<a class="btn btn-primary btn-save-and-update">Save and Add Observations</a>\
		</div>\
		',
		initialize: function() {
			this.isSubTree = this.model.get('tree_id') > 0;
			this.render();
		},
		render: function() {
			// Usual stuff

			this.$el.html(_.template(this.template, {}));

			// This is a bit ugly--to be fixed later
			if (this.isSubTree) {
				this.$el.find(".modal-header h3").html("Add a new sub-tree <small>Tree ID:  "+this.model.get("tree_id")+"</small>");
				this.$el.find("#new-tree-species").tooltip({title: "The species of all sub-trees should be the same, no?"})
					.attr("disabled", "disabled").val(this.model.get("species"));
				this.$el.find('#new-tree-angle').val(this.model.get("angle"));
				this.$el.find('#new-tree-distance').val(this.model.get("distance"));

			}

			// Append it to the body
			$("body").append(this.el);
			this.$el.modal();

			// Add autocomplete to the species field
			this.addAutocomplete();

			var self = this;

			// Remove the model when done
			this.$el.on("hidden", function() {
				$(this).remove();
				if (self.isSubTree) {
					$('.add-new-sub-tree').eq(0).trigger("not_choosing_parent_tree");
				}
			});

			return this;

		},
		addAutocomplete: function() {
			// get the species list from the text file and populate array
        	$.getJSON('data/tree_species.json', function(data){
           	 	
           	 	// Add autocomplete
				$("#new-tree-species").typeahead({
					minLength: 0,
					items: Infinity,
					source: data,
					jsonSource: data,
					type: "species"
				});
				
				
   			});
		},
		events: {
			'click .btn-save-and-back': function() {
				this.addAndSaveTree(true);
			},
			'click .btn-save-and-update': function() {
				this.addAndSaveTree(false);
			},
			'blur #new-tree-angle': 'validateAngle',
			'blur #new-tree-distance': 'validateDistance',
			'change #new-tree-species': 'validateSpecies'
		},
		validateSpecies: function() {

			var $species = $('#new-tree-species');
			var $all_species = $species.data("typeahead").source;
			//console.log($all_species);
			//console.log($species.val());

			var error = false;

			if ($species.val() == '') {
				error = "This cannot be empty";
			} else if ($.inArray($species.val(), $all_species) == -1) {
				$species.val("Unidentified, spp.");
				console.log($species);
				error = "The species entered did not match a species name on file.  It has been given a species name of Unidentified.  If this is an error, please edit your entry to choose one of the options or contact the professor.";
			}

			return this.addErrorMessage($species, error);

		},
		validateAngle: function() {

			var $angle = $('#new-tree-angle');

			// It should only be numbers
			var number_regex = /^[0-9]*$/;

			var error = false;

			if ($angle.val() == '') {
				error = "This cannot be empty.";
			} else if (!number_regex.test($angle.val())) {
				error = "An angle should be a number.";
			} else if (parseInt($angle.val()) > 360 || parseInt($angle.val()) < 0) {
				error = "It should be between 0-360 degrees!";
			}

			return this.addErrorMessage($angle, error);

		},
		validateDistance: function() {
			var $distance = $('#new-tree-distance');

			var error = false;

			if ($distance.val() == '') {
				error = "This cannot be empty.";
			} else if (isNaN(parseFloat($distance.val()))) {
				error = "A distance should be a number...";
			} else if (parseInt($distance.val()) > 30 || parseInt($distance.val()) < 0) {
				error = "Do you think it is a bit too far?";
			}

			return this.addErrorMessage($distance, error);

		},
		addErrorMessage: function($target, error) {
			if (error !== false) {
				$target.parent().parent().removeClass("success").addClass("error");
				$target.parent().find(".help-block").text(error);
				return false;
			} else {
				$target.parent().parent().removeClass("error").addClass("success");
				$target.parent().find(".help-block").empty();
				return true;
			}
		},
		addAndSaveTree: function(back_to_plot) {

			// Set the URL--don't you think we should not have to specify the URL every time we call the server?
			this.model.url = app.config.cgiDir + 'tree_data.py';
			var self = this;
			
			this.model.validate = function() {
				if (!(self.validateAngle() && self.validateDistance() && self.validateSpecies())) {
					return "Invalid data";
				}
				
			};
			
			this.model.on("invalid", function() {
				$('#add-modal .error').eq(0).focus();
			});

			// save!
			this.model.save({
				species: $('#new-tree-species').val(),
				angle: parseInt($('#new-tree-angle').val()),
				distance: parseInt($('#new-tree-distance').val())
			}, {
				success: function(model) {
					self.$el.modal("hide");
					if (back_to_plot == true) {
						/* if (self.isSubTree === true) {
							$(".add-new-sub-tree").trigger("click");
						} */
						self.trigger("tree_saved");
					} else {
						app_router.navigate(document.location.hash + "/treeid/" + model.get("tree_id") + (self.isSubTree ? ("/subtreeid/" + model.get("sub_tree_id")) : ""), {trigger: true});
					}
				},
				error: function(model, xhr) {
					
					var saveTreeError = new errorView({xhr: xhr});
					saveTreeError.render().$el.prependTo("#add-new-tree-modal > .modal-body");
					
				}
			});

		}
	});

>>>>>>> 114965f2c73617ad50225567f71de2a374addc3b
	//build a row in the plot table representing a tree
	var plotRowView = Backbone.View.extend({
		tagName: 'tr',
		templateReports: '\
			<td class="btn-column">\
				<button class="btn-tree btn btn-mini btn-primary btn-analyze" type="button">View More</button>\
			</td>\
			<td class="tree-id">\
				<%= tree.full_tree_id %>\
			</td>\
			<td>\
				<%= tree.species %>\
			</td>\
			<td>\
				<%= tree.angle %>\
			</td>\
			<td>\
				<%= tree.distance %>\
<<<<<<< HEAD
=======
			</td>\
			<td>\
			<% var status_display = ""; %>\
			<% if (tree.status == "alive") { %>\
			<%		status_display = "Alive"; %>\
			<%	} else if (tree.status == "dead_standing"){ %>\
			<%		status_display = "Dead (standing)"; %>\
			<%	} else if (tree.status == "dead_fallen"){ %>\
			<%		status_display = "Dead (fallen)"; %>\
			<% } %>\
				<%= status_display %>\
>>>>>>> 114965f2c73617ad50225567f71de2a374addc3b
			</td>',
		templateUpdate:	'\
			<td>\
				<div class="btn-group">\
					<button class="btn-tree btn btn-mini btn-primary btn-update" type="button">Update</button>\
					<button class="btn btn-mini dropdown-toggle btn-primary" data-toggle="dropdown">\
						<span class="caret"></span>\
					</button>\
					<ul class="dropdown-menu">\
						<li><a style="cursor:pointer;" class="delete-row">Delete</a></li>\
					</ul>\
				</div>\
			</td>\
			<td>\
				<%= tree.full_tree_id %>\
			</td>\
			<td>\
				<%= tree.species %>\
			</td>\
			<td>\
				<%= tree.angle %>\
			</td>\
			<td>\
				<%= tree.distance %>\
			</td>\
			<td>\
				<%= tree.thisDiameter %> on <%= tree.thisDate.replace(/^([0-9]{4})([0-9]{2})([0-9]{2})$/, "$2/$3/$1") %>\
			</td>\
			<td>\
				<%= tree.thisComment %>\
			</td>',
		initialize: function(){
			if (document.location.hash.search("update") === -1) {
				this.renderReport();
			} else {
				this.renderUpdate();
			}
		},
		renderReport: function(){
<<<<<<< HEAD
			var thisTree = this.model.toJSON();
			
			//$el --> gets the jQuery object for this view's element 
			//*.attr('id', thisTree._id.$oid) --> sets 'id' to MongoDB value for tree's ID
			//takes the tree's data, assigns it to this.template, inserts the HTML into the jQuery object for this view's element
			this.$el.attr('id', thisTree._id.$oid).html(_.template(this.templateReports, {tree: thisTree}));
			this.$el.addClass("tree-cluster-" + thisTree.tree_id);
			this.$el.children().eq(2).css("font-style","italic");
			this.options.targetEl.append(this.el);	
			
			/*thisTree.diameter2 = "-";
			thisTree.diameter3 = "-";
			thisTree.diameter4 = "-";
			thisTree.diameter5 = "-";
			thisTree.diameter6 = "-";
			thisTree.diameter7 = "-";
			thisTree.diameter8 = "-";
			thisTree.diameter9 = "-";
			thisTree.diameter10 = "-";
			thisTree.diameter11 = "-";
			thisTree.diameter12 = "-";
			thisTree.diameter13 = "-";*/
			
			// find start and end Year by select buttons
			// make that number of columns
			// if tree has entry, add it, otherwise just add -
			
			var start_year = $('#start-year').val();
			var end_year = $('#end-year').val();
			
			var thisRow = $(this.el);
			// for each 
			//var x = thisRow[0].insertCell(-1);
			//x.innerHTML="newcell";
			//$("<td>3</td>").appendTo(thisRow);
			//console.log(thisRow);
			console.log(thisTree);
			var entryAdded = false;
			//console.log(thisTree.diameter);
			//console.log("this--", this);
			$("#sub-header").children().each(function(index, value){
				//console.log($('tbody :nth-child('+index+')'));
				// this is the year of the column $(value).text());
				for (i in thisTree.diameter){
					//console.log(thisTree.diameter[i].year);
					//console.log($(value).text());
					if (thisTree.diameter[i].year === parseInt($(value).text())) {
						// add diameter entry as cell to the thingy
						//console.log($('tr:nth-child('+index+')'));
						//console.log(thisTree);
						//$('tr:nth-child('+index+')').append($("<td></td>").attr("value", thisTree.diameter[i].value).text(thisTree.diameter[i].value));
						$("<td></td>").attr("value", thisTree.diameter[i].value).text(thisTree.diameter[i].value).appendTo(thisRow);

						//onsole.log(this);
						entryAdded = true;
						break;
						// add comment as the value for hovering
					} 
				}
				if (entryAdded == false) {
						//$('tr:nth-child('+index+')').append($("<td></td>").attr("value", "no entry").text("-"));
						$("<td></td>").attr("value", "no entry").text("-").appendTo(thisRow);

				}
				entryAdded=false;
			});
			/*for (col in yearCols) {
				for (i in thisTree.diameter){
					if (thisTree.diameter[i].year == colYear) {
						// add diameter entry as cell to the thingy
						// add comment as the value for hovering
					}
				}
				//if (row cell is not existing(based on year in subheader col)?) {
				//	add a cell with just "-"
				//}
			}*/
			/*for (i in thisTree.diameter){                      //loop through the list of existing dates and store the most recent
				console.log(thisTree.diameter[i].year);
					
					if (thisTree.diameter[i].year >= start_year && thisTree.diameter[i].year <= end_year) {
						// add diameter entry as cell to the thingy
					} else {
						
					}
				
				//if (thisTree.diameter[i].date !== null){console.log(new Date(thisTree.diameter[i].date['$date']).getFullYear())}
				if (date.slice(0,4) === '2002') {
				<td class="date-entry 2013">\
				<%= tree.diameter13 %>\
			</td>'
					thisTree.diameter2 = thisTree.diameter[date].value;
				} else if (date.slice(0,4) === '2003') {
					thisTree.diameter3 = thisTree.diameter[date].value;
				} else if (date.slice(0,4) === '2004') {
					thisTree.diameter4 = thisTree.diameter[date].value;
				} else if (date.slice(0,4) === '2005') {
					thisTree.diameter5 = thisTree.diameter[date].value;
				} else if (date.slice(0,4) === '2006') {
					thisTree.diameter6 = thisTree.diameter[date].value.toFixed(2);
				} else if (date.slice(0,4) === '2007') {
					thisTree.diameter7 = thisTree.diameter[date].value;
				} else if (date.slice(0,4) === '2008') {
					thisTree.diameter8 = thisTree.diameter[date].value;
				} else if (date.slice(0,4) === '2009') {
					thisTree.diameter9 = thisTree.diameter[date].value;
				} else if (date.slice(0,4) === '2010') {
					thisTree.diameter10 = thisTree.diameter[date].value;
				} else if (date.slice(0,4) === '2011') {
					thisTree.diameter11 = thisTree.diameter[date].value;
				} else if (date.slice(0,4) === '2012') {
					thisTree.diameter12 = thisTree.diameter[date].value;
				} else if (date.slice(0,4) === '2013') {
					thisTree.diameter13 = thisTree.diameter[date].value;
				}*/
			//}
			
			
=======
			var this_tree = this.model.toJSON();
			
			//$el --> gets the jQuery object for this view's element 
			//*.attr('id', this_tree._id.$oid) --> sets 'id' to MongoDB value for tree's ID
			//takes the tree's data, assigns it to this.template, inserts the HTML into the jQuery object for this view's element
			this.$el.attr('id', this_tree._id.$oid).html(_.template(this.templateReports, {tree: this_tree}));
			this.$el.addClass("tree-cluster-" + this_tree.tree_id);
			this.$el.children().eq(2).css("font-style","italic");
			this.options.targetEl.append(this.el);
			
			// find start and end Year by select buttons

			// if tree has entry, add it, otherwise just add -
		      
			var start_year = $('#start-year').val();
			var end_year = $('#end-year').val();
		 
			var this_row = $(this.el);
		        
			var entry_added = false;
			
			/*
			var unique_year_entries = _.uniq(this_tree.diameter, true, function(entry) {
				return 0 - entry.date.y;
			});
			*/

			$("#sub-header").children().each(function(index, value){

				for (i in this_tree.diameter){
					// this is the year of the column $(value).text());
					if (this_tree.diameter[i].date.y === parseInt($(value).text())) {
						$("<td></td>").addClass("date-entry y-"+$(value).text()).attr("value", this_tree.diameter[i].value).text(this_tree.diameter[i].value).appendTo(this_row);
						entry_added = true;
						break;
					}
				}
				// if no entry for that date was found, add a '-' in that cell
				if (entry_added == false) {
					$("<td></td>").addClass("date-entry y-"+$(value).text()).attr("value", "no entry").text("-").appendTo(this_row);
				}
				// reset variable for next year
				entry_added=false;
			});
>>>>>>> 114965f2c73617ad50225567f71de2a374addc3b
				
		},
		renderUpdate: function(){
			var thisTree = this.model.toJSON();
			thisTree.thisDate = "";
			for (date in thisTree.diameter){                      //loop through the list of existing dates and store the most recent
				if (date > thisTree.thisDate){					  //Date format is YYYYMMDD (reformated in template html above)
					thisTree.thisDate = date;
				}
			}

			if (Object.keys(thisTree.diameter).length > 0){
				thisTree.thisDiameter = thisTree.diameter[thisTree.thisDate].value;    //gets diameter from most recent measurement
				thisTree.thisComment = thisTree.diameter[thisTree.thisDate].notes;     //gets comments from most recent measurement
			}
			
			
			//$el --> gets the jQuery object for this view's element 
			//*.attr('id', thisTree._id.$oid) --> sets 'id' to MongoDB value for tree's ID
			//takes the tree's data, assigns it to this.template, inserts the HTML into the jQuery object for this view's element
			this.$el.attr('id', thisTree._id.$oid).html(_.template(this.templateUpdate, {tree: thisTree}));
			this.$el.addClass("tree-cluster-" + thisTree.tree_id);
			this.$el.children().eq(2).css("font-style","italic");
			this.options.targetEl.append(this.el);	

		},
		events: {
			'click .delete-row': 'deleteTree',
			'click .btn-update': 'goToTree',								//if update button is clicked, runs updateTree function
			'click .btn-analyze': 'goToTree'								//if update button is clicked, runs updateTree function
		},
		goToTree: function(){
			//goto update tree page
			var subId = this.model.get("sub_tree_id");
			var treeUrl = "/treeid/" + this.model.get("tree_id") + ((subId) ? '/subtreeid/' + subId : '');
			app_router.navigate(document.location.hash + treeUrl, {trigger: true});
		},
		deleteTree: function(){
<<<<<<< HEAD
			var thisTreeEl = this.$el;
			this.model.url = app.config.cgiDir + 'litterfall.py';
			var result = this.model.destroy();
			if (result !== false) {
=======

			// ask the user whether they're absolutely sure...
			var $alert_modal = $('<div></div>').addClass("modal hide face").attr({
				'tabindex': '-1',
				'role': 'dialog',
				'aria-labelledby': 'dialog',
				'aria-hidden': 'true'
			}).html('\
				<div class="modal-header">\
					<h3>This tree will be gone forever.</h3>\
				</div>\
				<div class="modal-body">\
					<p>Take a deep breathe and think carefully. This tree will never return once it is gone. Are you sure you want to get rid of it?</p>\
				</div>\
				<div class="modal-footer">\
					<button class="btn" data-dismiss="modal" aria-hidden="true">No&mdash;sorry, tree</button>\
					<button class="btn btn-danger" id="no-remorse">Yes&mdash;sorry, tree</button>\
				</div>\
			');

			$('body').append($alert_modal);
			$alert_modal.modal();
			$alert_modal.modal('show');
			var is_user_sure = true;
			$alert_modal.on('hidden', function() {
				$alert_modal.remove();
			});

			var self = this;

			$alert_modal.find('#no-remorse').on('click', function() {
				$alert_modal.modal("hide");
				self.deleteTreeFunction();
			});

		},
		deleteTreeFunction: function() {

			var this_tree_el = this.$el;
			this.model.url = app.config.cgiDir + 'tree_data.py';
			var result = this.model.destroy({
>>>>>>> 114965f2c73617ad50225567f71de2a374addc3b
			
				thisModel = this.model;
				
				result.done(function() { // once done
					
					thisTreeEl.fadeOut("slow", function() {						//function called after fadeOut is done
						
						// remove the row--we need this because if we just hide (using visibility:hidden) the row then the table-stripe class will not work
						$("#"+thisModel.get('_id').$oid).remove();
						
						var targetTreeId = thisModel.get('tree_id');
						
						// update all the trees under the same tree_id
						$(".tree-cluster-"+targetTreeId).each(function(i) {
						
							// only the full_tree_id would be updated
							var updatedTree = new Tree();
							
							// grab the second child
							var fullTreeIdTd = $(this).children('td').eq(1);
							var targetFullTreeId = parseInt(parseFloat(fullTreeIdTd.text())*10);
							console.log(targetFullTreeId);
							
							// get the data
							// using oid, because that's the only way it's stable
<<<<<<< HEAD
							updatedTree.url = app.config.cgiDir + 'litterfall.py?oid=' + $(this).attr('id');
							updatedTree.fetch({
=======
							updated_tree.url = app.config.cgiDir + 'tree_data.py?oid=' + $(this).attr('id');
							updated_tree.fetch({
>>>>>>> 114965f2c73617ad50225567f71de2a374addc3b
								success: function() {
									console.log(updatedTree);
									// update it, only the full tree id, for now
									console.log("tree_id: " + updatedTree.get('tree_id'));
									updatedFullTreeId = updatedTree.get('tree_id') + (updatedTree.get('sub_tree_id') * .1);
									console.log(updatedFullTreeId);
									if (targetFullTreeId * .1 != updatedFullTreeId) {
										fullTreeIdTd.text(updatedFullTreeId);
									}
							}
							});
							
						});
						
					});
				});
			}
		}
	});

	// Adding new row for inserting a new tree
	var newTreeRowView = Backbone.View.extend({
		tagName: 'tr',
		template: '\
			<td>\
				<div class="new-tree btn-group"><button class="btn-save-new-tree btn btn-mini btn-success" type="button">Submit</button>\
				<button class="btn-cancel-new-tree btn btn-mini btn-danger" type="button">Cancel</button>\
				</div>\
			</td>\
			<td>\
			</td>\
			<td>\
				<span class="species"><select></select></span>\
			</td>\
			<td class="editable">\
				<span class="edit_cell new_tree angle"><input value="" title="Angle must be a number between 0 and 360." type="text"></input></span>\
			</td>\
			<td class="editable">\
				<span class="edit_cell new_tree distance"><input value="" title="Distance must be a number between 0 and 1000." type="text"></input></span>\
			</td>\
			<td>\
			</td>\
			<td>\
		</td>',
		initialize: function() {
			this.render();
		},
		render: function(){
			//caling the template
			this.$el.html(this.template);
			//prepend the new tree row to the table
			$(".tree-row-goaway").remove();
			$(".sub-tree-row-goaway").remove();
			this.$el.addClass("tree-row-goaway");
			this.options.targetEl.prepend(this.el);
			$("#plot-table > tbody > tr:first .edit_cell").show();

			this.postRender();
		},
		postRender: function() {
			this.populateSpecies();
		},
		populateSpecies: function(){
			// creates list of all distinct species to fill dropdown menu
			$.getJSON(app.config.cgiDir + 'litterfall.py?site=allSpecies', function(data) {
			
				$.each(data, function(index, value) {
					$("#plot-table .species select").append($("<option></option>").attr("value",value).text(value));
				});

<<<<<<< HEAD
			});
		},
		events: {
			'click .btn-save-new-tree': 'saveTree',
			'click .btn-cancel-new-tree': 'deleteRow',
			'change .new_tree': 'validateField'

		},
		saveTree: function() {
			//calculate treeID
			//save tree to database
			var plotNumber = $(".plot-number").text();
			var siteName = $(".site-name").text();
			
			// create a new Tree object and set the data
			var newTree = new Tree();
			newTree.url = app.config.cgiDir + 'litterfall.py';
			newTree.set({
				"plot": parseInt(plotNumber),
				"site": siteName,
				"tree_id": -1, // -1 means it's new
				'species': $("#plot-table .species select").val(),
				'angle': parseInt($("#plot-table .angle input").val(), 10),
				'distance': parseFloat($("#plot-table .distance input").val(), 10),
				'diameter': {},
				'dead': false
			});
			if (! (this.validateDistance() && this.validateAngle())){
				console.log("didn't save");
				return; // user will remain in edit view until their data passes validation
			}

			// save the new tree
			var result = newTree.save({}, {
				'success': function(data) {if (result != null){ console.log(result);
					app_router.navigate(document.location.hash + "/treeid/" + newTree.get("tree_id"), {trigger: true});
				}}
			});
			
		},
		validateField: function(event){

			var fieldToValidate = event.currentTarget.className;
			console.log(fieldToValidate);
			/* if angle field lost focus */
			if (fieldToValidate == "edit_cell new_tree angle"){		
				this.validateAngle();
			/* if distance field lost focus */				
			} else if (fieldToValidate == "edit_cell new_tree distance"){
				this.validateDistance();
			} else {
				return;
			}

		},
		validateAngle: function() {

			// get angle entry
			var angleEntered = parseFloat($("#plot-table .angle input").val());

			// make sure the angle is in correct format and range
			if (isNaN(angleEntered)|| angleEntered < 0 || angleEntered > 360) {
				console.log("returned NaN");
				$(".edit_cell.new_tree.angle :input").tooltip(); // NOTE: the text shown on the tooltip is listed as the title attribute of the template for NewTreeRiwView.
				$(".edit_cell.new_tree.angle :input").tooltip("show");				
				$(".edit_cell.new_tree.angle :input").addClass("alert_invalid");
				return false;
			} else { 
				$(".edit_cell.new_tree.angle :input").removeClass("alert_invalid");
				$(".edit_cell.new_tree.angle :input").tooltip("destroy");
				console.log("angle validation passed");
				return true;
			}
		},
		validateDistance: function() {

			// get distance entry
			var distanceEntered = parseFloat($("#plot-table .angle input").val());

			// make sure the distance is in correct format and range
			if (isNaN(distanceEntered) || distanceEntered < 0 || distanceEntered > 999) {
				console.log("returned NaN");
				$(".edit_cell.new_tree.distance :input").tooltip(); // NOTE: the text shown on the tooltip is listed as the title attribute of the template for NewTreeRowView.
				$(".edit_cell.new_tree.distance :input").tooltip("show");				
				$(".edit_cell.new_tree.distance :input").addClass("alert_invalid");
				return false;
			} else { 
				$(".edit_cell.new_tree.distance :input").removeClass("alert_invalid");
				$(".edit_cell.new_tree.distance :input").tooltip("destroy");
				console.log("distance validation passed");
				return true;
			}
		},
		deleteRow: function() {
			
			this.$el.fadeOut("slow", function() {
				$(this).remove();
=======
				}, 
				error: function(model, xhr) {
					
					var deleteTreeError = new errorView({xhr: xhr, id: "delete-tree-error"});
					deleteTreeError.render().$el.insertAfter($("h1").eq(0));
					
				}
>>>>>>> 114965f2c73617ad50225567f71de2a374addc3b
			});
		}
	});

	// Adding new row for inserting a new SUBtree
	var newSubTreeRowView = Backbone.View.extend({
		tagName: 'tr',
		template: '\
			<td>\
				<div class="new-tree btn-group"><button class="btn-save-new-subtree btn btn-mini btn-success" type="button">Submit</button>\
				<button class="btn-cancel-new-subtree btn btn-mini btn-danger" type="button">Cancel</button>\
				</div>\
			</td>\
			<td class="tree-id">\
			\
			</td>\
			<td>\
				<%= tree.species %>\
			</td>\
			<td>\
				<%= tree.angle %>\
			</td>\
			<td>\
				<%= tree.distance %>\
			</td>\
			<td>\
			</td>\
			<td>\
		</td>',
		initialize: function() {
			this.render();
		},
		render: function(){

			var thisTree = this.model.toJSON();
			//console.log("What's thisTree?");
			//console.log(thisTree);
			this.$el.html(_.template(this.template, {tree: thisTree}));

			//delete all the other ones so user can't add multiple subtrees at once
			$(".sub-tree-row-goaway").remove();
			$(".tree-row-goaway").remove();
			this.$el.addClass("sub-tree-row-goaway");
			//insert the new tree row to the table next to its fellow subtrees
			$('.tree-cluster-'+thisTree.tree_id).eq(-1).after(this.el);
			
			$('html, body').animate({
				scrollTop: $(".sub-tree-row-goaway").offset().top-100
			}, 2000);

		},

		events: {
			'click .btn-save-new-subtree': 'saveSubtree',
			'click .btn-cancel-new-subtree': 'deleteRow'
		},
		saveSubtree: function() {
			var newSubTree = new Tree();
			
			newSubTree.url = app.config.cgiDir + 'litterfall.py';
			
			// sets newSubTree's information to match the parent tree's information
			newSubTree.set({
				"plot": parseInt($(".plot-number").text()),
				"site": $(".site-name").text(),
				"tree_id": this.model.get("tree_id"),
				"sub_tree_id": -1,
				"species": this.model.get("species"),
				"angle": this.model.get("angle"),
				"distance": this.model.get("distance"),
				"diameter": {},
				"dead": false
			});

			result = newSubTree.save({}, {success: function() {
				//redirect to page where user can add entries for the newSubTree
				app_router.navigate(document.location.hash + "/treeid/" + newSubTree.get("tree_id") + "/subtreeid/" + newSubTree.get("sub_tree_id"), {trigger: true});
			}});
			
						
		}, 

		deleteRow: function() {
			this.$el.remove();
		}
	});

	//build a row in the plot table representing a tree
	var treeEditView = Backbone.View.extend({
		tagName: 'div',
		templateReport: '\
		<div id="tree-info">\
			<ul>\
				<li>Species: <span class="display-tree-info species"><%= tree.species %></span><span class="edit-tree-info species"><select></select></span></li>\
				<li>Angle Degrees: <span class="display-tree-info angle"><%= tree.angle %></span><span class="edit-tree-info angle"><input value="<%= tree.angle %>"></input></span></li>\
				<li>Distance Meters: <span class="display-tree-info distance"><%= tree.distance %></span><span class="edit-tree-info distance"><input value="<%= tree.distance %>"></input></span></li>\
			</ul>\
		</div>\
		<table id="tree_observations" class="table-striped tablesorter">\
			<thead>\
				<tr>\
					<th>Date</th>\
					<th>Observers</th>\
					<th>\
						DBH (cm) <a href="#" class="dbh" rel="tooltip" data-placement="top" data-original-title="Diameter at Breast Height"><small>info</small></a>\
					</th>\
					<th>\
						Comments\
					</th>\
				</tr>\
			</thead>\
			<tbody>\
			<% _.each(tree.datesDesc, function(date){ %>\
			<tr>\
				<td><span class="display_cell date_select"><%= date.replace(/^([0-9]{4})([0-9]{2})([0-9]{2})$/, "$2/$3/$1") %></span>\
				<input type="hidden" class="formatted_date" value="<%= date %>"></span></td>\
				<td><span class="display_cell observers"><%= tree.diameter[date].observers %></span>\
				<td><span class="display_cell diameter"><%= tree.diameter[date].value %></span>\
				<td><span class="display_cell notes"><%= tree.diameter[date].notes %></span>\
			</tr>\
			<% }); %>\
			</tbody>\
			</table>\
		',
		templateUpdate: '\
		<div id="tree-info">\
			<button class="btn btn-success btn-mini edit-tree-info-btn">Edit Tree Info</button>\
			<div class="edit-tree-info btn-group"><button class="btn-save-tree-info btn btn-mini btn-success" type="button">Submit</button>\
			<button class="btn-cancel-tree-info btn btn-mini btn-danger" type="button">Cancel</button>\
			</div>\
			<ul>\
				<li>Species: <span class="display-tree-info species"><%= tree.species %></span><span class="edit-tree-info species"><select></select></span></li>\
				<li>Angle Degrees: <span class="display-tree-info angle"><%= tree.angle %></span><span class="edit-tree-info angle"><input value="<%= tree.angle %>"></input></span></li>\
				<li>Distance Meters: <span class="display-tree-info distance"><%= tree.distance %></span><span class="edit-tree-info distance"><input value="<%= tree.distance %>"></input></span></li>\
			</ul>\
		</div>\
		<div class="button-row">\
			<button class="btn-new-observation btn btn-mini btn-success pull-left" type="button">+ New Entry</button>\
		</div>\
		<table id="tree_observations" class="table-striped tablesorter">\
			<thead>\
				<tr>\
					<th class="btn-column"></th>\
					<th>Date</th>\
					<th>Observers</th>\
					<th>\
						DBH (cm) <a href="#" class="dbh" rel="tooltip" data-placement="top" data-original-title="Diameter at Breast Height"><small>info</small></a>\
					</th>\
					<th>\
						Comments\
					</th>\
				</tr>\
			</thead>\
			<tbody>\
			<% _.each(tree.datesDesc, function(date){ %>\
			<tr>\
				<td class="btn-column">\
					<button class="display_cell btn btn-mini btn-primary edit-existing" type="button">Edit</button>\
					<div class="edit_cell btn-group"><button class="btn-save-observation btn btn-mini btn-success" type="button">Submit</button>\
					<button class="btn-cancel-observation btn btn-mini btn-danger" type="button">Cancel</button>\
				</td>\
				<td class="editable"><span class="display_cell date_select"><%= date.replace(/^([0-9]{4})([0-9]{2})([0-9]{2})$/, "$2/$3/$1") %></span><span class="edit_cell date_select"><input title="Enter a date in mm/dd/yyyy format.  It may not already have an associated diameter entry or be in the future." type="text" value="<%= date.replace(/^([0-9]{4})([0-9]{2})([0-9]{2})$/, "$2/$3/$1") %>"/>\
				<input type="hidden" class="formatted_date" value="<%= date %>"></span></td>\
				<td class="editable"><span class="display_cell observers"><%= tree.diameter[date].observers %></span><span class="edit_cell observers"><input title="Observers field may not be empty." type="text" value="<%= tree.diameter[date].observers %>"></span></td>\
				<td class="editable"><span class="display_cell diameter"><%= tree.diameter[date].value %></span><span class="edit_cell diameter"><input title = "Please enter an integer or floating point number such as 5, 6.1, 10.33" type="text" value="<%= tree.diameter[date].value %>"></span></td>\
				<td class="editable"><span class="display_cell notes"><%= tree.diameter[date].notes %></span><span class="edit_cell notes"><input type="text" value="<%= tree.diameter[date].notes %>"></span></span></td>\
			</tr>\
			<% }); %>\
			</tbody>\
			</table>\
			<div class="button-row">\
				<button class="btn-new-observation btn btn-mini btn-success pull-left" type="button">+ New Entry</button>\
			</div>\
		',
		initialize: function(){
		console.log("here");
			if (document.location.hash.search("update") === -1) {
				this.renderReport();
<<<<<<< HEAD
				//this.model.on('change', this.renderReport, this); //re-render when the model is saved (new observation, or an edit)
			} else {
				this.renderUpdate();
				//this.model.on('change', this.renderUpdate, this); //re-render when the model is saved (new observation, or an edit)
=======
				// this.model.on('change', this.renderReport, this); //re-render when the model is saved (new observation, or an edit)
			} else {
				this.renderUpdate();
				//this.model.on('change', this.renderUpdate, this.model); //re-render when the model is saved (new observation, or an edit)
>>>>>>> 114965f2c73617ad50225567f71de2a374addc3b
			}
		},
		renderReport: function(){
			//console.log('render report tree');
			var thisTree = this.model.toJSON();
			//get the dates in descending order
			thisTree.datesDesc = _.keys(thisTree.diameter).sort().reverse();
			this.$el.html(_.template(this.templateReport, {tree: thisTree}));
			$(".title").text("Analyzing Tree Data ");
<<<<<<< HEAD
			$("#tree_observations").tablesorter(); 
			$('.back').click(function(){
				console.log("clicked once");
				//console.log(document.location.hash.slice(0, document.location.hash.search("/treeid")));
				app_router.navigate(document.location.hash.slice(0, document.location.hash.search("/treeid")), {trigger: true});
			});
			this.postRender();
=======
			$("#tree-observations").tablesorter();
>>>>>>> 114965f2c73617ad50225567f71de2a374addc3b
		},
		renderUpdate: function(){
			//console.log('render edit');
			var thisTree = this.model.toJSON();
			//get the dates in descending order
			thisTree.datesDesc = _.keys(thisTree.diameter).sort().reverse();
			this.$el.html(_.template(this.templateUpdate, {tree: thisTree}));
			$(".title").text("Updating Tree Data ");
<<<<<<< HEAD
			$("#tree_observations").tablesorter({headers: { 0: { sorter: false}}}); 
			$('.back').click(function(){
							console.log("clicked once");

			console.log(document.location.hash.slice(0, document.location.hash.search("/treeid")));
				app_router.navigate(document.location.hash.slice(0, document.location.hash.search("/treeid")), {trigger: true});
			});
=======
			$("#tree-observations").tablesorter({headers: { 0: { sorter: false}}}); 
			$(".show-obs-info").show();
			$(".edit-obs-info").hide();
>>>>>>> 114965f2c73617ad50225567f71de2a374addc3b
			this.postRender();
		},
		postRender: function(){
			//add any methods/functions that need to be call after redendering the Tree edit view
			this.populateSpecies();
		},
		populateSpecies: function(){
			var treeSpecies = this.model.get('species');
			//console.log(treeSpecies);
			//??
			$.getJSON(app.config.cgiDir + 'litterfall.py?site=allSpecies', function(data) {
				$.each(data, function(index, value) {
					if (value == treeSpecies) {
						$(".species select").append($("<option></option>").attr("value",value).attr("selected", "selected").text(value));
					} else {
						$(".species select").append($("<option></option>").attr("value",value).text(value))
					}
				});
			});

		},
		events: {
			'click .btn-new-observation': 'newObservation',	
			'click .edit-existing': 'editObservation',
			'click .btn-save-observation': 'saveObservation',
			'click .btn-cancel-observation': 'cancelEditObservation',
			'click .edit-tree-info-btn': 'editTreeInfo',
			'click .btn-cancel-tree-info': 'cancelEditTreeInfo',
			'click .btn-save-tree-info': 'saveTreeInfo',
			'change .edit_cell': 'validateField'
		},
		editTreeInfo: function(){
			$('.edit-tree-info-btn').toggle();
			$('.display-tree-info').toggle();
			$('.edit-tree-info').toggle();
		},
		cancelEditTreeInfo: function(){
			$('.edit-tree-info-btn').toggle();
			$('.display-tree-info').toggle();
			$('.edit-tree-info').toggle();
		},
		saveTreeInfo: function(){
			this.model.set({
				'species': $("#tree-info .species select").val(),
				'angle': parseInt($("#tree-info .angle input").val(), 10),
				'distance': parseFloat($("#tree-info .distance input").val(), 10)
			});
			this.model.save();
		},
		newObservation: function(){
			//add a new blank row to the observation table
			var diameters = _.clone(this.model.get('diameter')); //must clone object to update it
			var today = new Date();
			var todayDateKey = [today.getFullYear(),((today.getMonth() < 9) ? 0 : ""),(today.getMonth() + 1),((today.getDate() < 10) ? 0 : ""),today.getDate()].join(""); //yes it generates the date in YYYYMMDD format
			// if today's date already has an entry, set a template dateKey using tomorrow's date (which the user will be forced to change to pass validation)
<<<<<<< HEAD
			diameters[(diameters[todayDateKey] == undefined) ? todayDateKey : (parseInt(todayDateKey) + 1)] = {
					value: 'n/a',
					notes: "",
					observers: ""
			};
			this.model.set({"diameter": diameters});


			// Disable all the fields from being editing
			$("#tree_observations .btn.display_cell").hide();

			// Show edit content, hide display content, show "Submit/cancel button", add date_picker		
			$("#tree_observations > tbody > tr:first .edit_cell").show();
			$("#tree_observations > tbody > tr:first .display_cell").hide();
			$("#tree_observations > tbody > tr:first .edit_cell.date_select :input" ).datepicker({ altFormat: "yymmdd" , altField: "#tree_observations > tbody > tr .formatted_date" , maxDate: 0 , changeYear: true , changeMonth: true , constrainInput: true});	
			var existingObs = this.model.findAllObservers();
			$("#tree_observations > tbody > tr:first .edit_cell.observers :input").autocomplete({source: existingObs});
=======
			var new_entry = {
				date: today.toTreeDataDateObject(),
				year: today.getFullYear(),
				value: 'n/a',
				notes: "",
				observers: [],
				status: ""
			};
			
			// new jQuery row to be prepended
			// class="new" to mark the row as new
			var $new_entry_row = $('<tr></tr>').addClass("new").html(_.template(this.rowEntryTemplateUpdate, {entry: new_entry, tree: this.model}));
			// prepend new row to the table
			$('#tree-observations tbody').prepend($new_entry_row);
			
			// set status as last recorded status by default
			// or active if no entries are recorded yet
			var last_known_status = ((this.model.get("diameter")[0] !== undefined) ? this.model.get("diameter")[0].status : "alive")
			$new_entry_row.find("."+last_known_status).addClass("active");
			
			//show correct fields for editing
			$new_entry_row.find(".edit-obs-info").show();
			$new_entry_row.find(".edit_cell").show();
			$new_entry_row.find(".display_cell").hide();
			$new_entry_row.find(".edit_cell.date_select :input").datepicker({
				maxDate: 0,
				changeYear: true,
				changeMonth: true,
				yearRange: '2000:c', // allow years to be edited back to the start of collection, and up to current year
				//constrainInput: true,
				onSelect: function() {
					$(".ui-datepicker a").removeAttr("href");
				}
			});
			
			// Disable all the other edit buttons
			// Why do we need to do that though?
			$("#tree-observations .btn.display_cell").hide();
			
			//var existingObs = this.model.findAllObservers();
			var all_observers = this.getAllObservers();
			$new_entry_row.find(".edit_cell.observers :input").typeahead({
				source: all_observers,
				type: 'observers'
			});
			
			
			// bind the validation functions to the fields to validate
			var dis = this;
			$new_entry_row.find(".edit_cell.date_select :input").on("blur", function() {
				$new_entry_row.find(".edit_cell.date_select :input").addClass("to_validate");
				dis.validateField();
			});
			$new_entry_row.find(".edit_cell.observers :input").on("blur", function() {
				$new_entry_row.find(".edit_cell.observers :input").addClass("to_validate");
				dis.validateField();
			});
			$new_entry_row.find(".edit_cell.diameter :input").on("blur", function() {
				$new_entry_row.find(".edit_cell.diameter :input").addClass("to_validate");
				dis.validateField();
			});
			$new_entry_row.find(".status.alive").on("click", function() {
				$new_entry_row.find(".status.alive").addClass("to_validate");
				console.log("about to validate status");
				dis.validateField();
			});
			$new_entry_row.find(".status.dead_standing").on("click", function() {
				$new_entry_row.find(".status.dead_standing").addClass("to_validate");
				console.log("about to validate status");
				dis.validateField();
			});
			$new_entry_row.find(".status.dead_fallen").on("click", function() {
				$new_entry_row.find(".status.dead_fallen").parent().addClass("to_validate");
				console.log("about to validate status");
				dis.validateField();
			});
			
>>>>>>> 114965f2c73617ad50225567f71de2a374addc3b
		},

		editObservation: function(event) {

			// User wants to edit an existing observation.  
			row_to_edit = $(event.target).parents("tr");		// Get the row of edit button

			// Hide any existing edit modes
<<<<<<< HEAD
			$("#tree_observations .btn.display_cell").hide();

			// Show edit content, hide display content, show "Submit/cancel button", add date_picker		
			row_to_edit.find(" .edit_cell").show();
			row_to_edit.find(".display_cell").hide();
			row_to_edit.find(".edit_cell.date_select :input").datepicker({ altFormat: "yymmdd" , altField: "#tree_observations > tbody > tr .formatted_date" , maxDate: 0, changeYear: true , changeMonth: true , constrainInput: true });

			// get all observers existing in database, feed them into an autocomplete for the observers field
			var allDistinctObservers = this.populateObserversArray(allDistinctObservers);
			row_to_edit.find(".edit_cell.observers :input").autocomplete({source: allDistinctObservers});			

=======
			$("#tree-observations .btn.display_cell").hide();
			$row_to_edit.find(".edit-obs-info").show();
			
			// set status as whatever it was listed as in tree
			$row_to_edit.find("." + this.model.get("status")).addClass("active");
			
			$row_to_edit.find(".edit_cell").show();
			$row_to_edit.find(".display_cell").hide();
			$row_to_edit.find(".edit_cell.date_select :input").datepicker({
				dateFormat: "mm/dd/yy", 
				maxDate: 0, 
				changeYear: true, 
				changeMonth: true, 
				yearRange: '2000:c', // allow years to be edited back to the start of collection, and up to current year
				//constrainInput: true,
				onSelect: function() {
					$(".ui-datepicker a").removeAttr("href");
				}
			});
			$row_to_edit.addClass("old");
			
			var all_observers = this.getAllObservers();
			$row_to_edit.find(".edit_cell.observers :input").typeahead({
				source: all_observers,
				type: 'observers'
			});
			$(".already").remove();
			
			console.log($row_to_edit);
			
			var dis = this;
			$row_to_edit.find(".edit_cell.date_select :input").on("blur", function() {
				console.log("date");
				$row_to_edit.find(".edit_cell.date_select :input").addClass("to_validate");
				dis.validateField();
			});
			$row_to_edit.find(".edit_cell.observers :input").on("blur", function() {
				console.log("observers");
				$row_to_edit.find(".edit_cell.observers :input").addClass("to_validate");
				dis.validateField();
			});
			$row_to_edit.find(".edit_cell.diameter :input").on("blur", function() {
				console.log("diams");
				$row_to_edit.find(".edit_cell.diameter :input").addClass("to_validate");
				dis.validateField();
			});
			$row_to_edit.find(".status.alive").on("click", function() {
				$row_to_edit.find(".status.alive").addClass("to_validate");
				dis.validateField();
			});
			$row_to_edit.find(".status.dead_standing").on("click", function() {
				$row_to_edit.find(".status.dead_standing").addClass("to_validate");
				dis.validateField();
			});
			$row_to_edit.find(".status.dead_fallen").on("click", function() {
				$row_to_edit.find(".status.dead_fallen").parent().addClass("to_validate");
				dis.validateField();
			});
			
>>>>>>> 114965f2c73617ad50225567f71de2a374addc3b
		},

		cancelEditObservation: function() {
			// user wants to cancel any edits made, or is canceling after adding a new entry
			this.model.fetch(); // retrieves recent data
<<<<<<< HEAD
			this.renderUpdate();      // NOTE: this is sort of a hack to exit the editing view
=======
			$("#tree-observations > tr").removeClass("new");
			$("#tree-observations > tr").removeClass("edit");
			$(".btn-new-observation").show();
			this.render();      // NOTE: this is sort of a hack to exit the editing view
>>>>>>> 114965f2c73617ad50225567f71de2a374addc3b
		},

		saveObservation: function(event) {
			// User added or edited an observation.  Save it to the server.	
<<<<<<< HEAD
			// Get the row that is being edited
			row_to_save = $("#tree_observations > tbody > tr .edit_cell :visible").parents("tr");

			var newDateKey = row_to_save.find(".formatted_date").val();
			var newValue = parseFloat(row_to_save.find(".diameter :input").val());
			// convert observers from string to array
			var newObservers = row_to_save.find(".observers :input").val().split(",");
			for (var i=0; i<newObservers.length; i++){
				newObservers[i] = newObservers[i].trim(" ");
			}
			var newNotes = row_to_save.find(".notes :input").val();

			/* final validation before saving to database */
			if (! (this.validateDate(row_to_save) && this.validateObservers(row_to_save) && this.validateDiameter(row_to_save))){
				console.log("didn't save");
				return; // user will remain in edit view until their data passes validation
			}

			//must clone object to update it
			var diameters = _.clone(this.model.get('diameter'));

			// Find the existing date key by figuring out the index of the row being edited and matching it up with the index of the 
			// observations (sorted by date key in reverse)
			var indexOfObservation = $("#tree_observations tbody tr").index(row_to_save);
			var existingDateKey = _.keys(diameters).sort().reverse()[indexOfObservation];

			// Remove the existing date key/object.  Since _.clone is a shallow clone, we need to remove the reference to the
			// existing observation before removing it.
			//console.log(existingDateKey);
			diameters[existingDateKey] = new Object();
			delete diameters[existingDateKey];

			// Add in the new data
			diameters[newDateKey] = {
					value: newValue,
					notes: newNotes,
					observers: newObservers
				};

			// Set the diameter to be the new list of observations and save the object	

			//** May need to check to see if no change 

			this.model.set({"diameter": diameters});
			var ret = this.model.save(null, {error: function(model, response, options){alert("There was an error with the database.  Please alert the instructor of this issue.")}, 
									         success: function(model, response, options){console.log("save to database was successful")}});	
			// NOTE: another hack to make sure that the display view is rendered instead of the edit view
			//(otherwise the edit view hangs there when nothing is changed)

			//row_to_save.find(".editable").attr("id", "current");
			//row_to_save.find("#current").addClass("alert-valid", {duration:500});
			//row_to_save.find("#current").removeClass("alert-valid", {duration:500});
			this.render();		

		},

		validateField: function(event){

			var fieldToValidate = event.currentTarget.className;
			var currentRow = $("#tree_observations > tbody > tr .edit_cell :visible").parents("tr");

			/* if date field lost focus */
			if (fieldToValidate == "edit_cell date_select"){				
				this.validateDate(currentRow);
			/* if observers field lost focus */				
			} else if (fieldToValidate == "edit_cell observers"){
				this.validateObservers(currentRow);
			/* if diameter field lost focus */				
			} else if (fieldToValidate == "edit_cell diameter"){
				this.validateDiameter(currentRow);
			} else {
				// field left was comments, which don't need to be validated (and should be allowed to be empty!)
				return;
			}

=======
			
			// Get the row that is being edited
			var $row_to_save = $(event.target).parents("tr");
			
			/* validate data being entered before saving; cancel if invalid */
			$row_to_save.find(".edit_cell.date_select :input").addClass("to_validate");
			if (! this.validateField()) {
				return;
			}
			$row_to_save.find(".edit_cell.observers :input").addClass("to_validate");
			if (! this.validateField()) {
				return;
			}
			$row_to_save.find(".edit_cell.diameter :input").addClass("to_validate");
			if (! this.validateField()) {
				return;
			}
			
			// is it a new row, or an old one?
			var is_this_row_new = $row_to_save.hasClass("new");
			
			var entries_array = this.model.get("diameter");
			
			// convert observers from string to array
			var new_observers_orig = $row_to_save.find(".observers :input").val().split(",");
			var new_observers = [];
			var new_observer = "";
			for (var i = 0; i < new_observers_orig.length; i++){
				new_observer = new_observers_orig[i].trim(" ");
				if (new_observer != "") new_observers.push(new_observer);
			}
			
			// var new_date = new Date(parseInt($row_to_save.find(".unix-time").val()));
			
			// new entry object
			var new_entry = {
				date: ($row_to_save.find(".edit_cell.date_select :input").datepicker("getDate")).toTreeDataDateObject(),
				year: ($row_to_save.find(".edit_cell.date_select :input").datepicker("getDate")).getFullYear(),
				value: parseFloat($row_to_save.find(".diameter :input").val()).toFixed(1), //round the diameter measurement to 1 decimal place
				observers: new_observers,
				notes: $row_to_save.find(".notes :input").val(),
				status: $row_to_save.find(".status.active").val()
			};				
			this.model.set('status', $row_to_save.find(".status.active").val());
			//console.log($row_to_save.find(".status.active").val());
			//console.log(this.model);
			// if it is a new one
			if (is_this_row_new === true) {
				
				// add a new entry to the list, to where it should be
				var target_index = _.sortedIndex(entries_array, new_entry, function(entry) {
					return entry.year;
				});
				
				// then insert it
				this.model.set('diameter', _.union(_.first(entries_array, target_index), [new_entry], _.rest(entries_array, target_index)));
				
				
			} else { // if we are editing a row
				
				// get the index from the id (id="entry-#")
				var target_index = parseInt(($row_to_save.attr("id")).split("-")[1]);
				// set the entry at the target index to the new one
				entries_array[target_index] = new_entry;
				// sort it, because why not?
				// well, really though, why not?
				entries_array = _.sortBy(this.model.get('diameter'), function (entry) {
					return 0 - (entry.date.y*366 + entry.date.m*32 + entry.date.d);
				});
				
				// set the new diameter
				this.model.set('diameter', entries_array);
				
			}
			
			var self = this;
			
			$("#tree-observations > tr").removeClass("edit");
			this.model.url = app.config.cgiDir + 'tree_data.py';
			this.model.save({}, {
				success: function() {
					self.render();
				},
				error: function(model, xhr) {
					var saveError = new errorView({
						xhr: xhr,
						id: "save-observation-error"
					});
					
					saveError.render().$el.insertBefore('#tree-observations');
					
				}
			});	
			

		},
		deleteObservation: function(event) {
			
			// ask the user whether they're absolutely sure...
			var $alert_modal = $('<div></div>').addClass("modal hide face").attr({
				'tabindex': '-1',
				'role': 'dialog',
				'aria-labelledby': 'dialog',
				'aria-hidden': 'true'
			}).html('\
				<div class="modal-header">\
					<h3>Are you sure...</h3>\
				</div>\
				<div class="modal-body">\
					<p>...you want to delete this observation entry? </p>\
				</div>\
				<div class="modal-footer">\
					<button class="btn btn-info" data-dismiss="modal" aria-hidden="true">Nah, just kidding</button>\
					<button class="btn btn-danger" id="no-remorse">Yes, I won\'t feel remorse</button>\
				</div>\
			');
			
			$('body').append($alert_modal);
			$alert_modal.modal();
			$alert_modal.modal('show');
			var is_user_sure = true;
			$alert_modal.on('hidden', function() {
				$alert_modal.remove();
			});
			
			var self = this;
			
			$alert_modal.find('#no-remorse').on('click', function() {
			
				$alert_modal.modal("hide");
			
				// get the row to delete
				var $row_to_delete = $(event.target).parents("tr");
				
				// get the target index
				var target_index = parseInt(($row_to_delete.attr("id")).split("-")[1]);
				var entries_array = self.model.get('diameter');
				
				// delete it! HAHAHAHAHA
				self.model.set('diameter', _.without(entries_array, entries_array[target_index]));
				self.model.url = app.config.cgiDir + 'tree_data.py';
				self.model.save({}, {
					success: self.render,
					error: function(model, xhr) {
						var deleteObservationError = new errorView({
							xhr: xhr,
							id: "delete-observation-error"
						});
					}
				});
				
				
			});
			
		},
		validateField: function(){

			var current_row = $("#tree-observations > tbody > tr .edit_cell :visible").parents("tr");
			//console.log(current_rowfind(".to_validate"));
			var field_to_validate = current_row.find(".to_validate").parent().attr("class").replace("to_validate", "").replace("display_cell", "").replace("edit_cell", "").replace("show-obs-info", "").replace("edit-obs-info", "").trim();
			console.log(field_to_validate.search("status") !== -1);
			var error_message = false;	// on a validation error this is populated with string to display
			var status_error_message = false;
			var field_to_highlight;		
			
			//if date field lost focus 
			if (field_to_validate == "date_select"){
				error_message = this.validateDate(current_row);	
				if (error_message) field_to_highlight="date_select";			
			//if observers field lost focus				
			} else if (field_to_validate == "observers"){
				error_message = this.validateObservers(current_row);
				if (error_message) field_to_highlight="observers";
			//if diameter field lost focus				
			} else if (field_to_validate == "diameter"){
				error_message = this.validateDiameter(current_row);
				if (error_message) {field_to_highlight="diameter"; console.log("didnt pass");}
			} else if (field_to_validate.search("status") !== -1) {
				status_error_message = this.validateStatus(current_row);
			} else {
				// field left was comments, which don't need to be validated (and should be allowed to be empty!)
				return true;
			}
						
			
			if (error_message) {	// if there is an error in validation of an editable field		
				//flag the field as invalid with a tooltip and highlighted color
				// change the title that will be displayed in the tooltip
				$(".edit_cell."+field_to_highlight+" :input").attr("data-original-title", error_message).addClass("alert_invalid").tooltip().tooltip('show');
				// also remove validate flag since it has now been validated
				current_row.find(".to_validate").removeClass("to_validate");
				return false;
			} else if (status_error_message) {	// if there is an error in validation of the status buttons
				console.log(status_error_message);
				current_row.find(".btn-group.status").tooltip('destroy').tooltip({title: status_error_message}).tooltip('show');
				current_row.find(".to_validate").removeClass("to_validate");
			} else {	//if field passes all tests, make sure nothing is highlighted anymore 
				// reset everything to look normal, unflagged, etc.
				current_row.find(".to_validate").removeClass("to_validate").attr("data-original-title", "").removeClass("alert_invalid").tooltip("destroy");
			}
			return true;
>>>>>>> 114965f2c73617ad50225567f71de2a374addc3b
		},

		validateDate: function(currentRow) {

			/* get date to validate */
			var dateEntered = currentRow.find(".formatted_date").val();

			/* make sure date isn't in future */
			var today = new Date();
		    var todayFormatted = today.getFullYear().toString() + 
		    				     ((today.getMonth()+1).toString().length == 1 ? "0"+(today.getMonth()+1) : (today.getMonth()+1).toString()) + 
		    					 ((today.getDate()+1).toString().length == 1 ? "0"+today.getDate() : today.getDate().toString());
			if (dateEntered > todayFormatted) {
				// trigger the edit Observation button to prevent saving
				$(".edit_cell.date_select :input" ).addClass("alert_invalid");
				alert("Can't have date past today!");
				console.log("date validation failed");
				$(currentRow.find('.edit-existing')).trigger('click');
				return false;
			} 

			/* make sure date isn't already added */		
			// get all dates listed in model for diam entries
			var existingDiamsObject = this.model.attributes.diameter;
			var existingDatesArray = Object.keys(existingDiamsObject).reverse();
			// remove the date previously listed in the date field from the list of dates to check against
			var prevDateIndex = $("#tree_observations tbody tr").index(currentRow);
			existingDatesArray.splice(prevDateIndex, 1);
			// alert user if the date already has an associated entry
			for (i in existingDatesArray) {
				if (existingDatesArray[i] == dateEntered){
					// show user a tooltip about the proper entry
					$(".edit_cell.date_select :input").tooltip();   // NOTE: the text shown on the tooltip is listed as the title attribute of the template for TreeEditView.
					$(".edit_cell.date_select :input" ).tooltip("show");
					$(".edit_cell.date_select :input" ).addClass("alert_invalid");
					return false;
				}
			}

			/* if date field passes all tests, make sure it is not highlighted anymore */
			$(".edit_cell.date_select :input" ).removeClass("alert_invalid");
			$(".edit_cell.date_select :input" ).tooltip("destroy");
			console.log("date validation passed");
			return true;
		},

		validateObservers: function(currentRow) {

			// get observers entry and format
			var obsEntered = currentRow.find(".observers :input").val().split(",");
			for (var i=0; i<obsEntered.length; i++){
				obsEntered[i] = obsEntered[i].trim(" ");
			}	

			// make sure an observer was entered
			if (obsEntered[0] === "") {
				console.log("empty list");
				$(".edit_cell.observers :input").tooltip(); // NOTE: the text shown on the tooltip is listed as the title attribute of the template for TreeEditView.
				$(".edit_cell.observers :input" ).tooltip("show");
				$(".edit_cell.observers :input" ).addClass("alert_invalid");
				return false;
			} else { 
				$(".edit_cell.observers :input" ).removeClass("alert_invalid");
				$(".edit_cell.observers :input" ).tooltip("destroy");
				console.log("observers validation passed");
				return true;
			}

		},

		validateDiameter: function(currentRow) {

			// get diameter entry
			var diamEntered = parseFloat(currentRow.find(".diameter :input").val());

			// make sure the diameter is in correct format (can be parsed as float)
			if (isNaN(diamEntered)) {
				console.log("returned NaN");
				$(".edit_cell.diameter :input").tooltip(); // NOTE: the text shown on the tooltip is listed as the title attribute of the template for TreeEditView.
				$(".edit_cell.diameter :input").tooltip("show");				
				$(".edit_cell.diameter :input").addClass("alert_invalid");
				return false;
			} else { 
				$(".edit_cell.diameter :input" ).removeClass("alert_invalid");
				$(".edit_cell.diameter :input" ).tooltip("destroy");
				console.log("diameter validation passed");
				return true;
			}
		},
		
		validateStatus: function($current_row) {
			console.log("in validate status");
			//TODO: get the most recent status.

			var last_known_status = (this.model.get("diameter")[0] !== undefined) ? this.model.get("diameter")[0].status : "alive";
			console.log(last_known_status);
			
			var entered_status = $current_row.find(".status.to_validate").val();
			console.log(entered_status);
			
			if (entered_status == "alive" && (last_known_status == "dead_standing" || last_known_status == "dead_fallen")) {
				return "A dead tree doesn't usually come back to life... are you sure it is alive now???";
			} else if (entered_status == "dead_standing" && last_known_status == "dead_fallen") {
				return "A fallen tree doesn't usually stand itself back up... are you sure you are recording it correctly?";
			} else {
				return false;
			}
			
		},

		populateObserversArray: function(observersArray) {
			//finds all observers that have been previously entered into the database
<<<<<<< HEAD
			var curObservers;
			var curObserver;
			observersArray = [];
			var alreadyThere = false;
			var curDates;
			var dateThreshold = (new Date()).getFullYear() - 4; // only autocomplete with observers who have entered data in last 4 years
			// get all diameter objects and loop through to find each distinct observer entry
			$.getJSON(app.config.cgiDir + 'litterfall.py?site=allDiameters', function(data) {
				for (i in data){
					for (date in data[i]){
						// only get observers if the entry has observers listed
						if (data[i][date].observers !== undefined) {
							// only take observers from last 4 years
							if (date.substr(0,4) >= dateThreshold) {
								if (data[i][date].observers[0] !== undefined) {
									if (data[i][date].observers[0].trim(" ") !== ""){
										curObservers = data[i][date].observers;
										// check each observer listed in an entry against each observer already in comprehensive array
										for (k in curObservers) {
											curObserver = curObservers[k];
											for (date in observersArray) {
												if (curObserver === observersArray[date]) {
													alreadyThere = true;
													break;
												} else {
													alreadyThere = false;
												}
											}
											if (alreadyThere === false) {
												observersArray.push(curObserver);
											}
										}
									}
								}
							}
						}
					}
=======
			var observers_array = [];
			
			$.getJSON(app.config.cgiDir + 'tree_data.py?site=allObservers', function(data) {
				
				for (i in data) {
					observers_array.push(data[i]);
>>>>>>> 114965f2c73617ad50225567f71de2a374addc3b
				}
			});
			observersArray.sort();
			return observersArray;
		}
	});

	var singleOption = Backbone.Model.extend({});								//creates empty Model (to be a site, once information is loaded)

	var selectionOptions = Backbone.Collection.extend({							//creates Collection of singleOption Models (to-be locations, plots, collection type)
		model: singleOption,
		url: "data/sites.json",													//calls for server DB's location (plot, etc. information)
    	parse: function(response){												
    		var parsedOptions = [];												
    		for (element in response){											//for objects within JSON return object
    			if (_.isString(response[element])){								//if the response is a string (e.g., a location), store it in the array:
    				parsedOptions.push({										//for Backbone's use, stores object from JSON information as key:value pair (object)
    					value: response[element],
    					name: response[element].charAt(0).toUpperCase() + response[element].slice(1)
    				});
    			} else {
    				parsedOptions.push(response[element]);						//<WHAT DOES THIS DO?> [ ]
    			}
    		}
    		return parsedOptions;
    	}
	});
<<<<<<< HEAD
=======
	
	var errorView = Backbone.View.extend({
		
		tagName: 'div',
		className: 'alert alert-error fade in',
		defaults: {
			title: "Error",
			message: "Hey, something just did go wrong."
		},
		initialize: function() {},
		render: function() {
			if (this.attributes.id !== undefined) {
				$("#"+this.options.id).remove();
				this.id = this.options.id;
			}
			var has_xhr = this.options.xhr !== undefined;
		
			this.$el.html('<button type="button" class="close" data-dismiss="alert">&times;</button>\
			<h4>' + (has_xhr ? ("Error " + this.options.xhr.status + ": " + this.options.xhr.statusText) : this.options.title) + '</h4>\
			' + (has_xhr ? this.options.xhr.responseText : this.options.message) + '\
			');
		
			return this;
		}
		
	});
>>>>>>> 114965f2c73617ad50225567f71de2a374addc3b


	//Declare the tree object (Model)
	var Tree = Backbone.Model.extend({
		defaults: {
			site: '',
			plot: '',
			//_id: '',
			tree_id: 0,
			sub_tree_id: 0,
			angle: 0.0,
			distance: 0,
			diameter: {},
			species: 'Unknown',
			species_certainty: 0,
			dead: true,
			dbh_marked: false,
			url: '',
			lat: 0,
			lng: 0,
			collection_type: 'tree'
		},
		initialize: function(){
<<<<<<< HEAD
			this.editViewInitialize();
=======
>>>>>>> 114965f2c73617ad50225567f71de2a374addc3b
			this.on('invalid', this.showError);
		},
		showError: function(){
			//TODO show the validation error that is set in the validate method
			console.log(this.validationError);
		},
		plotViewInitialize: function(){
			var plotRow = new plotRowView({
				targetEl: $("#plot-table"),
				model: this
			});
		},
		editViewInitialize: function(){
			var editForm = new treeEditView({
				el: $('#treeEditView'),
				model: this
			});
		},
		parse: function(response){
<<<<<<< HEAD
			response.full_tree_id = response.tree_id + (response.sub_tree_id * .1);
=======
			
			// sort, the latest goes to the top
			response.diameter = _.sortBy(response.diameter, function (entry) {
				//console.log(entry);
				return 0 - (entry.date.d + entry.date.m*32 + entry.date.y*366);
			});
			// format full tree ID for display
			response.full_tree_id = response.tree_id + ((response.sub_tree_id == 0) ? '' : ('.' + response.sub_tree_id));
			
			// get latest status (dead or alive) and set to the model
			if (response.diameter.length > 0) {
				//alert(response.diameter[0].status);
				response.status = response.diameter[0].status;
			} else {
				response.status = "alive";
			}
			
>>>>>>> 114965f2c73617ad50225567f71de2a374addc3b
			return response;
		},
		// overriding the save method, so that when the model saves it updates its inside to match what the server sends back
		save: function(attrs, options) {
			
			var result = Backbone.Model.prototype.save.call(this, attrs, options);
			
<<<<<<< HEAD
			treeModel = this;
			result.done(function(data) {
				
				treeModel.set(data);
				
			});
=======
			var self = this;
			if (result !== false) {
				result.done(function(data) {self.set(data);});
			}
>>>>>>> 114965f2c73617ad50225567f71de2a374addc3b
			
			return result;
		},
		// ** Normally, it would not have to go through save, but somehow destroy doesn't work
		// I think there is something wrong with the DELETE request method
		destroy: function() {
			this.set('delete', true);
			return this.save();
		},
		validate: function(attrs, options){
			//this is where we validate the model's data
			var isInt = [];
			var isFloat = [];
		},

		newSubTreeRowViewInitialize: function() {
			var subTreeRow = new newSubTreeRowView({
				model: this
			});
		}

	});

	//Declare the plot collection, contains tree objects
	var Plot = Backbone.Collection.extend({
		model: Tree,
		url: "/",
  		initialize: function(){
<<<<<<< HEAD
  			 this.on('reset', this.renderTrees); 
  			 this.on('add', this.renderTrees); 
  			 //this.on('reset', this.findAllObservers); 
  			 //this.on('add', this.findAllObservers); 
  			 //this.on('change', this.renderTrees);
=======
  			this.on('reset', this.renderTrees); 

  		},
  		render: function() {
  			this.renderTrees();
  			return this;
>>>>>>> 114965f2c73617ad50225567f71de2a374addc3b
  		},
  		renderTrees: function(){
  			var siteName = "";
  			var plotNumber = 0;
  			var maxDiam = 0;
  			this.each(function(tree){
  				tree.plotViewInitialize();
  				siteName = tree.get("site");
  				plotNumber = tree.get("plot");
  				var allObvs = tree.get("diameter");
  				var numObvs = 0;
  				// determine the maximum number of observations for any tree in this plot
  				// to allocate enough columns in the CSV file
  				$.each(allObvs, function(index, value) {
  					numObvs++;
  				});
  				if (numObvs > maxDiam) {
  					maxDiam = numObvs;
  				}
  			}, this);
<<<<<<< HEAD
  			
  			
  			var dataStartYear = 2002;					// data began collection in 2002
			var dataEndYear = new Date().getFullYear();	// data collection continues through current year (in theory)
			//console.log("dataStart = "+ dataStartYear + " and dataEnd = "+ dataEndYear);
  			//$('.tbody').append("<td class='date-entry 2014'>Hello</td>");
			/*$('#sub-header').append("<th class='date-entry " + dataEndYear + " header'>" + dataEndYear+ "</th>");
			$('.date-entry 2014').style.display = "table-cell";*/
			
						
						
						
  			// populate the treeIDs dropdown menu for adding new subtrees
  			this.populateTreeIDs();
=======


>>>>>>> 114965f2c73617ad50225567f71de2a374addc3b
  			$(".dbh").attr("href", document.location.hash);
  			$(".btn").css("display", "inline-block");
    		
    		// add tablesorter jquery plugin (no sorting for first column)
  			$("#plot-table").tablesorter({headers: { 0: { sorter: false}}}); 
  			// populate the diameter entries based on user's given years
  			this.populateTreeDiameters();
  			
  			// re-populate (really just showing/hiding columns) corresponding to the date range desired when user clicks Go!
  			$("#btn-go").click(this.populateTreeDiameters);

  			// set up column headers for CSV
  			var CSV = "Full Tree ID,Species,Angle,Distance"
  			for(var i = 1; i <= maxDiam; i++) {
  				CSV += "," + "Obs Date " + i + ",Diameter " + i + ",Notes " + i;
  			}
  			var j = 0;
  			$(".export").click(function(e) {
  				$(".export").val("Preparing data for export...");
  				// query database for all trees in the plot
<<<<<<< HEAD
  				$.getJSON(app.config.cgiDir + 'litterfall.py?site=' + siteName + "&plot=" + plotNumber, function(data) {
					$.each(data, function(index, value) {
						// format Comma Separated Value string with data from each tree
						CSV = CSV + "\r\n" + (parseInt(value["tree_id"]) + parseInt(value["sub_tree_id"])*.1) + "," + value["species"] + "," + value["angle"] + "," + value["distance"];
						$.each(value["diameter"], function(date, obs) {
							var parsedDate = $.datepicker.parseDate('yymmdd', date)
							var formattedDate = $.datepicker.formatDate('m/d/yy', parsedDate)
							CSV += "," + formattedDate + "," + obs["value"] + ",";
							if (obs["notes"] != "" && obs["notes"] != undefined){
								CSV += obs["notes"];
							}
=======
  				if (j == 0) {  				
  					$(".export").val("Preparing data for export...");
  					$.getJSON(app.config.cgiDir + 'tree_data.py?site=' + $(".site-name").text() + "&plot=" + $(".plot-number").text(), function(data) {
  						$.each(data, function(index, value) {
							// format Comma Separated Value string with data from each tree
							CSV = CSV + "\r\n" + (parseInt(value["tree_id"]) + parseInt(value["sub_tree_id"])*.1) + "," + value["species"] + "," + value["angle"] + "," + value["distance"];
							$.each(value["diameter"], function(i) {
								var obs = value["diameter"][i];
								if (obs["date"] != null){
									var formatted_date = obs["date"]["d"] + "/" + obs["date"]["m"] + "/" + obs["date"]["y"];
									CSV += "," + formatted_date + "," + obs["value"] + ",";
								}
								console.log(obs["notes"].replace(/[^a-zA-Z 0-9]+/g, ''));
								if (obs["notes"] != "" && obs["notes"] != undefined){
									CSV += obs["notes"].replace(/[^a-zA-Z 0-9]+/g, '');
								}
							});
>>>>>>> 114965f2c73617ad50225567f71de2a374addc3b
						});

					});
					// adds formatted data to a hidden input on the page
					$("#CSV").append(CSV);
					$(".export").val("Click to open file");
					$(".export").addClass("btn-success");
					j = 1;
				});
				// ensures information has loaded before opening the CSV file
				/*
				if (j > 0) {
<<<<<<< HEAD
					window.open('data:text/csv;charset=utf-8,' + encodeURIComponent($('#CSV').text()));    				
					e.preventDefault();

				}
				
=======
					if (agt.indexOf("firefox") != -1 || agt.indexOf("msie") != -1) {
						window.open('data:application/octet-stream;charset=utf-8,' + encodeURIComponent($('#CSV').text()));
					} else {
						window.open('data:text/csv;charset=utf-8,' + encodeURIComponent($('#CSV').text()));
					}
					e.preventDefault();   				
				}*/
				if (j > 0) {
					var iframe = $('<iframe>',{
						width:1,
						height:1,
						frameborder:0,
						css:{
							display:'none'
						}
					}).appendTo('body');
			
					var formHTML = '<form action="" method="post">'+
						'<input type="hidden" name="filename" />'+
						'<input type="hidden" name="content" />'+
						'</form>';
			
					// Giving IE a chance to build the DOM in
					// the iframe with a short timeout:
			
					setTimeout(function(){
			
						// The body element of the iframe document:
			
						var body = (iframe.prop('contentDocument') !== undefined) ?
										iframe.prop('contentDocument').body :
										iframe.prop('document').body;	// IE
			
						body = $(body);
			
						// Adding the form to the body:
						body.html(formHTML);
			
						var form = body.find('form');
			
						form.attr('action', app.config.cgiDir + 'create_file.py');
						form.find('input[name=filename]').val($(".site-name").text()+"-"+$(".plot-number").text());
						form.find('input[name=content]').val(CSV);
			
						// Submitting the form to download.php. This will
						// cause the file download dialog box to appear.
			
						form.submit();
					},50);
				}
>>>>>>> 114965f2c73617ad50225567f71de2a374addc3b
  			});
  
    	},
		populateTreeDiameters: function(){
    		// get year range user wished to view data from
			var startYear = $("#startYear").val();
  			var endYear = $("#endYear").val();
			var numYears = $("#endYear").val()-$("#startYear").val() + 1;
			
			if (startYear > endYear){
				// switch years so user doesn't have to be specific about which direction their date range goes
				var tempYear = startYear;
				startYear = endYear;
				endYear = tempYear;
			}
			
<<<<<<< HEAD
			//$('.date-entry').hide();
			for (var i=parseInt(startYear); i<=parseInt(endYear); i++){
				$('.'+i).show();
			}

			//format header row to make the DBH cell span all the years specified
  			//document.getElementById("DBH").colSpan = numYears;
=======
			$('.date-entry').hide();
			for (var i=parseInt(start_year); i<=parseInt(end_year); i++){
				$('.y-'+i).show();
			}

			//format header row to make the DBH cell span all the years specified
  		//	document.getElementById("DBH").colSpan = num_years;
>>>>>>> 114965f2c73617ad50225567f71de2a374addc3b
    	},
  		addTree: function(){
  			this.newTreeRowViewInitialize();	
  		},
  		
  		populateTreeIDs: function(){

			// Get all the ids
			var ids = [];
			
			// Populate the ids array
			this.each(function(tree){
				var treeid = tree.get("tree_id");
				// Avoiding duplicates
				if (ids.length == 0 || ids.indexOf(treeid) < 0) {
					ids.push(treeid);
				}
			});

<<<<<<< HEAD
			// Sort the array IDs
			ids.sort(function(a,b){return a - b;});
=======
  			
  			// var random_tree = this.find(function(){return true;});
  			
  			var new_tree = new Tree({
  				plot: parseInt($('.plot-number').text()),
  				site: $('.site-name').text()
  			});
  			var new_model = new newTreeModal({
  				model: new_tree
  			});
  			var this_plot = this;
  			
  			// reload the whole page
  			// this is not a good idea
  			// we have to somehow think about sorting
  			new_model.on("tree_saved", function() {
  				$('#plot-table tbody').empty();
  				this_plot.fetch({reset: true});
  			});
>>>>>>> 114965f2c73617ad50225567f71de2a374addc3b

			var treeCollection = this;

			// populate tree IDs
			for (var i = 0; i < ids.length; i++) {
				var id = ids[i];
				$(".id-list").append( 
					$("<li></li>").append( 
						$("<a></a>").text(id)
					)
				);

			}
			
			$(".id-list li a").click(function(){

				var aTag = $(this);

				var parentTree = treeCollection.find(function(tree) {
					return tree.get("tree_id") == parseInt(aTag.text());
				});

				//console.log(parentTrees[parentTrees.length - 1]);
				parentTree.newSubTreeRowViewInitialize();
				
			});






		},

		newTreeRowViewInitialize: function(){
  			console.log("newTreeRowViewInitialize");
			var newTreeRow = new newTreeRowView({
				targetEl: $("#plot-table"),
				model: this.model
			});
		}
  	});

    // Instantiate the router
    var app_router = new AppRouter;
   
    //default route is the App Home Page
    app_router.on('route:defaultRoute', function (actions) {
    	$(".home").addClass("active");
    	$(".data").removeClass("active");
    	var  templateFile = 'index.html';
		require(['lib/text!templates/' + templateFile + '!strip'], function(templateHTML){			//require's library takes HTML templates
			$('#main').html(templateHTML);
		});
    });
    
    //Site, plot selection
    app_router.on('route:accessObservations', function () {											//listening for user action (for user to select location and plot)
    	$(".data").addClass("active");
    	$(".home").removeClass("active");
    	var  templateFile = 'update.html';
		require(['lib/text!templates/' + templateFile + '!strip'], function(templateHTML){			
			$('#main').html(templateHTML);
<<<<<<< HEAD
			var locationOptions = new selectionOptions;
			locationOptions.url = app.config.cgiDir + "litterfall.py?site=all";						//creates list with all possible locations
			var locationSelect = new selectionOptionsView({
=======
			var location_options = new selectionOptions;
			location_options.url = app.config.cgiDir + "tree_data.py?site=all";						//creates list with all possible locations
			var location_select = new selectionOptionsView({
>>>>>>> 114965f2c73617ad50225567f71de2a374addc3b
				el: $('#site-select'),																//populates new selectionOptionsView with locations (sites)
				collection: locationOptions
			});
<<<<<<< HEAD
			locationOptions.fetch();
			$('#update-records').click(function(){														//waits for user to select plot
				var getPlotUrl = "data/update/" + $('#type-select').val() + '/site/' + encodeURI($('#site-select').val()) + '/plot/' + $('#plot-select').val()
				document.location.hash = getPlotUrl;
			});
			$('#analyze-data').click(function(){														//waits for user to select plot
				var getPlotUrl = "data/reports/" + $('#type-select').val() + '/site/' + encodeURI($('#site-select').val()) + '/plot/' + $('#plot-select').val()
				document.location.hash = getPlotUrl;
=======
			location_options.fetch({
				success: function() {
					$('#update-records').removeAttr("disabled").click(function(){														//waits for user to select plot
						var getPlotUrl = "data/update/" + $('#type-select').val() + '/site/' + encodeURI($('#site-select').val()) + '/plot/' + $('#plot-select').val()
						document.location.hash = getPlotUrl;
					});
					$('#analyze-data').removeAttr("disabled").click(function(){														//waits for user to select plot
						var getPlotUrl = "data/reports/" + $('#type-select').val() + '/site/' + encodeURI($('#site-select').val()) + '/plot/' + $('#plot-select').val()
						document.location.hash = getPlotUrl;
					});
				}
>>>>>>> 114965f2c73617ad50225567f71de2a374addc3b
			});
		});
    });
    
    //Plot view
    app_router.on('route:goToPlot', function(site, plot) {		
    	//reloads page based on selected location (site) and plot
		$(".data").addClass("active");
    	$(".home").removeClass("active");
<<<<<<< HEAD
		// load different template depending on whether we are updating or analyzing data
		var templateFile;		
		if (document.location.hash.search("update") === -1) { //if url does not contain 'update' (i.e. it must contain 'reports')
			console.log("should be reporting");
			templateFile = 'reports2.html';
		} else {		
			console.log("should be updating");									  // url contains 'update'
			templateFile = 'update2.html';
		}
		require(['lib/text!templates/' + templateFile + '!strip'], function(templateHTML){			//<WHAT DOES THIS FUNCTION DO?> [ ] (some sort of require wrapper)
			$('#main').html(_.template(templateHTML, {
				site: decodeURI(site), 
				plot: plot
			}));
=======
    	
		var this_plot = new Plot();
		//need to use site and plot variable to build url to python script
		this_plot.url = app.config.cgiDir + 'tree_data.py?site=' + site + '&plot=' + plot;
    	
		// load different template depending on whether we are updating or analyzing data	
		if (mode == 'reports') { //if url does not contain 'update' (i.e. it must contain 'reports')
			
			console.log("reporting");
			
			require(['lib/text!templates/reports2.html!strip'], function(templateHTML) {
				$('#main').html(_.template(templateHTML, {
					site: decodeURI(site), 
					plot: plot
				}));
	
				//jQuery calls for, DBH Tooltip and updating functionality
				updateFunctions();
	
				// fetch the data. if successful, will trigger 'reset' event. 'reset' event triggers renderTrees
				this_plot.fetch();
				
				
				/* --------- Mallory's codes for dynamically populating the years ---------- */
				
				// add selection options for data viewing based on years data is available
				var startYear = 2002; // year that data began collection
				var endYear = new Date().getFullYear();	// data collection continues through current year (in theory)
				for (var cur=startYear; cur<=endYear; cur++){
					// add selection options
					if (cur == startYear){
						$("#start-year").append($("<option></option>").attr({selected: "selected", value: cur}).text(cur));
						$("#end-year").append($("<option></option>").attr("value",cur).text(cur));
					} else if (cur == endYear){
						$("#start-year").append($("<option></option>").attr("value",cur).text(cur));
						$("#end-year").append($("<option></option>").attr({selected: "selected", value: cur}).text(cur));
					} else {
						$("#start-year").append($("<option></option>").attr("value",cur).text(cur));
						$("#end-year").append($("<option></option>").attr("value",cur).text(cur));
					}
					
					// add sub-header columns for the years we have data for
					$("#sub-header").append($("<th></th>").addClass("date-entry y-"+cur).text(cur));
				}
				
				// make the DBH heading span all the year subheadings
				var numYears = endYear - startYear + 1;
				$("#DBH").attr("colspan", numYears);
				
				// re-populate (really just showing/hiding columns) corresponding to the date range desired when user clicks Go!
  				$("#btn-go").click(this_plot.populateTreeDiameters);
				
	
			});
>>>>>>> 114965f2c73617ad50225567f71de2a374addc3b

			//jQuery calls for, DBH Tooltip and updating functionality
			updateFunctions();


			var thisPlot = new Plot;
			//need to use site and plot variable to build url to python script
			thisPlot.url = app.config.cgiDir + 'litterfall.py?site=' + site + '&plot=' + plot;
			thisPlot.fetch();
			
<<<<<<< HEAD
			// adding new tree
			$('.add-new-tree').click(function(){
				thisPlot.addTree();
=======
			require(['lib/text!templates/update2.html!strip'], function(templateHTML) {
				$('#main').html(_.template(templateHTML, {
					site: decodeURI(site), 
					plot: plot
				}));
	
				//jQuery calls for, DBH Tooltip and updating functionality
				updateFunctions();
	
				this_plot.fetch();
				
				var $add_new_sub_tree = $('.add-new-sub-tree');
				
				// adding new tree
				$('.add-new-tree').click(function(){
					if (this_plot.choosing_parent_tree === true) {
						$add_new_sub_tree.eq(0).trigger("not_choosing_parent_tree");
					}
					this_plot.addTree();
				});
				
	
				// add popover
				
				$('.add-new-sub-tree')
				.popover({
					title: 'Add a new sub-tree',
					content: 'Choose the parent tree from below'
				});
				// add the toggling functions
				$add_new_sub_tree.bind("choosing_parent_tree", function() {
					this_plot.choosing_parent_tree = true;
					$add_new_sub_tree.popover('show').addClass('active');
						
					$('#plot-table tr').css('cursor', 'pointer')
					.bind('click.makeTreeClickable', function() {
					
						// add sub-tree
						var this_tree_id = Math.floor(parseFloat($(this).children("td").eq(1).text()));
						this_plot.addSubTree(this_tree_id);
					});
					
					//$('.btn-update').attr("disabled", "disabled");
					$('#plot-table tr .btn').attr("disabled", "disabled");
				})
				.bind("not_choosing_parent_tree", function() {
					this_plot.choosing_parent_tree = false;
					$add_new_sub_tree.popover('hide').removeClass('active');
						
					$('#plot-table tr').css('cursor', 'default').unbind('click.makeTreeClickable');
					$('#plot-table tr .btn').removeAttr("disabled");
				})
				.click(function() {
					if (this_plot.choosing_parent_tree === false) {
						$(this).trigger("choosing_parent_tree");
					} else {
						$(this).trigger("not_choosing_parent_tree");
					}
				});
				
	
>>>>>>> 114965f2c73617ad50225567f71de2a374addc3b
			});
			
		});

    });
    
    //Edit tree view
    app_router.on('route:goToTree', function(site, plot, treeId, subTreeId) {						//reloads page based on selected location (site) and plot
    	$(".data").addClass("active");
    	$(".home").removeClass("active");
    	var  templateFile = 'update-tree.html';
		require(['lib/text!templates/' + templateFile + '!strip'], function(templateHTML){			//<WHAT DOES THIS FUNCTION DO?> [ ] (some sort of require wrapper)

			if(typeof subTreeId === 'undefined'){
   				subTreeId = '0';
 			} else {
 				subTreeId = subTreeId;
 			}

			$('#main').html(_.template(templateHTML, {
				site: decodeURI(site), 
				plot: plot,
				treeId: treeId,
				subTreeId: subTreeId
			}));


<<<<<<< HEAD
			var thisTree = new Tree();
			thisTree.url = app.config.cgiDir + 'litterfall.py?site=' + site + '&plot=' + plot + '&treeid=' + treeId + '&subtreeid=' + subTreeId;
			thisTree.fetch();

			//DBH Tooltip 
			updateFunctions();
		});
    });
    
    // Add new sub-tree
    /*
    app_router.on('route:newSubTree', function(site, plot, treeId) {
    	var templateFile = 'update-tree.html';
    	// create a new tree object in the database
    	// connect the newly created object to a tree model here
    	// emulate the edit tree view
    }*/
    
    //
    
     //Add new tree view
     /*
    app_router.on('route:newTree', function(site, plot) {						//reloads page based on selected location (site) and plot
    	var  templateFile = 'update-tree.html';
		require(['lib/text!templates/' + templateFile + '!strip'], function(templateHTML){			//<WHAT DOES THIS FUNCTION DO?> [ ] (some sort of require wrapper)

			$('#main').html(_.template(templateHTML, {
				site: decodeURI(site), 
				plot: plot,
				treeId: "New",
				subTreeId: "0"
			}));


			var thisTree = new Tree();
			thisTree.url = app.config.cgiDir + 'litterfall.py';
			thisTree.set("site", site);
			thisTree.set("plot", plot);
			console.log(thisTree);

=======
			var this_tree = new Tree();
			this_tree.url = app.config.cgiDir + 'tree_data.py?site=' + site + '&plot=' + plot + '&treeid=' + tree_id + '&subtreeid=' + sub_tree_id;
			this_tree.fetch({
				success: function() {
					this_tree.editViewInitialize();
				}
			});
			
			
>>>>>>> 114965f2c73617ad50225567f71de2a374addc3b
			//DBH Tooltip 
			updateFunctions();
		});
    });
    */
    
    // Start Backbone history a necessary step for bookmarkable URL's; enables user to click BACK without navigating to entirely different domain
    Backbone.history.start();

=======
], function(App){
  // The "app" dependency is passed in as "App"
  // Again, the other dependencies passed in are not "AMD" therefore don't pass a parameter to this function
  App.initialize();
});
>>>>>>> dev

Date.prototype.toLitterfallDateObject = function() {
	return {
		'y': this.getFullYear(),
		'm': this.getMonth() + 1,
		'd': this.getDate()
	};
};

Date.prototype.fromLitterfallDateObject = function(date) {
	this.setFullYear(date.y);
	this.setMonth(date.m - 1);
	this.setDate(date.d);
};
var orig = {
    matcher: $.fn.typeahead.Constructor.prototype.matcher,
    updater: $.fn.typeahead.Constructor.prototype.updater,
    select: $.fn.typeahead.Constructor.prototype.select,
    listen: $.fn.typeahead.Constructor.prototype.listen
};
//app object contains global app information



// Start Active Nav Tracking

$(function(){
  $(".nav a").click(function(){
    $(this).parent().addClass('active'). // <li>
      siblings().removeClass('active');
  });
});
// End Active Nav Tracking

function toFormattedDate(date){
	
	var return_string = "";
	
	function looper(num, i, num_digit, string) {
		
		var this_digit = (num%(Math.pow(10,i)) - num%(Math.pow(10,i-1)))/Math.pow(10,i-1);
		
		string = this_digit + string;
		
		if (i == num_digit) return string;
		
		i++;
		return looper(num, i, num_digit, string);
	}
	
	return looper(date.m, 1, 2, "") + "/" + looper(date.d, 1, 2, "") + "/" + looper(date.y, 1, 4, "");
	
}

function htmlEntities(str) {
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/\'/g, '&#39;');
}
