// Filename: main.js

//app object contains global app information
var app = {
	config: {
		cgiDir: './cgi-bin/'
	}
};

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

$(document).ready(function(){
	require.config({});
	
    //The global router declaration, handles all of the app's URLs
	var AppRouter = Backbone.Router.extend({
        routes: {
            "data": "accessObservations", //inits the add record "wizard", leads to the edit pages
            "data/:mode": "accessObservations", //inits the add record "wizard", leads to the edit pages
            //"data/reports": "accessObservations",
            "data/:mode/trees/site/:location/plot/:plot": "goToPlot",
            // "data/reports/trees/site/:location/plot/:plot": "goToPlot",
            "data/:mode/trees/site/:location/plot/:plot/treeid/:tree_id(/subtreeid/:sub_tree_id)": "goToTree",
            // "data/reports/trees/site/:location/plot/:plot/treeid/:tree_id(/subtreeid/:sub_tree_id)": "goToTree",
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
						<li><a style="cursor:pointer;" class="add-new-sub-tree-from-row">Add a sub-tree</a></li>\
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
			<% var status_display = ""; %>\
			<% if (tree.status == "alive") { %>\
			<%		status_display = "Alive"; %>\
			<%	} else if (tree.status == "dead_standing"){ %>\
			<%		status_display = "Dead (standing)"; %>\
			<%	} else if (tree.status == "dead_fallen"){ %>\
			<%		status_display = "Dead (fallen)"; %>\
			<% } %>\
				<%= status_display %>\
			</td>\
			<td>\
				<%= tree.latest_DBH_message %>\
			</td>\
			<td>\
				<%= tree.latest_comment %>\
			</td>',
		initialize: function(){
			if (document.location.hash.search("update") === -1) {
				this.renderReport();
			} else {
				this.renderUpdate();
			}
		},
		renderReport: function(){
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
				
		},
		renderUpdate: function(){
			var this_tree = this.model.toJSON();
			/*
			this_tree.this_date = "";
			for (date in this_tree.diameter){                      //loop through the list of existing dates and store the most recent
				if (date > this_tree.this_date){					  //Date format is YYYYMMDD (reformated in template html above)
					this_tree.this_date = date;
				}
			}*/
			
			this_tree.latest_DBH_message = "-";
			this_tree.latest_comment = "-";
			
			if (this_tree.diameter.length > 0) {
				
				// get most recent entry
				// already sorted (the latest comes first) by Tree.parse()
				var most_recent_entry = _.first(this_tree.diameter);
				
				this_tree.latest_DBH_message = most_recent_entry.value + " in " + most_recent_entry.year;
				this_tree.latest_comment = _.isEmpty(most_recent_entry.notes) ? '-' : most_recent_entry.notes;
				
			}
			
			//$el --> gets the jQuery object for this view's element 
			//*.attr('id', this_tree._id.$oid) --> sets 'id' to MongoDB value for tree's ID
			//takes the tree's data, assigns it to this.template, inserts the HTML into the jQuery object for this view's element
			this.$el.attr('id', this_tree._id.$oid).html(_.template(this.templateUpdate, {tree: this_tree}));
			this.$el.addClass("tree-cluster-" + this_tree.tree_id);
			this.$el.children().eq(2).css("font-style","italic");
			this.options.targetEl.append(this.el);	

		},
		events: {
			'click .delete-row': 'deleteTree',
			'click .btn-update': 'goToTree',								//if update button is clicked, runs updateTree function
			'click .btn-analyze': 'goToTree',								//if update button is clicked, runs updateTree function
			'click .add-new-sub-tree-from-row': function() {
				$('.add-new-sub-tree').eq(0).trigger("choosing_parent_tree");
				this.model.trigger("add_new_sub_tree_from_row");
				//this.addSubTree(this.model.get("tree_id"));
			}
		},
		goToTree: function(){
			//goto update tree page
			var sub_id = this.model.get("sub_tree_id");
			var tree_url = "/treeid/" + this.model.get("tree_id") + ((sub_id) ? '/subtreeid/' + sub_id : '');
			app_router.navigate(document.location.hash + tree_url, {trigger: true});
		},
		deleteTree: function(){

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
			
				success: function(model) { // once done
					
					var this_model = model;					
					this_tree_el.fadeOut("slow", function() {						//function called after fadeOut is done
						
						// remove the row--we need this because if we just hide (using visibility:hidden) the row then the table-stripe class will not work
						$("#"+model.get('_id').$oid).remove();

						var target_tree_id = model.get('tree_id');

						// update all the trees under the same tree_id
						$(".tree-cluster-"+target_tree_id).each(function(i) {
						
							// only the full_tree_id would be updated
							var updated_tree = new Tree();
							
							// grab the second child
							var full_tree_id_td = $(this).children('td').eq(1);
							var target_full_tree_id = parseInt(parseFloat(full_tree_id_td.text())*10);
							console.log(target_full_tree_id);
							
							// get the data
							// using oid, because that's the only way it's stable
							updated_tree.url = app.config.cgiDir + 'tree_data.py?oid=' + $(this).attr('id');
							updated_tree.fetch({
								success: function() {
									console.log(updated_tree);
									// update it, only the full tree id, for now
									console.log("tree_id: " + updated_tree.get('tree_id'));
									updated_full_tree_id = updated_tree.get('tree_id') + (updated_tree.get('sub_tree_id') * .1);
									console.log(updated_full_tree_id);
									if (target_full_tree_id * .1 != updated_full_tree_id) {
										full_tree_id_td.text(updated_full_tree_id);
									}
							}
							});
							
						});
						
					});

				}, 
				error: function(model, xhr) {
					
					var deleteTreeError = new errorView({xhr: xhr, id: "delete-tree-error"});
					deleteTreeError.render().$el.insertAfter($("h1").eq(0));
					
				}
			});
		}
	});


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
		<table id="tree-observations" class="table-striped tablesorter">\
			<thead>\
				<tr>\
					<th>Date</th>\
					<th>Observers</th>\
					<th>\
						DBH (cm) <a href="#" class="dbh" rel="tooltip" data-placement="top" data-original-title="Diameter at Breast Height"><small>info</small></a>\
					</th>\
					<th>\
						Status\
					</th>\
					<th>\
						Comments\
					</th>\
				</tr>\
			</thead>\
			<tbody>\
			<% _.each(tree.diameter, function(entry){ %>\
			<tr>\
				<td><span class="display_cell year"><%= toFormattedDate(entry.date) %></span>\
				<td><span class="display_cell observers"><%= entry.observers.join(", ") %></span>\
				<td><span class="display_cell diameter"><%= entry.value %></span>\
				<td><span class="display_cell status"><%= entry.status %></span>\
				<td><span class="display_cell notes"><%= entry.notes %></span>\
			</tr>\
			<% }); %>\
			</tbody>\
			</table>\
		',
		rowEntryTemplateUpdate: '\
				<td class="btn-column">\
					<div class="show-obs-info display_cell btn-group">\
						<button class="btn btn-mini btn-primary edit-existing" type="button">Edit</button>\
						<button class="btn-delete-observation btn btn-mini btn-warning" type="button">Cancel</button>\
					</div>\
					<div class="edit-obs-info edit_cell btn-group">\
						<button class="btn-save-observation btn btn-mini btn-success" type="button">Submit</button>\
						<button class="btn-cancel-observation btn btn-mini btn-danger" type="button">Cancel</button>\
					</div>\
				</td>\
				<td class="editable">\
					<span class="display_cell date_select"><%= toFormattedDate(entry.date) %></span>\
					<span class="edit_cell date_select"><input title="Enter a date in mm/dd/yyyy format. It may not already have an associated diameter entry or be in the future." type="text" value="<%= toFormattedDate(entry.date) %>"/>\
				</td>\<td class="editable"><span class="show-obs-info display_cell observers"><%= entry.observers.join(", ") %></span><span class="edit-obs-info edit_cell observers"><input title="Observers field may not be empty." type="text" value="<%= entry.observers %>"></span></td>\
				<td class="editable"><span class="show-obs-info display_cell diameter"><%= entry.value %></span><span class="edit-obs-info edit_cell diameter"><input title="Please enter an integer or floating point number such as 5, 6.1, 10.33" type="text" value="<%= entry.value %>"></span></td>\
				<td class="editable"><span class="show-obs-info display_cell status"><%= entry.status %></span><span class="edit-obs-info edit_cell status"><div class="edit-obs-info status btn-group btn-group-vertical" data-toggle="buttons-radio">\
  					<button type="button" class="btn btn-mini btn-info status alive" style="width: 120px" value="alive">Alive</button>\
  					<button type="button" class="btn btn-mini btn-warning status dead_standing" style="width: 120px" value="dead_standing">Dead (standing)</button>\
 					<button type="button" class="btn btn-mini btn-danger status dead_fallen" style="width: 120px" value="dead_fallen">Dead (fallen)</button>\
					</div></span></td>\
				<td class="editable"><span class="show-obs-info display_cell notes"><%= entry.notes %></span><span class="edit-obs-info edit_cell notes"><input type="text" value="<%= entry.notes %>"></span></span></td>\
		',
		templateUpdate: '\
		<div id="tree-info">\
			<button class="btn btn-success btn-mini edit-tree-info-btn">Edit Tree Info</button>\
			<div class="edit-tree-info btn-group">\
				<button class="btn-save-tree-info btn btn-mini btn-success" type="button">Submit</button>\
				<button class="btn-cancel-tree-info btn btn-mini btn-danger" type="button">Cancel</button>\
			</div>\
			\
			<span class="form-horizontal">\
				<div class="control-group edit-tree-info species">\
					<label class="control-label" for="edit-tree-species">Species: </label>\
					<div class="controls">\
						<select></select>\
						<small class="help-inline"></small>\
						<span class="help-block"></span>\
					</div>\
				</div>\
				\
				<div class="control-group edit-tree-info">\
					<label class="control-label" for="edit-tree-angle">Angle: </label>\
					<div class="controls">\
						<span class="edit-tree-info angle">\
						<input type="text" id="edit-tree-angle" value="<%= tree.angle %>">\
						<small class="help-inline">Degrees</small>\
						<span class="help-block"></span></span>\
					</div>\
				</div>\
				\
				<div class="control-group edit-tree-info">\
					<label class="control-label" for="edit-tree-distance">Distance: </label>\
					<div class="controls">\
						<span class="edit-tree-info distance">\
						<input type="text" id="edit-tree-distance" value="<%= tree.distance %>">\
						<small class="help-inline">Meters</small>\
						<span class="help-block"></span></span>\
					</div>\
				</div>\
			</span>\
			<div class="display-tree-info">Species: <span class="species"><%= tree.species %></span></div>\
			<div class="display-tree-info">Angle: <span class="angle"><%= tree.angle %></span></div>\
			<div class="display-tree-info">Distance: <span class="distance"><%= tree.distance %></span></div>\
		<div class="button-row">\
			<button class="btn-new-observation btn btn-mini btn-success pull-left" type="button">+ New Entry</button>\
		</div>\
		<table id="tree-observations" class="table-striped tablesorter">\
			<thead>\
				<tr>\
					<th class="btn-column"></th>\
					<th>Date</th>\
					<th>Observers</th>\
					<th>\
						DBH (cm) <a href="#" class="dbh" rel="tooltip" data-placement="top" data-original-title="Diameter at Breast Height"><small>info</small></a>\
					</th>\
					<th>\
						Status\
					</th>\
					<th>\
						Comments\
					</th>\
				</tr>\
			</thead>\
			<tbody>\
			<% _.each(tree.diameter, function(entry, index) { %>\
				<tr id="entry-<%= index %>">\
					<td class="btn-column">\
						<div class="show-obs-info display_cell btn-group">\
							<button class="btn btn-mini btn-primary edit-existing" type="button">Edit</button>\
							<button class="btn-delete-observation btn btn-mini btn-warning" type="button">Delete</button>\
						</div>\
						<div class="edit-obs-info edit_cell btn-group">\
							<button class="btn-save-observation btn btn-mini btn-success" type="button">Submit</button>\
							<button class="btn-cancel-observation btn btn-mini btn-danger" type="button">Cancel</button>\
						</div>\
					</td>\
					<td class="editable">\
						<span class="display_cell date_select"><%= toFormattedDate(entry.date) %></span>\
						<span class="edit_cell date_select"><input data-original-title="Enter a date in mm/dd/yyyy format. It may not already have an associated diameter entry or be in the future." type="text" value="<%= toFormattedDate(entry.date) %>"/>\
					</td>\<td class="editable"><span class="show-obs-info display_cell observers"><%= entry.observers %></span><span class="edit-obs-info edit_cell observers"><input title="Who collected this data" type="text" value="<%= entry.observers %>"></span></td>\
					<td class="editable"><span class="show-obs-info display_cell diameter"><%= entry.value %></span><span class="edit-obs-info edit_cell diameter"><input title="Please enter an integer or floating point number such as 5, 6.1, 10.33" type="text" value="<%= entry.value %>"></span></td>\
					<td class="editable"><span class="show-obs-info display_cell status"><%= entry.status %></span><span class="edit-obs-info edit_cell status"><div class="edit-obs-info status btn-group btn-group-vertical" data-toggle="buttons-radio">\
  					<button type="button" class="btn btn-mini btn-info status alive" style="width: 120px" value="alive">Alive</button>\
  					<button type="button" class="btn btn-mini btn-warning status dead_standing" style="width: 120px" value="dead_standing">Dead (standing)</button>\
 					<button type="button" class="btn btn-mini btn-danger status dead_fallen" style="width: 120px" value="dead_fallen">Dead (fallen)</button>\
					</div></span></td>\
					<td class="editable"><span class="show-obs-info display_cell notes"><%= entry.notes %></span><span class="edit-obs-info edit_cell notes"><input type="text" value="<%= htmlEntities(entry.notes) %>"></span></span></td>\
				</tr>\
			<% }); %>\
			</tbody>\
			</table>\
			<div class="button-row">\
				<button class="btn-new-observation btn btn-mini btn-success pull-left" type="button">+ New Entry</button>\
			</div>\
		',
		initialize: function(){
			
			this.render();
			
		},
		is_report: function() {
			return document.location.hash.search("update") === -1;
		},
		render: function() {
		
			if (this.is_report() === true) {
				this.renderReport();
				// this.model.on('change', this.renderReport, this); //re-render when the model is saved (new observation, or an edit)
			} else {
				this.renderUpdate();
				//this.model.on('change', this.renderUpdate, this.model); //re-render when the model is saved (new observation, or an edit)
			}
			
			return this;
			
		},
		renderReport: function(){
			
			var this_tree = this.model.toJSON();
			//get the dates in descending order
			var dates = this_tree.diameter.sort(function(a,b){return (b.year-a.year)});
			this_tree.dates_desc = dates;
			this.$el.html(_.template(this.templateReport, {tree: this_tree}));
			$(".back").attr("href", "#data/reports/trees/site/" + $(".site-name").text() + "/plot/" + $(".plot-number").text());
			$(".title").text("Analyzing Tree Data ");
			$("#tree-observations").tablesorter();
		},
		renderUpdate: function(){
		
			var this_tree = this.model.toJSON();
			//get the dates in descending order
			var dates = this_tree.diameter.sort(function(a,b){return (b.year-a.year)});
			this_tree.dates_desc = dates;
			this.$el.html(_.template(this.templateUpdate, {tree: this_tree}));
			$(".title").text("Updating Tree Data ");
			$("#tree-observations").tablesorter({headers: { 0: { sorter: false}}}); 
			$(".show-obs-info").show();
			$(".edit-obs-info").hide();
			this.postRender();
	
		},
		postRender: function(){
			//add any methods/functions that need to be call after redendering the Tree edit view
			this.populateSpecies();
		},
		populateSpecies: function(){
			var tree_species = this.model.get('species');
			
			$.getJSON('data/tree_species.json', function(data){
				$.each(data, function(index, value) {
				
					if (value == tree_species) {
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
			'click .btn-delete-observation': 'deleteObservation',
			'click .edit-tree-info-btn': 'editTreeInfo',
			'click .btn-cancel-tree-info': 'cancelEditTreeInfo',
			'click .btn-save-tree-info': 'saveTreeInfo',
			'change .edit_cell': 'validateField',
			'blur .angle' : 'validateAngle',
			'blur .distance' : 'validateDistance'
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

			// if edited info doesn't pass validation, just return out of saving
			if (! this.validateAngle() || ! this.validateDistance()) {
				console.log("failed validation");
				return false;
			}
			
			this.model.set({
				'species': $("#tree-info .species select").val(),
				'angle': parseInt($("#tree-info .angle input").val(), 10),
				'distance': parseFloat(parseFloat($("#tree-info .distance input").val(), 10).toFixed(2))
			});
			
			var self = this;
			
			this.model.save({}, {
				success: function() {if (self.is_report() === false) self.renderUpdate();}
			});
		},
		validateAngle: function() {

			var $angle = $('#edit-tree-angle');
			
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
		
			// get distance entered
			var $distance = $('#edit-tree-distance');

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
				$target.parent().parent().parent().removeClass("success").addClass("error");
				$target.parent().find(".help-block").text(error);
				return false;
			} else {
				$target.parent().parent().parent().removeClass("error").addClass("success");
				$target.parent().find(".help-block").empty();
				return true;
			}
		},
		newObservation: function(){
		
			$(".btn-new-observation").hide();

			//add a new blank row to the observation table
			var today = new Date();

			// if today's date already has an entry, set a template dateKey using tomorrow's date (which the user will be forced to change to pass validation)
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
			
		},

		editObservation: function(event) {
			// User wants to edit an existing observation. 

			$(".btn-new-observation").hide()
			 
			$row_to_edit = $(event.target).parents("tr");		// Get the row of edit button 
			$row_to_edit.addClass("edit");
			// Hide any existing edit modes
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
			
		},

		cancelEditObservation: function() {
			// user wants to cancel any edits made, or is canceling after adding a new entry
			this.model.fetch(); // retrieves recent data
			$("#tree-observations > tr").removeClass("new");
			$("#tree-observations > tr").removeClass("edit");
			$(".btn-new-observation").show();
			this.render();      // NOTE: this is sort of a hack to exit the editing view
		},

		saveObservation: function(event) {
			// User added or edited an observation.  Save it to the server.	
			
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
		},

		validateDate: function($current_row) {
		
			/*  get date to validate  */
			// date shown in input box -- will be what was chosen in datepicker OR whatever the user manually enters
			var date_entered = new Date(($current_row.find(".edit_cell.date_select :input")).val());
			var date_parts = ($current_row.find(".edit_cell.date_select :input")).val().split("/"); // splits into mm dd and yyyy
			var today = new Date();

			/* make sure entry is a valid date format (mm/dd/yyyy) */
			if (date_parts.length != 3 || 
				date_parts[0].length != 2 || 			
				date_parts[0] > 12 ||
				date_parts[1].length != 2 || 
				date_parts[1] > 31 ||
				date_parts[2].length != 4){		
				return "Enter a date in mm/dd/yyyy format or choose your date from the DatePicker.";
			} 
			/* make sure date isn't in future*/
			else if (date_entered > today){  
				return "A data collection date may not be in the future... Don't fake the data, man.";
			} 
			/* make sure date isn't befre data collection began */
			else if (date_entered.getFullYear() < 2002) {
				return "Data was not collected before 2002... Why are you adding entries for earlier dates?";
			}
			
			/* make sure date doesn't already have a measurement listed for this tree */	
			var this_row_index;
			if ($current_row.hasClass("new")) {
				this_row_index = -1;	// dummy variable so that all other dates are looped through
			} else {
				this_row_index = parseInt(($current_row.attr("id")).split("-")[1]);
			}
			var existing_entries = this.model.get('diameter');
			for (i in existing_entries) {
				if (i == this_row_index) {
					continue;	// skip checking if the date is the same as it was before 
				}
				if (existing_entries[i].date.y == date_entered.getFullYear()
						&& existing_entries[i].date.m == (date_entered.getMonth() + 1)
			 			&& existing_entries[i].date.d == date_entered.getDate()) {
					return "Trees don't grow that quickly... why are you entering a date that already has an\
									associated diameter measurement?  Please make sure you are entering the correct\
									date, or edit the existing entry.";
				}
			}
			return false;
		},

		validateObservers: function($current_row) {

			// get observers entry and format
			var obs_entered = $current_row.find(".observers :input").val().split(",");	

			// make sure some observers were entered
			if (obs_entered[0] === "") {
				return "Observers field may not be empty.";
			}
			
			return false;

		},

		validateDiameter: function($current_row) {

			// get diameter entry
			var diam_entered = parseFloat($current_row.find(".diameter :input").val());

			// make sure the diameter is in correct format (can be parsed as float)
			if (isNaN(diam_entered)) {
				return "Please enter an integer or floating point number such as 5, 6.1, 10.33";
			} 
			
			return false;
			
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

		getAllObservers: function() {
			//finds all observers that have been previously entered into the database
			var observers_array = [];
			
			$.getJSON(app.config.cgiDir + 'tree_data.py?site=allObservers', function(data) {
				
				for (i in data) {
					observers_array.push(data[i]);
				}
				
				return observers_array;
			});
			
			return observers_array;
		}
	});

	var singleOption = Backbone.Model.extend({});								//creates empty Model (to be a site, once information is loaded)

	var selectionOptions = Backbone.Collection.extend({							//creates Collection of singleOption Models (to-be locations, plots, collection type)
		model: singleOption,
		url: "data/sites.json",													//calls for server DB's location (plot, etc. information)
    	parse: function(response){												
    		var parsed_options = [];												
    		for (element in response){											//for objects within JSON return object
    			if (_.isString(response[element])){								//if the response is a string (e.g., a location), store it in the array:
    				parsed_options.push({										//for Backbone's use, stores object from JSON information as key:value pair (object)
    					value: response[element],
    					name: response[element].charAt(0).toUpperCase() + response[element].slice(1)
    				});
    			} else {
    				parsed_options.push(response[element]);						//<WHAT DOES THIS DO?> [ ]
    			}
    		}
    		return parsed_options;
    	}
	});
	
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


	//Declare the tree object (Model)
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
			this.on('invalid', this.showError);
		},
		showError: function(){
			//TODO show the validation error that is set in the validate method
			console.log(this.validationError);
		},
		plotViewInitialize: function(){
			var plot_row = new plotRowView({
				targetEl: $("#plot-table"),
				model: this
			});
		},
		editViewInitialize: function(){
			var edit_form = new treeEditView({
				el: $('#tree-edit-view'),
				model: this
			});
		},
		parse: function(response){
			
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
			
			return response;
		},
		// overriding the save method, so that when the model saves it updates its inside to match what the server sends back
		save: function(attrs, options) {
			
			var result = Backbone.Model.prototype.save.call(this, attrs, options);
			
			var self = this;
			if (result !== false) {
				result.done(function(data) {self.set(data);});
			}
			
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

		newSubTreeRowViewInitialize: function() {
			var sub_tree_row = new newSubTreeRowView({
				model: this
			});
		}

	});

	//Declare the plot collection, contains tree objects
	var Plot = Backbone.Collection.extend({
		model: Tree,
		url: "/",
		choosing_parent_tree: false,
  		initialize: function(){
  			this.on('reset', this.renderTrees); 

  		},
  		render: function() {
  			this.renderTrees();
  			return this;
  		},
  		renderTrees: function(){
  			var site_name = "";
  			var plot_number = 0;
  			var max_diam = 0;
  			
  			var this_plot = this;
  			
  			this.each(function(tree){
  				tree.plotViewInitialize();
  				var num_obvs = tree.get("diameter").length;

  				this_plot.listenTo(tree, 'add_new_sub_tree_from_row', function() {this_plot.addSubTree(tree.get('tree_id'));});
  				
  				// determine the maximum number of observations for any tree in this plot
  				// to allocate enough columns in the CSV file
  				if (num_obvs > max_diam) {
  					max_diam = num_obvs;
  				}
  			}, this);


  			$(".dbh").attr("href", document.location.hash);
  			$(".btn").css("display", "inline-block");
    		
    		// add tablesorter jquery plugin (no sorting for first column)
  			$("#plot-table").tablesorter({headers: { 0: { sorter: false}}}); 
  			// populate the diameter entries based on user's given years
  			this.populateTreeDiameters();

  			// set up column headers for CSV
  			var CSV = "Full Tree ID,Species,Angle,Distance"
  			for(var i = 1; i <= max_diam; i++) {
  				CSV += "," + "Obs Date " + i + ",Diameter " + i + ",Notes " + i;
  			}

  			var j = 0;
  			var agt=navigator.userAgent.toLowerCase();
  			console.log(agt);
  			if (agt.indexOf("firefox") != -1 || agt.indexOf("msie") != -1){
  				$(".export-info").attr("data-original-title", "Open the file in a text editor, then save it as a file with a .csv extension.");
  				$(".export-info").attr("href", "https://www.google.com/intl/en/chrome/browser/");
  			} else if (agt.indexOf("msie") != -1){
				$(".export-info").attr("data-original-title", "This WILL NOT WORK if you are using Internet Explorer. Click to download a better browser before proceeding.");
			} else if (agt.indexOf("chrome") != -1){
				 $(".export-info").attr("data-original-title", "Opening the resulting file should launch MS Excel.");
			}else if (agt.indexOf("safari") != -1){
  				console.log("safari found");
  				$(".export-info").attr("data-original-title","Select 'Save as...' from the File menu and enter a filename that uses a .csv extension.");
  			}
  			
  			$(".export").click(function(e) {
  				// query database for all trees in the plot
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
						});
					CSV += "\nDisclaimer: dates before 2013 are approximate. All data during that range was collected between September and October of the specified year.";
					// adds formatted data to a hidden input on the page
					$("#CSV").empty().append(CSV);
					$(".export").val("Click to open file");
					$(".export").addClass("btn-success");
					j = 1;
					});
				}
				// ensures information has loaded before opening the CSV file
				/*
				if (j > 0) {
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
  			});
    	},
		populateTreeDiameters: function(){
    		// get year range user wished to view data from
			var start_year = $("#start-year").val();
  			var end_year = $("#end-year").val();
			var num_years = $("#end-year").val()-$("#start-year").val() + 1;
			
			if (start_year > end_year){
				// switch years so user doesn't have to be specific about which direction their date range goes
				var temp_year = start_year;
				start_year = end_year;
				end_year = temp_year;
			}
			
			$('.date-entry').hide();
			for (var i=parseInt(start_year); i<=parseInt(end_year); i++){
				$('.y-'+i).show();
			}

			//format header row to make the DBH cell span all the years specified
  		//	document.getElementById("DBH").colSpan = num_years;
    	},
  		addTree: function(){

  			
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

  		},
		addSubTree: function(tree_id) {
  			var parent_tree = this.find(function (tree) {return tree.get('tree_id') == tree_id;});
  			
  			var new_tree = new Tree({
  				tree_id: tree_id,
  				sub_tree_id: -1,
  				species: parent_tree.get('species'),
  				plot: parent_tree.get('plot'),
  				site: parent_tree.get('site'),
  				angle: parent_tree.get('angle'),
  				distance: parent_tree.get('distance')
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
  		}
  	});

    // Instantiate the router
    var app_router = new AppRouter;
   
    //default route is the App Home Page
    app_router.on('route:defaultRoute', function (actions) {
    	$(".home").addClass("active");
    	$(".data").removeClass("active");
    	var  template_file = 'index.html';
		require(['lib/text!templates/' + template_file + '!strip'], function(templateHTML){			//require's library takes HTML templates
			$('#main').html(templateHTML);
		});
    });
    
    //Site, plot selection
    app_router.on('route:accessObservations', function () {											//listening for user action (for user to select location and plot)
    	$(".data").addClass("active");
    	$(".home").removeClass("active");
    	var  template_file = 'update.html';
		require(['lib/text!templates/' + template_file + '!strip'], function(templateHTML){			
			$('#main').html(templateHTML);
			var location_options = new selectionOptions;
			location_options.url = app.config.cgiDir + "tree_data.py?site=all";						//creates list with all possible locations
			var location_select = new selectionOptionsView({
				el: $('#site-select'),																//populates new selectionOptionsView with locations (sites)
				collection: location_options
			});
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
			});
		});
    });
    
    //Plot view
    app_router.on('route:goToPlot', function(mode, site, plot) {		
    	//reloads page based on selected location (site) and plot
		$(".data").addClass("active");
    	$(".home").removeClass("active");
    	
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

		} else if (mode == 'update') {		
			
			console.log("updating");
			
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
				
	
			});
			
		}
    });
    
    //Edit tree view
    app_router.on('route:goToTree', function(mode, site, plot, tree_id, sub_tree_id) {						//reloads page based on selected location (site) and plot
    	$(".data").addClass("active");
    	$(".home").removeClass("active");
    	var  template_file = 'update-tree.html';
		require(['lib/text!templates/' + template_file + '!strip'], function(templateHTML){			//<WHAT DOES THIS FUNCTION DO?> [ ] (some sort of require wrapper)

			if (typeof sub_tree_id === 'undefined'){
   				sub_tree_id = '0';
 			} else {
 				sub_tree_id = sub_tree_id;
 			}

			$('#main').html(_.template(templateHTML, {
				site: decodeURI(site), 
				plot: plot,
				tree_id: tree_id,
				sub_tree_id: sub_tree_id
			}));


			var this_tree = new Tree();
			this_tree.url = app.config.cgiDir + 'tree_data.py?site=' + site + '&plot=' + plot + '&treeid=' + tree_id + '&subtreeid=' + sub_tree_id;
			this_tree.fetch({
				success: function() {
					this_tree.editViewInitialize();
				}
			});
			
			
			//DBH Tooltip 
			updateFunctions();
		});
    });
    
    // Start Backbone history a necessary step for bookmarkable URL's; enables user to click BACK without navigating to entirely different domain
    Backbone.history.start();

});
// Start Bootstrap and template related jQuery

function updateFunctions(){
	$('.dbh').tooltip({trigger:'hover'});
	$('.dropdown-toggle').dropdown();
	
}

// End Bootstrap and template related jQuery

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

/*

$('#plot-table').dataTable( {
    "bPaginate": false,
    "bLengthChange": false,
    "bFilter": true,
    "bSort": true,
    "bInfo": false,
    "bAutoWidth": false
} )
*/
