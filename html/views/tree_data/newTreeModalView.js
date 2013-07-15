/*
View: newTreeModalView
Model: Tree
-------------------

A Bootstrap-powered modal that is prompted when the user tries to add a new tree or a new sub-tree.
It does not generate the new Tree model for you automatically, because it is my concern to separate
Views from Models--which is not successful by the way, as you can see.

Methods:
	addAutocomplete()
				Adds autocomplete to the species field. Powered by Bootstrap's typeahead.
	
	validateSpecies()
				Check whether species is acceptable.
*/
define([ 
	'jquery',
	'underscore', 
	'backbone'
], function($, _, Backbone){
	var newTreeModalView = Backbone.View.extend({
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
			// find out whether user is adding new tree or new sub-tree
			this.isSubTree = this.model.get('tree_id') > 0;
			// render!
			this.render();
		},
		render: function() {
			// Usual stuff

			this.$el.html(_.template(this.template, {}));

			// This is a bit ugly--to be fixed later
			// Nah, i'm not going to fix it
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
					$('.add-new-sub-tree').eq(0).trigger("notChoosingParentTree");
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
				error = "Don't you think it is a bit too far?";
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
				if (!(self.validateSpecies() && self.validateAngle() && self.validateDistance())) {
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
				distance: parseFloat($('#new-tree-distance').val())
			}, {
				success: function(model) {
					self.$el.modal("hide");
					if (back_to_plot == true) {
						self.trigger("treeSaved");
					} else {
						document.location.hash = document.location.hash + "/treeid/" + model.get("tree_id") + (self.isSubTree ? ("/subtreeid/" + model.get("sub_tree_id")) : "");
					}
				},
				error: function(model, xhr) {
					
					var saveTreeError = new errorView({
						xhr: xhr,
						targetId: 'save-tree-error'
					});
					saveTreeError.render().$el.prependTo("#add-new-tree-modal > .modal-body");
					
				}
			});

		}
	});
	return newTreeModalView;
});
