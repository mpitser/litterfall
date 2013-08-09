define([ 
	'jquery',
	'underscore', 
	'backbone',
	'models/tree_data/Tree'
], function($, _, Backbone, Tree){
	var treeUpdateView = Backbone.View.extend({
		tagName: 'div',
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
				</td>\
				<td class="editable"><span class="show-obs-info display_cell observers"><%= entry.observers.join(", ") %></span><span class="edit-obs-info edit_cell observers"><input title="Observers field may not be empty." type="text" value="<%= entry.observers %>"></span></td>\
				<td class="editable"><span class="show-obs-info display_cell diameter"><%= entry.value %></span><span class="edit-obs-info edit_cell diameter"><input title="Please enter an integer or floating point number such as 5, 6.1, 10.33" type="text" value="<%= entry.value %>"></span></td>\
				<td class="editable"><span class="show-obs-info display_cell status"><%= entry.status %></span><span class="edit-obs-info edit_cell status"><div class="edit-obs-info status btn-group btn-group-vertical" data-toggle="buttons-radio">\
  					<button type="button" class="btn btn-mini btn-info status alive" style="width: 120px" value="alive">Alive</button>\
  					<button type="button" class="btn btn-mini btn-warning status dead_standing" style="width: 120px" value="dead_standing">Dead (standing)</button>\
 					<button type="button" class="btn btn-mini btn-danger status dead_fallen" style="width: 120px" value="dead_fallen">Dead (fallen)</button>\
					<button type="button" class="btn btn-mini btn-inverse status missing" style="width: 120px" value="missing">Missing</button>\
					</div></span></td>\
				<td class="editable"><span class="show-obs-info display_cell notes"><%= entry.notes %></span><span class="edit-obs-info edit_cell notes"><input type="text" value="<%= entry.notes %>"></span></span></td>\
		',
		templateUpdate: '\
		<div id="tree-info">\
			<button class="btn btn-success btn-mini edit-tree-info-btn"><i class="icon-white icon-leaf"></i> Edit Tree Info</button>\
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
			<button class="btn-new-observation btn btn-mini btn-success pull-left" type="button"><i class="icon-white icon-plus-sign"></i> New Entry</button>\
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
							<button class="btn btn-mini btn-primary edit-existing" type="button"><i class="icon-white icon-edit"></i> Edit</button>\
							<button class="btn-delete-observation btn btn-mini btn-warning" type="button"><i class="icon-white icon-trash"></i> Delete</button>\
						</div>\
						<div class="edit-obs-info edit_cell btn-group">\
							<button class="btn-save-observation btn btn-mini btn-success" type="button">Submit</button>\
							<button class="btn-cancel-observation btn btn-mini btn-danger" type="button">Cancel</button>\
						</div>\
					</td>\
					<td class="editable">\
						<span class="display_cell date_select"><%= toFormattedDate(entry.date) %></span>\
						<span class="edit_cell date_select"><input data-original-title="Enter a date in mm/dd/yyyy format. It may not already have an associated diameter entry or be in the future." type="text" value="<%= toFormattedDate(entry.date) %>"/>\
					</td>\<td class="editable"><span class="show-obs-info display_cell observers"><%= entry.observers %></span><span class="edit-obs-info edit_cell observers"><input id="observers-typeahead" title="Who collected this data" type="text" value="<%= entry.observers %>"></span></td>\
					<td class="editable"><span class="show-obs-info display_cell diameter"><%= entry.value %></span><span class="edit-obs-info edit_cell diameter"><input title="Please enter an integer or floating point number such as 5, 6.1, 10.33" type="text" value="<%= entry.value %>"></span></td>\
					<td class="editable"><span class="show-obs-info display_cell status"><%= entry.status %></span><span class="edit-obs-info edit_cell status"><div class="edit-obs-info status btn-group btn-group-vertical" data-toggle="buttons-radio">\
  						<button type="button" class="btn btn-mini btn-info status alive" style="width: 120px" value="alive">Alive</button>\
  						<button type="button" class="btn btn-mini btn-warning status dead_standing" style="width: 120px" value="dead_standing">Dead (standing)</button>\
 						<button type="button" class="btn btn-mini btn-danger status dead_fallen" style="width: 120px" value="dead_fallen">Dead (fallen)</button>\
 						<button type="button" class="btn btn-mini btn-inverse status missing" style="width: 120px" value="missing">Missing</button>\
					</div></span></td>\
					<td class="editable"><span class="show-obs-info display_cell notes"><%= _.escape(entry.notes) %></span><span class="edit-obs-info edit_cell notes"><input type="text" value="<%= _.escape(entry.notes) %>"></span></span></td>\
				</tr>\
			<% }); %>\
			</tbody>\
			</table>\
			<div class="button-row">\
				<button class="btn-new-observation btn btn-mini btn-success pull-left" type="button"><i class="icon-white icon-plus-sign"></i> New Entry</button>\
			</div>\
		',
		initialize: function(){
			this.render();	
		},
		render: function() {
		
			var this_tree = this.model.toJSON();
			//get the dates in descending order
			var dates = this_tree.diameter.sort(function(a,b){return (b.date.y-a.date.y)});
			this_tree.dates_desc = dates;
			this.$el.html(_.template(this.templateUpdate, {tree: this_tree}));
			$(".title").text("Updating Tree Data ");
			$(".back").unbind("click.back").bind("click.back", $.proxy(function() {
				window.location.hash = "#data/trees/update/site/" + this.model.get('site') + "/plot/" + this.model.get('plot');
			}, this));
			$("#tree-observations").tablesorter({headers: { 0: { sorter: false}}}); 
			$(".show-obs-info").show();
			$(".edit-obs-info").hide();
			this.postRender();
	
		},
		postRender: function(){
			//add any methods/functions that need to be call after redendering the Tree edit view
			this.populateSpecies();
			this.addObserversTypeahead();
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
		addObserversTypeahead: function() {
			/* initializes and populates the typeahead for observers */

			$.getJSON(app.config.cgiDir + 'tree_data.py?observers=getList', function(data){
           	 	
           	 	// initialize the typeahead
				$("#observers-typeahead").typeahead({
					minLength: 0,	// should make the typeahead open on focus instead of having to type anything
					items: Infinity,
					source: data,
					jsonSource: data,
					type: "observersList"	// this field is used in conditional stuff in app.js (extension of the typeahead prototype) if you edit that!
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
				success: function() {self.render();}
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
				type: 'observersList'
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
				console.log("click allive");
				$new_entry_row.find(".status.alive").addClass("to_validate");
				dis.validateField();
			});
			$new_entry_row.find(".status.dead_standing").on("click", function() {
				console.log("click dead standing");			
				$new_entry_row.find(".status.dead_standing").addClass("to_validate");
				dis.validateField();
			});
			$new_entry_row.find(".status.dead_fallen").on("click", function() {
				console.log("click dead fallen");
				$new_entry_row.find(".status.dead_fallen").parent().addClass("to_validate");
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
				type: 'observersList'
			});
			$(".already").remove();
			
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
				console.log("click allive");
				$row_to_edit.find(".status.alive").addClass("to_validate");
				dis.validateField();
			});
			$row_to_edit.find(".status.dead_standing").on("click", function() {
				console.log("click dead standing");			
				$row_to_edit.find(".status.dead_standing").addClass("to_validate");
				dis.validateField();
			});
			$row_to_edit.find(".status.dead_fallen").on("click", function() {
				console.log("click dead fallen");
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
			$row_to_save.find(".status.active").addClass("to_validate");
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

			// new entry object
			var new_entry = {
				date: ($row_to_save.find(".edit_cell.date_select :input").datepicker("getDate")).toLitterfallDateObject(),
				year: ($row_to_save.find(".edit_cell.date_select :input").datepicker("getDate")).getFullYear(),
				value: parseFloat($row_to_save.find(".diameter :input").val()).toFixed(1), //round the diameter measurement to 1 decimal place
				observers: new_observers,
				notes: $row_to_save.find(".notes :input").val(),
				status: $row_to_save.find(".status.active").val()
			};		
					
			this.model.set('status', $row_to_save.find(".status.active").val());
			
		
			// if it is a new one
			if (is_this_row_new === true) {
				
				// add a new entry to the list, to where it should be
				var target_index = _.sortedIndex(entries_array, new_entry, function(entry) {
					return entry.date.y;
				});
				
				// then insert it
				this.model.set('diameter', _.union(_.last(entries_array, target_index), [new_entry], _.rest(entries_array, target_index)));
				
				
			} else { // if we are editing a row
				
				// get the index from the id (id="entry-#")
				var target_index = parseInt(($row_to_save.attr("id")).split("-")[1]);
				
				// set the entry at the target index to the new one
				entries_array[target_index] = new_entry;
				
				// set the new diameter (need to reverse for the model!!)
				this.model.set('diameter', entries_array.reverse());
				
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
						xhr: xhr
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
					<h3><i class="icon-large icon-warning-sign"> </i> Are you sure you want to proceed?</h3>\
				</div>\
				<div class="modal-body">\
					<p>This observation will be permanently removed from the database.</p>\
				</div>\
				<div class="modal-footer">\
					<button class="btn btn-primary" data-dismiss="modal" aria-hidden="true">Cancel</button>\
					<button class="btn btn-danger" id="no-remorse">Yes, delete this observation</button>\
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
			    console.log(_.without(entries_array, entries_array[target_index]));
				
				// delete it!
				self.model.set('diameter', _.without(entries_array, entries_array[target_index]));
				self.model.url = app.config.cgiDir + 'tree_data.py';
				console.log(self.model);
				self.model.save();
				$row_to_delete.hide(500);
				self.render();
				
			});
			
		},
		validateField: function(){

			var current_row = $("#tree-observations > tbody > tr .edit_cell :visible").parents("tr");
			var field_to_validate = current_row.find(".to_validate").parent().attr("class").replace("to_validate", "").replace("display_cell", "").replace("edit_cell", "").replace("show-obs-info", "").replace("edit-obs-info", "").trim();

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
						
			if (error_message) {				
				//flag the field as invalid with a tooltip and highlighted color
				// change the title that will be displayed in the tooltip
				$(".edit_cell."+field_to_highlight+" :input").attr("data-original-title", error_message);	
				$(".edit_cell."+field_to_highlight+" :input").tooltip();
				$(".edit_cell."+field_to_highlight+" :input" ).tooltip("show");
				$(".edit_cell."+field_to_highlight+" :input" ).addClass("alert_invalid");	// highlight invalid field
				
				current_row.find(".to_validate").removeClass("to_validate");
				return false;
			} else if (status_error_message) {	// if there is an error in validation of the status buttons
				console.log(status_error_message);
				current_row.find(".btn-group.status").tooltip('destroy').tooltip({title: status_error_message}).tooltip('show');
				current_row.find(".to_validate").removeClass("to_validate");
				return true;
			} else {
				//if field passes all tests, make sure nothing is highlighted anymore 
				// change the title that will be displayed on hovering
				$(".edit_cell :input").attr("data-original-title", "");	
				$(".edit_cell :input").removeClass("alert_invalid");
				$(".edit_cell :input").tooltip("destroy");
				current_row.find(".to_validate").removeClass("to_validate");
				return true;
			}
			console.log(current_row.find(".to_validate"));
			current_row.find(".to_validate").removeClass("to_validate");
			//$(current_row.find(".to_validate")).removeClass("to_validate");
			
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
			
			var curRowIndex = parseInt($current_row.attr("id").charAt($current_row.attr("id").length - 1));
			
			var last_known_status = (this.model.get("diameter")[0] !== undefined) ? this.model.get("diameter")[curRowIndex + 1].status : "alive";
			console.log(last_known_status);
			console.log(this.model.get("diameter")[0].status);

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
			
			$.getJSON(app.config.cgiDir + 'tree_data.py?observers=getList', function(data) {
				
				for (i in data) {
					observers_array.push(data[i]);
				}
				
				return observers_array;
			});
			
			return observers_array;
		}
	});
	return treeUpdateView;
});
