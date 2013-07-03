// Filename: main.js

//app object contains global app information
var app = {
	config: {
		cgiDir: './cgi-bin/'
	}
};

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
		<div class="modal-body"><p>\
			<form class="form-horizontal">\
				<div class="control-group">\
					<label class="control-label" for="new-tree-species">Species</label>\
					<div class="controls">\
						<input type="text" id="new-tree-species" placeholder="Species" style="font-style: italic;">\
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
		</p></div>\
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
				this.remove();
				if (self.isSubTree) {
					$('.add-new-sub-tree').eq(0).trigger("not_choosing_parent_tree");
				}
			});

			return this;

		},
		addAutocomplete: function() {

			// Array to contain species
			var all_species = [];

			// Get all the species first
			$.getJSON(app.config.cgiDir + 'litterfall.py?site=allSpecies', function(data) {
				for (i in data) {
					all_species[i] = data[i];
				}
			});

			// Add autocomplete
			$("#new-tree-species").autocomplete({
				minLength: 0,
				source: all_species,
				appendTo: "#add-new-tree-modal" // so that the list moves along with the model
			})
			.focus(function() { // when focus, trigger autocomplete
				$(this).autocomplete("search");
			});

			// Limit the height of the dropdown list
			// (Forget IE6 Compatibility)
			$(".ui-autocomplete").css({
				'max-height': '200px',
				'overflow-y': 'auto',
				'overflow-x': 'hidden'
			});

		},
		events: {
			'click .btn-save-and-back': function() {
				this.addAndSaveTree(true);
			},
			'click .btn-save-and-update': function() {
				this.addAndSaveTree(false);
			},
			'change #new-tree-angle': 'validateAngle',
			'change #new-tree-distance': 'validateDistance',
			'change #new-tree-species': 'validateSpecies'
		},
		validateSpecies: function() {

			var $species = $('#new-tree-species');

			var error = false;

			if ($species.val() == '') {
				error = "This cannot be empty";
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

			var number_regex = /^[0-9]*$/;

			var error = false;

			if ($distance.val() == '') {
				error = "This cannot be empty.";
			} else if (!number_regex.test($distance.val())) {
				error = "A distance should be a number.";
			} else if (parseInt($distance.val()) > 30 || parseInt($distance.val()) < 0) {
				error = "Do you think it is a bit too far?";
			}

			return this.addErrorMessage($distance, error);

		},
		addErrorMessage: function($target, error) {
			if (error !== false) {
				$target.parent().parent().addClass("error");
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
			this.model.url = app.config.cgiDir + 'litterfall.py';
			var self = this;
			this.model.validate = function() {
				if (!(self.validateAngle() || self.validateDistance() || self.validateSpecies())) {
					return "Invalid data";
				}
				
			}
			this.model.on("invalid", function() {
				$('#add-modal .error').eq(0).focus();
			});

			// save!
			this.model.save({
				species: $('#new-tree-species').val(),
				angle: parseInt($('#new-tree-angle').val()),
				distance: parseInt($('#new-tree-distance').val()),
				success: function() {
					self.$el.modal("hide");
					if (back_to_plot == true) {
						/* if (self.isSubTree === true) {
							$(".add-new-sub-tree").trigger("click");
						} */
						console.log("we're saving a new tree now??");
						self.trigger("tree_saved");
					} else {
						app_router.navigate(document.location.hash + "/treeid/" + self.model.get("tree_id"), {trigger: true});
					}
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
			<% var status_display = ""; %>\
			<% if (tree.status == "alive") { %>\
			<%		status_display = <i class="icon-tree-deciduous"></i> + "Alive"; %>\
			<%	} else if (tree.status == "dead_standing"){ %>\
			<%		status_display = <i class="icon-skull"></i> + "Dead (standing)"; %>\
			<%	} else if (tree.status == "dead_fallen"){ %>\
			<%		status_display = <i class="icon-skull"></i> + "Dead (fallen)"; %>\
			<% } %>\
			<td>\
				<%= tree.status %>\
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
			<% var status_display = ""; %>\
			<% if (tree.status == "alive") { %>\
			<%		status_class="icon-leaf"; %>\
			<%		status_display = "Alive"; %>\
			<%	} else if (tree.status == "dead_standing"){ %>\
			<%		status_class="icon-skull"; %>\
			<%		status_display = "Dead (standing)"; %>\
			<%	} else if (tree.status == "dead_fallen"){ %>\
			<%		status_class="icon-skull"; %>\
			<%		status_display = "Dead (fallen)"; %>\
			<% } %>\
			<td>\
				<i class="icon status-icon"></i>\
				<%= status_display %>\
				<% $(".status-icon").addClass(status_class); %> \
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
				this.addSubTree(this.model.get("tree_id"));
			}
		},
		goToTree: function(){
			//goto update tree page
			var sub_id = this.model.get("sub_tree_id");
			var tree_url = "/treeid/" + this.model.get("tree_id") + ((sub_id) ? '/subtreeid/' + sub_id : '');
			app_router.navigate(document.location.hash + tree_url, {trigger: true});
		},
		deleteTree: function(){
			var this_tree_el = this.$el;
			this.model.url = app.config.cgiDir + 'litterfall.py';
			var result = this.model.destroy();
			if (result !== false) {
			
				this_model = this.model;
				
				result.done(function() { // once done
					
					this_tree_el.fadeOut("slow", function() {						//function called after fadeOut is done
						
						// remove the row--we need this because if we just hide (using visibility:hidden) the row then the table-stripe class will not work
						$("#"+this_model.get('_id').$oid).remove();
						
						var target_tree_id = this_model.get('tree_id');
						
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
							updated_tree.url = app.config.cgiDir + 'litterfall.py?oid=' + $(this).attr('id');
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
				});
			}
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
				<td class="editable"><span class="show-obs-info display_cell status"><%= entry.status %></span><span class="edit-obs-info edit_cell status"><div class="edit-obs-info status" data-toggle="buttons-radio">\
  					<button type="button" class="btn btn-mini btn-info status alive" style="width: 120px" value="alive">Alive</button><br>\
  					<button type="button" class="btn btn-mini btn-warning status dead_standing" style="width: 120px" value="dead_standing">Dead (standing)</button><br>\
 					<button type="button" class="btn btn-mini btn-danger status dead_fallen" style="width: 120px" value="dead_fallen">Dead (fallen)</button><br>\
					</div></span></td>\
				<td class="editable"><span class="show-obs-info display_cell notes"><%= entry.notes %></span><span class="edit-obs-info edit_cell notes"><input type="text" value="<%= entry.notes %>"></span></span></td>\
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
						<span class="edit_cell date_select"><input title="Enter a date in yyyy/mm/dd format. It may not already have an associated diameter entry or be in the future." type="text" value="<%= toFormattedDate(entry.date) %>"/>\
					</td>\<td class="editable"><span class="show-obs-info display_cell observers"><%= entry.observers %></span><span class="edit-obs-info edit_cell observers"><input title="Observers field may not be empty." type="text" value="<%= entry.observers %>"></span></td>\
					<td class="editable"><span class="show-obs-info display_cell diameter"><%= entry.value %></span><span class="edit-obs-info edit_cell diameter"><input title="Please enter an integer or floating point number such as 5, 6.1, 10.33" type="text" value="<%= entry.value %>"></span></td>\
					<td class="editable"><span class="show-obs-info display_cell status"><%= entry.status %></span><span class="edit-obs-info edit_cell status"><div class="edit-obs-info status" data-toggle="buttons-radio">\
  					<button type="button" class="btn btn-mini btn-info status alive" style="width: 120px" value="alive">Alive</button><br>\
  					<button type="button" class="btn btn-mini btn-warning status dead_standing" style="width: 120px" value="dead_standing">Dead (standing)</button><br>\
 					<button type="button" class="btn btn-mini btn-danger status dead_fallen" style="width: 120px" value="dead_fallen">Dead (fallen)</button><br>\
					</div></span></td>\
					<td class="editable"><span class="show-obs-info display_cell notes"><%= entry.notes %></span><span class="edit-obs-info edit_cell notes"><input type="text" value="<%= entry.notes %>"></span></span></td>\
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
			$.getJSON(app.config.cgiDir + 'litterfall.py?site=allSpecies', function(data) {
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
			
			var self = this;
			
			this.model.save({}, {
				success: function() {if (self.is_report() === false) self.renderUpdate();}
			});
		},
		newObservation: function(){
			$(".btn-new-observation").hide()

			//add a new blank row to the observation table
			var today = new Date();

			// if today's date already has an entry, set a template dateKey using tomorrow's date (which the user will be forced to change to pass validation)
			var new_entry = {
				date: today.toLitterfallDateObject(),
				year: today.getFullYear(),
				value: 'n/a',
				notes: "",
				observers: [],
				status: ""
			};
			
			// new jQuery row to be prepended
			// class="new" to mark the row as new
			
			var $new_entry_row = $('<tr></tr>').addClass("new").html(_.template(this.rowEntryTemplateUpdate, {entry: new_entry, tree: this.model}));
			
			/*
			// Sorry, Jocelyn!
			var existing_years = [];
			$.each($(".show-obs-info.year"), function(i, obs) {
				existing_years.push($(obs).text());
			});
			// Show edit content, hide display content, show "Submit/cancel button", add date_picker		
			$new_entry_row.find(".edit-obs-info").show();
			$new_entry_row.find(".show-obs-info").hide();
			$new_entry_row.find(".select-info").show();
			//populate dropdown menu with years not yet recorded
			$("#tree-observations > tbody").prepend($new_entry_row);
			for (var i = new_entry.year; i >= 2002; i--) {
				already = false;
				for (var j = 0; j < existing_years.length; j++) {
					if (i == parseInt(existing_years[j])) {
						already = true;
					}
				} 				
				$(".year select").append($("<option></option>").attr("value", i).text(i).attr("id", i));
				if (already == true) {
					$("#" + i).addClass("already");
				}
			}
			$(".already").remove();
			if ($(".year select").length === 0) {
				alert("already all years");
			}
			
			// prepend it to the table
			*/
			$('#tree-observations tbody').prepend($new_entry_row);
			
			$new_entry_row.find(".edit-obs-info").show();

			$new_entry_row.find(".edit_cell").show();
			$new_entry_row.find(".display_cell").hide();
			$new_entry_row.find(".edit_cell.date_select :input").datepicker({
				maxDate: 0,
				changeYear: true,
				changeMonth: true,
				constrainInput: true
			});
			
			// Disable all the other edit buttons
			// Why do we need to do that though?
			$("#tree-observations .btn.display_cell").hide();
			
			//var existingObs = this.model.findAllObservers();
			var all_observers = this.getAllObservers();
			$new_entry_row.find(".edit_cell.observers :input").typeahead({source: all_observers});
		},

		editObservation: function(event) {
			$(".btn-new-observation").hide()
			// User wants to edit an existing observation.  
			$row_to_edit = $(event.target).parents("tr");		// Get the row of edit button 
			$row_to_edit.addClass("edit");
			// Hide any existing edit modes
			$("#tree-observations .btn.display_cell").hide();
			$row_to_edit.find(".edit-obs-info").show();
			console.log($row_to_edit.find("." + this.model.get("status")));
			$row_to_edit.find("." + this.model.get("status")).addClass("active");
			/*
			var curr_year = new Date().getFullYear();
			var existing_years = [];
			$.each($(".show-obs-info.year"), function(i, obs) {
				existing_years.push($(obs).text());
			});
			// Show edit content, hide display content, show "Submit/cancel button"
			$row_to_edit.find(".edit-obs-info").show();
			$row_to_edit.find(".show-obs-info").hide();
			$row_to_edit.find(".select-info").show();
			//populate dropdown menu with years not yet recorded
			for (var i = curr_year; i >= 2002; i--) {
				already = false;
				for (var j = 0; j < existing_years.length; j++) {
					if (i == parseInt(existing_years[j])) {
						already = true;
					}
				} 				
				$(".edit > td > span > select").append($("<option></option>").attr("value", i).text(i).attr("id", i));
				if (already == true) {
					$("#" + i).addClass("already");
				}
			}
			var y = $(".edit > td > .show-obs-info.display_cell.year").text();
			$("#" + y).after($("<option></option>").attr("value", y).text(y).attr("selected", "selected"));
			// get all observers existing in database, feed them into an autocomplete for the observers field
			*/
			
			$row_to_edit.find(".edit_cell").show();
			$row_to_edit.find(".display_cell").hide();
			$row_to_edit.find(".edit_cell.date_select :input").datepicker({
				dateFormat: "mm/dd/yy", 
				maxDate: 0, 
				changeYear: true, 
				changeMonth: true, 
				constrainInput: true
			});
			$row_to_edit.addClass("old");
			
			var all_observers = this.getAllObservers();
			$row_to_edit.find(".edit_cell.observers :input").typeahead({source: all_observers});
			$(".already").remove();
			
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
			
			// Get the row that is being edited
			var $row_to_save = $(event.target).parents("tr");
			
			// is it a new row, or an old one?
			var is_this_row_new = $row_to_save.hasClass("new");
			
			var entries_array = this.model.get("diameter");
			
			// convert observers from string to array
			var new_observers = $row_to_save.find(".observers :input").val().split(",");
			for (var i = 0; i < new_observers.length; i++){
				new_observers[i] = new_observers[i].trim(" ");
			}
			
			// var new_date = new Date(parseInt($row_to_save.find(".unix-time").val()));
			
			// new entry object
			var new_entry = {
				date: ($row_to_save.find(".edit_cell.date_select :input").datepicker("getDate")).toLitterfallDateObject(),
				year: ($row_to_save.find(".edit_cell.date_select :input").datepicker("getDate")).getFullYear(),
				value: parseFloat($row_to_save.find(".diameter :input").val()),
				observers: new_observers,
				notes: $row_to_save.find(".notes :input").val(),
				status: $row_to_save.find(".status.active").val()
			};				
			this.model.set('status', $row_to_save.find(".status.active").val());
			console.log($row_to_save.find(".status.active").val());
			console.log(this.model);
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
			
			$("#tree-observations > tr").removeClass("edit");
			this.model.save();
			this.render();		
			

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
				self.model.save();
				self.render();
				
			});
			
		},
		validateField: function(event){

			var field_to_validate = event.currentTarget.className;
			var current_row = $("#tree-observations > tbody > tr .edit_cell :visible").parents("tr");

			/* if date field lost focus */
			if (field_to_validate == "edit_cell date_select"){				
				this.validateDate(current_row);
			/* if observers field lost focus */				
			} else if (field_to_validate == "edit_cell observers"){
				this.validateObservers(current_row);
			/* if diameter field lost focus */				
			} else if (field_to_validate == "edit_cell diameter"){
				this.validateDiameter(current_row);
			} else {
				// field left was comments, which don't need to be validated (and should be allowed to be empty!)
				return;
			}

		},

		validateDate: function($current_row) {

			/* get date to validate */
			// var date_entered = current_row.find(".formatted-date").val();
			var date_entered = ($current_row.find(".edit_cell.date_select :input")).datepicker("getDate");
			
			console.log(date_entered);
			
			/* if date is not valid */
			if (_.isDate(date_entered) === false) {
				$(".edit_cell.date_select :input" ).addClass("alert_invalid");
				alert("Date format invalid!");
				console.log("date validation failed");
				($current_row.find('.edit-existing')).trigger('click');
				return false;
			}

			/* make sure date isn't in future */
			var today = new Date();
			console.log(date_entered > today);
			/* make sure date isn't in future */
			// the smallest unit for time comparison is days, 
			// so comparing the Dates (or UNIX times) wouldn't work,
			// because the today Date would always be greater than the date picked from datepicker
			i/*f (date_entered.getFullYear() > today.getFullYear()) {
				if (date_entered.getMonth() > today.getMonth()) {
					if (date_entered.getDate() > today.getDate()) {*/
					if (date_entered > today){
						// trigger the edit Observation button to prevent saving
						$(".edit_cell.date_select :input" ).addClass("alert_invalid");
						//alert("Can't have date past today!");
						console.log("date validation failed");
						($current_row.find('.edit-existing')).trigger('click');
						return false;
						}
					/*}
				}
			}*/

			/* make sure date isn't already added */
			/*	
			// get all dates listed in model for diam entries
			var existing_diams_object = this.model.attributes.diameter;
			var existing_dates_array = existing_diams_object.date.reverse();
			// remove the date previously listed in the date field from the list of dates to check against
			var prev_dateindex = $("#tree-observations tbody tr").index(current_row);
			existing_dates_array.splice(prev_date_index, 1);
			// alert user if the date already has an associated entry
			*/
			
			var this_row_index = parseInt(($current_row.attr("id")).split("-")[1]);
			var existing_entries = this.model.get('diameter');
			
			/*
			var today_days = today.getFullYear()*366 + today.getMonth()*32 + today.getDate();
			
			var doBinarySearch = function(i, begin, end) {
				var days = existing_entries[i].date.y*366 + existing_entries[i].date.m*32 + existing_entries[i].date.d;
				
				if (days == today_days) {
					if (i == this_row_index) return false;
					return true;
				}
				else if (days < today_days) {
					if (i == begin && i == end) return false;
					return doBinarySearch(Math.floor(i/2), i+1, end);
				} else {
					if (i == begin && i == end) return false;
					return doBinarySearch(Math.floor(i/2), begin, i-1);
				}
			};
			
			if (doBinarySearch(Math.floor((existing_entries.length - 1)/2), 0, existing_entries.length - 1) === true) {
				// show user a tooltip about the proper entry
				$(".edit_cell.date_select :input").tooltip();   // NOTE: the text shown on the tooltip is listed as the title attribute of the template for TreeEditView.
				$(".edit_cell.date_select :input" ).tooltip("show");
				$(".edit_cell.date_select :input" ).addClass("alert_invalid");
				return false;
			}
			*/
			
			for (i in existing_entries) {
			
				/*if (i == this_row_index) {
					break;
				}*/
				
				if (existing_entries[i].date.y == today.getFullYear() && existing_entries[i].date.m == today.getMonth() && existing_entries[i].date.d == today.getDate()) {
					
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

		validateObservers: function(current_row) {

			// get observers entry and format
			var obs_entered = current_row.find(".observers :input").val().split(",");
			for (var i=0; i<obs_entered.length; i++){
				obs_entered[i] = obs_entered[i].trim(" ");
			}	

			// make sure an observer was entered
			if (obs_entered[0] === "") {
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

		validateDiameter: function(current_row) {

			// get diameter entry
			var diam_entered = parseFloat(current_row.find(".diameter :input").val());

			// make sure the diameter is in correct format (can be parsed as float)
			if (isNaN(diam_entered)) {
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

		getAllObservers: function() {
			//finds all observers that have been previously entered into the database
			var observers_array = [];
			
			$.getJSON(app.config.cgiDir + 'litterfall.py?site=allObservers', function(data) {
				
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
			// this.editViewInitialize();
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
  			//this.on('add', myFunction);
  			//this.on('reset', this.findAllObservers); 
  			//this.on('add', this.findAllObservers); 
  			//this.on('change', this.renderTrees);

  		},
  		render: function() {
  			this.renderTrees();
  			return this;
  		},
  		renderTrees: function(){
  			var site_name = "";
  			var plot_number = 0;
  			var max_diam = 0;
  			
  			this.each(function(tree){
  				tree.plotViewInitialize();
  				var num_obvs = tree.get("diameter").length;

  				
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
  			$(".export").click(function(e) {
  				// query database for all trees in the plot
  				if (j == 0) {  				
  					$(".export").val("Preparing data for export...");
  					$.getJSON(app.config.cgiDir + 'litterfall.py?site=' + $(".site-name").text() + "&plot=" + $(".plot-number").text(), function(data) {
  						$.each(data, function(index, value) {
							// format Comma Separated Value string with data from each tree
							CSV = CSV + "\r\n" + (parseInt(value["tree_id"]) + parseInt(value["sub_tree_id"])*.1) + "," + value["species"] + "," + value["angle"] + "," + value["distance"];
							$.each(value["diameter"], function(i) {
								var obs = value["diameter"][i];
								if (obs["date"] != null){
									var formatted_date = obs["date"]["d"] + "/" + obs["date"]["m"] + "/" + obs["date"]["y"];
									console.log(formatted_date);
									CSV += "," + formatted_date + "," + obs["value"] + ",";
								}
								if (obs["notes"] != "" && obs["notes"] != undefined){
									CSV += obs["notes"];
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
				if (j > 0) {
					var agt=navigator.userAgent.toLowerCase();
					if (agt.indexOf("firefox") != -1) {
						window.open('data:application/octet-stream;charset=utf-8,' + encodeURIComponent($('#CSV').text()));
					} else {
						window.open('data:text/csv;charset=utf-8,' + encodeURIComponent($('#CSV').text()));
					}
					e.preventDefault();   				
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

  			
  			var random_tree = this.find(function(){return true;});
  			
  			var new_tree = new Tree({
  				plot: random_tree.get('plot'),
  				site: random_tree.get('site')
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
			location_options.url = app.config.cgiDir + "litterfall.py?site=all";						//creates list with all possible locations
			var location_select = new selectionOptionsView({
				el: $('#site-select'),																//populates new selectionOptionsView with locations (sites)
				collection: location_options
			});
			location_options.fetch();
			$('#update-records').click(function(){														//waits for user to select plot
				var getPlotUrl = "data/update/" + $('#type-select').val() + '/site/' + encodeURI($('#site-select').val()) + '/plot/' + $('#plot-select').val()
				document.location.hash = getPlotUrl;
			});
			$('#analyze-data').click(function(){														//waits for user to select plot
				var getPlotUrl = "data/reports/" + $('#type-select').val() + '/site/' + encodeURI($('#site-select').val()) + '/plot/' + $('#plot-select').val()
				document.location.hash = getPlotUrl;
			});
		});
    });
    
    //Plot view
    app_router.on('route:goToPlot', function(mode, site, plot) {		
    	//reloads page based on selected location (site) and plot
		$(".data").addClass("active");
    	$(".home").removeClass("active");
    	
		var this_plot = new Plot;
		//need to use site and plot variable to build url to python script
		this_plot.url = app.config.cgiDir + 'litterfall.py?site=' + site + '&plot=' + plot;
    	
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
						$addNewSubTree.eq(0).trigger("not_choosing_parent_tree");
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
			this_tree.url = app.config.cgiDir + 'litterfall.py?site=' + site + '&plot=' + plot + '&treeid=' + tree_id + '&subtreeid=' + sub_tree_id;
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

function toUnixTime(date) {
	
	var theDate = new Date(date.y, date.m - 1, date.d);
	return theDate.getTime();
	
	
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
