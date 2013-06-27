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
            "data/update": "accessObservations", //inits the add record "wizard", leads to the edit pages
            "data/reports": "accessObservations",
            "data/update/trees/site/:location/plot/:plot": "goToPlot",
            "data/reports/trees/site/:location/plot/:plot": "goToPlot",
          	//"update/trees/site/:location/plot/:plot/treeid/new": "newTree",
            "data/update/trees/site/:location/plot/:plot/treeid/:tree_id/subtreeid/new": "newSubTree",
            "data/update/trees/site/:location/plot/:plot/treeid/:tree_id(/subtreeid/:sub_tree_id)": "goToTree",
            "data/reports/trees/site/:location/plot/:plot/treeid/:tree_id(/subtreeid/:sub_tree_id)": "goToTree",
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
	var newTreeModel = Backbone.View.extend({
		tagName: 'div',
		className: 'model hide fade',
		id: 'add-new-tree-model',
		template: '\
		<div class="model-header">\
			<button type="button" class="close" data-dismiss="model" aria-hidden="true">&times;</button>\
			<h3>Add a new tree</h3>\
		</div>\
		<div class="model-body"><p>\
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
		<div class="model-footer">\
			<a class="btn btn-danger" data-dismiss="model">Cancel</a>\
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
				this.$el.find(".model-header h3").html("Add a new sub-tree <small>Tree ID:  "+this.model.get("tree_id")+"</small>");
				this.$el.find("#new-tree-species").tooltip({title: "The species of all sub-trees should be the same, no?"})
					.attr("disabled", "disabled").val(this.model.get("species"));
				this.$el.find('#new-tree-angle').val(this.model.get("angle"));
				this.$el.find('#new-tree-distance').val(this.model.get("distance"));

			}

			// Append it to the body
			$("body").append(this.el);
			this.$el.model();

			// Add autocomplete to the species field
			this.addAutocomplete();

			var self = this;

			// Remove the model when done
			this.$el.on("hidden", function() {
				this.remove();
				if (self.isSubTree) {
					$('.add-new-sub-tree').eq(0).trigger("notChoosingParentTreeAnymore");
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
				appendTo: "#add-new-tree-model" // so that the list moves along with the model
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
			// What do I need to do to change the angle?

			// It should only be numbers
			var numberRegex = /^[0-9]*$/;

			var error = false;

			if ($angle.val() == '') {
				error = "This cannot be empty.";
			} else if (!numberRegex.test($angle.val())) {
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
		addAndSaveTree: function(backToPlot) {

			// Set the URL--don't you think we should not have to specify the URL every time we call the server?
			this.model.url = app.config.cgiDir + 'litterfall.py';
			var self = this;
			this.model.validate = function() {
				if (!(self.validateAngle() || self.validateDistance() || self.validateSpecies())) {
					return "Invalid data";
				}
			}
			this.model.on("invalid", function() {
				$('addNewTreeModel .error').eq(0).focus();
			});


			// save!
			this.model.save({
				species: $('#new-tree-species').val(),
				angle: parseInt($('#new-tree-angle').val()),
				distance: parseInt($('#new-tree-distance').val())
			},
			{
				success: function() {
					self.$el.model("hide");
					if (back_to_plot == true) {
						/* if (self.isSubTree === true) {
							$(".add-new-sub-tree").trigger("click");
						} */
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
			<td class="date-entry 2002">\
				<%= tree.diameter2 %>\
			</td>\
			<td class="date-entry 2003">\
				<%= tree.diameter3 %>\
			</td>\
			<td class="date-entry 2004">\
				<%= tree.diameter4 %>\
			</td>\
			<td class="date-entry 2005">\
				<%= tree.diameter5 %>\
			</td>\
			<td class="date-entry 2006">\
				<%= tree.diameter6 %>\
			</td>\
			<td class="date-entry 2007">\
				<%= tree.diameter7 %>\
			</td>\
			<td class="date-entry 2008">\
				<%= tree.diameter8 %>\
			</td>\
			<td class="date-entry 2009">\
				<%= tree.diameter9 %>\
			</td>\
			<td class="date-entry 2010">\
				<%= tree.diameter10 %>\
			</td>\
			<td class="date-entry 2011">\
				<%= tree.diameter11 %>\
			</td>\
			<td class="date-entry 2012">\
				<%= tree.diameter12 %>\
			</td>\
			<td class="date-entry 2013">\
				<%= tree.diameter13 %>\
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
			
			this_tree.diameter2 = "-";
			this_tree.diameter3 = "-";
			this_tree.diameter4 = "-";
			this_tree.diameter5 = "-";
			this_tree.diameter6 = "-";
			this_tree.diameter7 = "-";
			this_tree.diameter8 = "-";
			this_tree.diameter9 = "-";
			this_tree.diameter10 = "-";
			this_tree.diameter11 = "-";
			this_tree.diameter12 = "-";
			this_tree.diameter13 = "-";
			for (date in this_tree.diameter){                      //loop through the list of existing dates and store the most recent
				if (date.slice(0,4) === '2002') {
					this_tree.diameter2 = this_tree.diameter[date].value;
				} else if (date.slice(0,4) === '2003') {
					this_tree.diameter3 = this_tree.diameter[date].value;
				} else if (date.slice(0,4) === '2004') {
					this_tree.diameter4 = this_tree.diameter[date].value;
				} else if (date.slice(0,4) === '2005') {
					this_tree.diameter5 = this_tree.diameter[date].value;
				} else if (date.slice(0,4) === '2006') {
					this_tree.diameter6 = this_tree.diameter[date].value.toFixed(2);
				} else if (date.slice(0,4) === '2007') {
					this_tree.diameter7 = this_tree.diameter[date].value;
				} else if (date.slice(0,4) === '2008') {
					this_tree.diameter8 = this_tree.diameter[date].value;
				} else if (date.slice(0,4) === '2009') {
					this_tree.diameter9 = this_tree.diameter[date].value;
				} else if (date.slice(0,4) === '2010') {
					this_tree.diameter10 = this_tree.diameter[date].value;
				} else if (date.slice(0,4) === '2011') {
					this_tree.diameter11 = this_tree.diameter[date].value;
				} else if (date.slice(0,4) === '2012') {
					this_tree.diameter12 = this_tree.diameter[date].value;
				} else if (date.slice(0,4) === '2013') {
					this_tree.diameter13 = this_tree.diameter[date].value;
				}
			}
			
			//$el --> gets the jQuery object for this view's element 
			//*.attr('id', this_tree._id.$oid) --> sets 'id' to MongoDB value for tree's ID
			//takes the tree's data, assigns it to this.template, inserts the HTML into the jQuery object for this view's element
			this.$el.attr('id', this_tree._id.$oid).html(_.template(this.templateReports, {tree: this_tree}));
			this.$el.addClass("tree-cluster-" + this_tree.tree_id);
			this.$el.children().eq(2).css("font-style","italic");
			this.options.targetEl.append(this.el);	
				
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
			
			var isFormerDateMoreRecent = function(formerdate, latterdate) {
				
				if (former_date.y > latter_date.y) return true;
				if (former_date.y < latter_date.y) return false;
				
				if (former_date.m > latter_date.m) return true;
				if (former_date.m < latter_date.m) return false;
				
				return former_date.d > former_date.d;
				
			};
			
			this_tree.latest_DBH_message = "-";
			this_tree.latest_comment = "-";
			
			console.log(this_tree);
			
			if (this_tree.diameter.length > 0) {
				
				var most_recent_entry = _.max(this_tree.diameter, function(entry) {
					return (entry.date.y - 2000)*10000 + entry.date.m*100 + entry.date.d;
				});
				
				this_tree.latest_DBH_message = most_recent_entry.value + " on " + toFormattedDate(most_recent_entry.date);
				this_tree.latest_comment = most_recent_entry.comment == '' ? most_recent_entry.comment : '-';
				
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
				this.model.trigger("addNewSubTreeFromRow");
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
/*
	// Adding new row for inserting a new tree
	var new_treeRowView = Backbone.View.extend({
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
				<span class="edit_cell new-tree angle"><input value="" title="Angle must be a number between 0 and 360." type="text"></input></span>\
			</td>\
			<td class="editable">\
				<span class="edit_cell new-tree distance"><input value="" title="Distance must be a number between 0 and 1000." type="text"></input></span>\
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

			});
		},
		events: {
			'click .btn-save-new-tree': 'saveTree',
			'click .btn-cancel-new-tree': 'deleteRow',
			'change .new-tree': 'validateField'

		},
		saveTree: function() {
			//calculate treeID
			//save tree to database
			var plot_number = $(".plot-number").text();
			var site_name = $(".site-name").text();
			
			// create a new Tree object and set the data
			var new_tree = new Tree();
			new_tree.url = app.config.cgiDir + 'litterfall.py';
			new_tree.set({
				"plot": parseInt(plot_number),
				"site": site_name,
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
			var result = new_tree.save({}, {
				'success': function(data) {if (result != null){ console.log(result);
					app_router.navigate(document.location.hash + "/treeid/" + new_tree.get("tree_id"), {trigger: true});
				}}
			});
			
		},
		validateField: function(event){

			var field_to_validate = event.currentTarget.className;
			console.log(field_to_validate);
			// if angle field lost focus
			if (field_to_validate == "edit_cell new-tree angle"){		
				this.validateAngle();
			// if distance field lost focus
			} else if (field_to_validate == "edit_cell new-tree distance"){
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
				$(".edit_cell.new-tree.angle :input").tooltip(); // NOTE: the text shown on the tooltip is listed as the title attribute of the template for NewTreeRiwView.
				$(".edit_cell.new-tree.angle :input").tooltip("show");				
				$(".edit_cell.new-tree.angle :input").addClass("alert_invalid");
				return false;
			} else { 
				$(".edit_cell.new-tree.angle :input").removeClass("alert_invalid");
				$(".edit_cell.new-tree.angle :input").tooltip("destroy");
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
				$(".edit_cell.new-tree.distance :input").tooltip(); // NOTE: the text shown on the tooltip is listed as the title attribute of the template for NewTreeRowView.
				$(".edit_cell.new-tree.distance :input").tooltip("show");				
				$(".edit_cell.new-tree.distance :input").addClass("alert_invalid");
				return false;
			} else { 
				$(".edit_cell.new-tree.distance :input").removeClass("alert_invalid");
				$(".edit_cell.new-tree.distance :input").tooltip("destroy");
				console.log("distance validation passed");
				return true;
			}
		},
		deleteRow: function() {
			
			this.$el.fadeOut("slow", function() {
				$(this).remove();
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

			var this_tree = this.model.toJSON();
			//console.log("What's this_tree?");
			//console.log(this_tree);
			this.$el.html(_.template(this.template, {tree: this_tree}));

			//delete all the other ones so user can't add multiple subtrees at once
			$(".sub-tree-row-goaway").remove();
			$(".tree-row-goaway").remove();
			this.$el.addClass("sub-tree-row-goaway");
			//insert the new tree row to the table next to its fellow subtrees
			$('.tree-cluster-'+this_tree.tree_id).eq(-1).after(this.el);
			
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
*/

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
						Comments\
					</th>\
				</tr>\
			</thead>\
			<tbody>\
			<% $.each(tree.dates_desc, function(obs){ %>\
				<% d = obs.date; %> \
    			<% var date = $.datepicker.formatDate("dd/mm/yy", new Date(d)); %>\
			<tr>\
				<td><span class="display_cell date_select"><%= date %></span>\
				<td><span class="display_cell observers"><%= obs.observers %></span>\
				<td><span class="display_cell diameter"><%= obs.value %></span>\
				<td><span class="display_cell notes"><%= obs.notes %></span>\
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
						Comments\
					</th>\
				</tr>\
			</thead>\
			<tbody>\
			<% _.each(tree.diameter, function(entry, index){ %>\
			<tr id="entry-<%= index %>">\
				<td class="btn-column">\
					<button class="display_cell btn btn-mini btn-primary edit-existing" type="button">Edit</button>\
					<div class="edit_cell btn-group"><button class="btn-save-observation btn btn-mini btn-success" type="button">Submit</button>\
					<button class="btn-cancel-observation btn btn-mini btn-danger" type="button">Cancel</button>\
				</td>\
				<td class="editable"><span class="display_cell date_select"><%= toFormattedDate(entry.date) %></span><span class="edit-cell date_select"><input title="Enter a date in mm/dd/yyyy format.  It may not already have an associated diameter entry or be in the future." type="text" value="<%= toFormattedDate(entry.date) %>"/>\
				<input type="hidden" class="formatted_date" value="<%= toFormattedDate(entry.date) %>">\
				<input type="hidden" class="unix-time" value="<%= toUnixTime(entry.date) %>"></span></td>\
				<td class="editable"><span class="display_cell observers"><%= entry.observers %></span><span class="edit-cell observers"><input title="Observers field may not be empty." type="text" value="<%= entry.observers %>"></span></td>\
				<td class="editable"><span class="display_cell diameter"><%= entry.value %></span><span class="edit-cell diameter"><input title = "Please enter an integer or floating point number such as 5, 6.1, 10.33" type="text" value="<%= entry.value %>"></span></td>\
				<td class="editable"><span class="display_cell notes"><%= entry.notes %></span><span class="edit-cell notes"><input type="text" value="<%= entry.notes %>"></span></span></td>\
			</tr>\
			<% }); %>\
			</tbody>\
			</table>\
			<div class="button-row">\
				<button class="btn-new-observation btn btn-mini btn-success pull-left" type="button">+ New Entry</button>\
			</div>\
		',
		rowEntryTemplateUpdate: '\
				<td class="btn-column">\
					<button class="display_cell btn btn-mini btn-primary edit-existing" type="button">Edit</button>\
					<div class="edit_cell btn-group"><button class="btn-save-observation btn btn-mini btn-success" type="button">Submit</button>\
					<button class="btn-cancel-observation btn btn-mini btn-danger" type="button">Cancel</button>\
				</td>\
				<td class="editable"><span class="display_cell date_select"><%= toFormattedDate(entry.date) %></span><span class="edit-cell date_select"><input title="Enter a date in mm/dd/yyyy format.  It may not already have an associated diameter entry or be in the future." type="text" value="<%= toFormattedDate(entry.date) %>"/>\
				<input type="hidden" class="formatted_date" value="<%= toFormattedDate(entry.date) %>">\
				<input type="hidden" class="unix-time" value="<%= toUnixTime(entry.date) %>"></span></td>\
				<td class="editable"><span class="display_cell observers"><%= entry.observers %></span><span class="edit_cell observers"><input title="Observers field may not be empty." type="text" value="<%= entry.observers %>"></span></td>\
				<td class="editable"><span class="display_cell diameter"><%= entry.value %></span><span class="edit_cell diameter"><input title = "Please enter an integer or floating point number such as 5, 6.1, 10.33" type="text" value="<%= entry.value %>"></span></td>\
				<td class="editable"><span class="display_cell notes"><%= entry.notes %></span><span class="edit_cell notes"><input type="text" value="<%= entry.notes %>"></span></span></td>\
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
						Comments\
					</th>\
				</tr>\
			</thead>\
			<tbody><% console.log("What") %>\
			<% _.each(tree.diameter, function(entry, index){ %>\
				<tr id="entry-<%= index %>">\
					<td class="btn-column">\
						<button class="display_cell btn btn-mini btn-primary edit-existing" type="button">Edit</button>\
						<div class="edit_cell btn-group"><button class="btn-save-observation btn btn-mini btn-success" type="button">Submit</button>\
						<button class="btn-cancel-observation btn btn-mini btn-danger" type="button">Cancel</button>\
					</td>\
					<td class="editable"><span class="display_cell date_select"><%= toFormattedDate(entry.date) %></span><span class="edit_cell date_select"><input title="Enter a date in mm/dd/yyyy format.  It may not already have an associated diameter entry or be in the future." type="text" value="<%= toFormattedDate(entry.date) %>"/>\
					<input type="hidden" class="formatted-date" value="<%= toFormattedDate(entry.date) %>"></span></td>\
					<td class="editable"><span class="display_cell observers"><%= entry.observers %></span><span class="edit_cell observers"><input title="Observers field may not be empty." type="text" value="<%= entry.observers %>"></span></td>\
					<td class="editable"><span class="display_cell diameter"><%= entry.value %></span><span class="edit_cell diameter"><input title = "Please enter an integer or floating point number such as 5, 6.1, 10.33" type="text" value="<%= entry.value %>"></span></td>\
				<td class="editable"><span class="display_cell notes"><%= entry.notes %></span><span class="edit_cell notes"><input type="text" value="<%= entry.notes %>"></span></span></td>\
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
		render: function() {
		
			if (document.location.hash.search("update") === -1) {
				this.renderReport();
				// this.model.on('change', this.renderReport, this); //re-render when the model is saved (new observation, or an edit)
			} else {
				this.renderUpdate();
				//this.model.on('change', this.renderUpdate, this.model); //re-render when the model is saved (new observation, or an edit)
			}
		},
		renderReport: function(){

			var this_tree = this.model.toJSON();
			//get the dates in descending order
			// this_tree.dates_desc = _.keys(this_tree.diameter).sort().reverse();

			var dates = this_tree.diameter;
			this_tree.dates_desc = dates;

			this.$el.html(_.template(this.templateReport, {tree: this_tree}));
			$(".back").attr("href", "#data/reports/trees/site/" + $(".site-name").text() + "/plot/" + $(".plot-number").text());
			$(".title").text("Analyzing Tree Data ");
			$("#tree-observations").tablesorter();
		},
		renderUpdate: function(){
		
			// sort, the latest goes to the top
			this.model.set('diameter', _.sortBy(this.model.get('diameter'), function (entry) {
				return 0 - (entry.date.y*366 + entry.date.m*32 + entry.date.d);
			}));
			var this_tree = this.model.toJSON();
			//get the dates in descending order
			
			var dates = this_tree.diameter;

			this_tree.dates_desc = dates;
			this.$el.html(_.template(this.templateUpdate, {tree: this_tree}));
			$(".title").text("Updating Tree Data ");
			$("#tree-observations").tablesorter({headers: { 0: { sorter: false}}}); 
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
			var today = new Date();

			// if today's date already has an entry, set a template dateKey using tomorrow's date (which the user will be forced to change to pass validation)
			var new_entry = {
				date: today.toLitterfallDateObject(),
				value: 'n/a',
				notes: "",
				observers: []
			};
			
			// new jQuery row to be prepended
			// class="new" to mark the row as new
			var $new_entry_row = $('<tr></tr>').addClass("new").html(_.template(this.rowEntryTemplateUpdate, {entry: new_entry}));
			// prepend it to the table
			$("#tree_observations > tbody").prepend($new_entry_row);
			
			// Disable all the other edit buttons
			// Why do we need to do that though?
			$("#tree_observations .btn.display_cell").hide();

			// Show edit content, hide display content, show "Submit/cancel button", add date_picker		
			$new_entry_row.find(".edit_cell").show();
			$new_entry_row.find(".display_cell").hide();
			$new_entry_row.find(".edit_cell.date_select :input").datepicker({
				maxDate: 0,
				changeYear: true,
				changeMonth: true,
				constrainInput: true
			});	
			//var existingObs = this.model.findAllObservers();
			var all_observers = this.getAllObservers();
			$("#tree_observations > tbody > tr:first .edit_cell.observers :input").autocomplete({source: all_observers});
		},

		editObservation: function(event) {

			// User wants to edit an existing observation.  
			$row_to_edit = $(event.target).parents("tr");		// Get the row of edit button
			$row_to_edit.addClass("edit");
			// Hide any existing edit modes
			$("#tree-observations .btn.display_cell").hide();

			// Show edit content, hide display content, show "Submit/cancel button", add date_picker		
			$row_to_edit.find(".edit_cell").show();
			$row_to_edit.find(".display_cell").hide();
			$row_to_edit.find(".edit_cell.date_select :input").datepicker({dateFormat: "yy/mm/dd", altFormat: "@" , altField: "#tree_observations > tbody > tr .unix-time" , maxDate: 0, changeYear: true , changeMonth: true , constrainInput: true });
			$row_to_edit.addClass("old");
			// get all observers existing in database, feed them into an autocomplete for the observers field
			var all_observers = this.getAllObservers();
			$row_to_edit.find(".edit_cell.observers :input").autocomplete({source: all_observers});			

		},

		cancelEditObservation: function() {
			// user wants to cancel any edits made, or is canceling after adding a new entry
			this.model.fetch(); // retrieves recent data
			$("#tree-observations > tr").removeClass("new");
			$("#tree-observations > tr").removeClass("edit");
			this.render();      // NOTE: this is sort of a hack to exit the editing view
		},

		saveObservation: function(event) {
			// User added or edited an observation.  Save it to the server.	
			// Get the row that is being edited
			
			/*
			row_to_save = $("#tree_observations > tbody > tr .edit_cell :visible").parents("tr");

			var new_date = row_to_save.find(".formatted-date").val();
			console.log(new_date);
			var new_value = parseFloat(row_to_save.find(".diameter :input").val());
			// convert observers from string to array
			var new_observers = row_to_save.find(".observers :input").val().split(",");
			for (var i=0; i<new_observers.length; i++){
				new_observers[i] = new_observers[i].trim(" ");
			}
			var new_notes = row_to_save.find(".notes :input").val();

			// final validation before saving to database
			if (! (this.validateDate(row_to_save) && this.validateObservers(row_to_save) && this.validateDiameter(row_to_save))){
				console.log("didn't save");
				return; // user will remain in edit view until their data passes validation
			}

			//must clone object to update it
			var diameters = _.clone(this.model.get('diameter'));

			// Find the existing date key by figuring out the index of the row being edited and matching it up with the index of the 
			// observations (sorted by date key in reverse)
			var index_of_observation = $("#tree-observations tbody tr").index(row_to_save);
			var existing_date_key = _.keys(diameters).sort().reverse()[index_of_observation];

			// Remove the existing date key/object.  Since _.clone is a shallow clone, we need to remove the reference to the
			// existing observation before removing it.
			//console.log(existing_date_key);
			diameters[existing_date_key] = new Object();
			delete diameters[existing_date_key];

			// Add in the new data
			diameters.push( {
			
					value: new_value,
					notes: new_notes,
					observers: new_observers
				});

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
			*/
			
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
				value: parseFloat($row_to_save.find(".diameter :input").val()),
				observers: new_observers,
				notes: $row_to_save.find(".notes :input").val(),
			};
			
			// if it is a new one
			if (is_this_row_new === true) {
				
				
				// add a new entry to the list, to where it should be
				var target_index = _.sortedIndex(entries_array, new_entry, function(entry) {
					return 0 - (entry.date.y*366 + entry.date.m*32 + entry.date.d);
				});
				
				// then insert it
				this.model.set('diameter', _.union(_.first(entries_array, target_index), [new_entry], _.rest(entries_array, target_index)));
				
				
			} else { // if we are editing a row
				
				var target_index = parseInt(($row_to_save.attr("id")).split("-")[1]);
				entries_array[target_index] = new_entry;
				entries_array = _.sortBy(this.model.get('diameter'), function (entry) {
					return 0 - (entry.date.y*366 + entry.date.m*32 + entry.date.d);
				});
				this.model.set('diameter', entries_array);
				
			}
			
			this.model.save();
			this.render();		

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

		validateDate: function(current_row) {

			/* get date to validate */
			var date_entered = current_row.find(".formatted-date").val();

			/* make sure date isn't in future */
			var today = new Date();
		    var today_formatted = today.getFullYear().toString() + 
		    				     ((today.getMonth()+1).toString().length == 1 ? "0"+(today.getMonth()+1) : (today.getMonth()+1).toString()) + 
		    					 ((today.getDate()+1).toString().length == 1 ? "0"+today.getDate() : today.getDate().toString());
			if (date_entered > today_formatted) {
				// trigger the edit Observation button to prevent saving
				$(".edit_cell.date_select :input" ).addClass("alert_invalid");
				alert("Can't have date past today!");
				console.log("date validation failed");
				$(current_row.find('.edit-existing')).trigger('click');
				return false;
			} 

			/* make sure date isn't already added */		
			// get all dates listed in model for diam entries
			var existing_diams_object = this.model.attributes.diameter;
			var existing_dates_array = existing_diams_object.date.reverse();
			// remove the date previously listed in the date field from the list of dates to check against
			var prev_dateindex = $("#tree-observations tbody tr").index(current_row);
			existing_dates_array.splice(prev_date_index, 1);
			// alert user if the date already has an associated entry
			for (i in existing_dates_array) {
				if (existing_dates_array[i] == date_entered){
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
			/*
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
							if (date.substr(0,4) >= date_threshold) {
								if (data[i][date].observers[0] !== undefined) {
									if (data[i][date].observers[0].trim(" ") !== ""){
										cur_observers = data[i][date].observers;
										// check each observer listed in an entry against each observer already in comprehensive array
										for (k in cur_observers) {
											current_observer = cur_observers[k];
											for (date in observers_array) {
												if (current_observer === observers_array[date]) {
													already_there = true;
													break;
												} else {
													already_there = false;
												}
											}
											if (already_there === false) {
												observers_array.push(current_observer);
											}
										}
									}
								}
							}
						}
					}
				}
			});

			observersArray.sort();
			*/
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
			tree_id: 0,
			sub_tree_id: 0,
			angle: 0.0,
			distance: 0,
			diameter: [],
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
		
			function formatSubTreeId(sub_tree_id) {
				sub_tree_id *= .1;
				if (sub_tree_id < 1) return sub_tree_id;
				return formatSubTreeId(sub_tree_id);
			}
			
			response.full_tree_id = response.tree_id + formatSubTreeId(response.sub_tree_id);
			
			/*
			var newEntryArray = [];
			
			console.log(response.diameter);
			_.each(response.diameter, function(entry, key) {
				console.log(new Date(response.diameter[key].date.$date));
				response.diameter[key].date = new Date(response.diameter[key].date.$date);
				console.log(response.diameter[key]);
				console.log(response.diameter[key].date.getFullYear());
			});
			*/
			
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
  		renderTrees: function(){
  			var site_name = "";
  			var plot_number = 0;
  			var max_diam = 0;
  			
  			this.each(function(tree){
  				tree.plotViewInitialize();
  				var num_obvs = tree.get("diameter").length;
  				



  				this.listenTo(tree, 'addNewSubTreeFromRow', function() {			
  				
					// add sub-tree
					// var this_treeId = Math.floor(parseFloat(this.$el.children("td").eq(1).text()));
					$('.add-new-sub-tree').eq(0).trigger("choosing_parent_tree");
					this.addSubTree(tree.get("tree_id"));

				});

  				
  				// determine the maximum number of observations for any tree in this plot
  				// to allocate enough columns in the CSV file
  				if (num_obvs > max_diam) {
  					max_diam = num_obvs;
  				}
  			}, this);
  			// populate the treeIDs dropdown menu for adding new subtrees
  			// this.populateTreeIDs();
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
									var parsed_date = new Date(obs["date"]["$date"]);
									var formatted_date = $.datepicker.formatDate('m/d/yy', parsed_date)
									CSV += "," + formatted_date + "," + obs["value"] + ",";
								}
								if (obs["notes"] != "" && obs["notes"] != undefined){
									CSV += obs["notes"];
								}
							});
						});
					// adds formatted data to a hidden input on the page
					$("#CSV").append(CSV);
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
				$('.'+i).show();
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
  			var new_model = new newTreeModel({
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
  			var parentTree = this.find(function (tree) {return tree.get('tree_id') == treeId;});
  			
  			var new_tree = new Tree({
  				tree_id: tree_id,
  				sub_tree_id: -1,
  				species: parent_tree.get('species'),
  				plot: parent_tree.get('plot'),
  				site: parent_tree.get('site'),
  				angle: parent_tree.get('angle'),
  				distance: parent_tree.get('distance')
  			});
  			
  			var new_model = new newTreeModel({
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
  		} /*
  		populateTreeIDs: function(){

			// Get all the ids
			var ids = [];
			
			// Populate the ids array
			this.each(function(tree){
				var tree_id = tree.get("tree_id");
				// Avoiding duplicates
				if (ids.length == 0 || ids.indexOf(treeid) < 0) {
					ids.push(tree_id);
				}
			});

			// Sort the array IDs
			ids.sort(function(a,b){return a - b;});

			var tree_collection = this;

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

				var parent_tree = tree_collection.find(function(tree) {
					return tree.get("tree_id") == parseInt(aTag.text());
				});

				//console.log(parent_trees[parent_trees.length - 1]);
				parent_tree.newSubTreeRowViewInitialize();
				
			});






		} */
		/*,

		new_treeRowViewInitialize: function(){
  			console.log("newTreeRowViewInitialize");
			var newTreeRow = new newTreeRowView({
				targetEl: $("#plot-table"),
				model: this.model
			});
		}*/
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
    app_router.on('route:goToPlot', function(site, plot) {		
    	//reloads page based on selected location (site) and plot
		$(".data").addClass("active");
    	$(".home").removeClass("active");
		// load different template depending on whether we are updating or analyzing data
		var template_file;		
		if (document.location.hash.search("update") === -1) { //if url does not contain 'update' (i.e. it must contain 'reports')
			console.log("should be reporting");
			template_file = 'reports2.html';
		} else {		
			console.log("should be updating");									  // url contains 'update'
			template_file = 'update2.html';
		}
		require(['lib/text!templates/' + template_file + '!strip'], function(templateHTML){			//<WHAT DOES THIS FUNCTION DO?> [ ] (some sort of require wrapper)
			$('#main').html(_.template(templateHTML, {
				site: decodeURI(site), 
				plot: plot
			}));

			//jQuery calls for, DBH Tooltip and updating functionality
			updateFunctions();


			var this_plot = new Plot;
			//need to use site and plot variable to build url to python script
			this_plot.url = app.config.cgiDir + 'litterfall.py?site=' + site + '&plot=' + plot;
			this_plot.fetch();
			
			var $addNewSubTree = $('.add-new-sub-tree');
			
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
			$addNewSubTree.bind("choosing_parent_tree", function() {
				this_plot.choosing_parent_tree = true;
				$addNewSubTree.popover('show').addClass('active');
					
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
				$addNewSubTree.popover('hide').removeClass('active');
					
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

    });
    
    //Edit tree view
    app_router.on('route:goToTree', function(site, plot, tree_id, sub_tree_id) {						//reloads page based on selected location (site) and plot
    	$(".data").addClass("active");
    	$(".home").removeClass("active");
    	var  template_file = 'update-tree.html';
		require(['lib/text!templates/' + template_file + '!strip'], function(templateHTML){			//<WHAT DOES THIS FUNCTION DO?> [ ] (some sort of require wrapper)

			if(typeof sub_tree_id === 'undefined'){
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
    
    // Add new sub-tree
    /*
    app_router.on('route:newSubTree', function(site, plot, tree_id) {
    	var template_file = 'update-tree.html';
    	// create a new tree object in the database
    	// connect the newly created object to a tree model here
    	// emulate the edit tree view
    }*/
    
    //
    
     //Add new tree view
     /*
    app_router.on('route:new_tree', function(site, plot) {						//reloads page based on selected location (site) and plot
    	var  template_file = 'update-tree.html';
		require(['lib/text!templates/' + template_file + '!strip'], function(templateHTML){			//<WHAT DOES THIS FUNCTION DO?> [ ] (some sort of require wrapper)

			$('#main').html(_.template(templateHTML, {
				site: decodeURI(site), 
				plot: plot,
				tree-id: "New",
				sub-tree-id: "0"
			}));


			var this_tree = new Tree();
			this_tree.url = app.config.cgiDir + 'litterfall.py';
			this_tree.set("site", site);
			this_tree.set("plot", plot);
			console.log(this_tree);

			//DBH Tooltip 
			updateFunctions();
		});
    });
    */
    
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
	
	return looper(date.y, 1, 4, "") + "/" + looper(date.m, 1, 2, "") + "/" + looper(date.d, 1, 2, "");
	
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
