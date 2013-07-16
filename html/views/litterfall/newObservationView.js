define([ 
	'jquery',
	'underscore', 
	'backbone',
	'collections/tree_data/selectionOptions',
	'views/tree_data/selectionOptionsView',
	'models/litterfall/Observation'
], function($, _, Backbone, newObservation, selectionOptions, selectionOptionsView, Observation){
	var newObservationView = Backbone.View.extend({
		initialize: function() {
			_.bindAll(this, 'validate'); // fixes loss of context for 'this' within methods
			this.render();

		},
		render: function() {
			var j;
			$.getJSON('data/tree_species.json', function(data){
				$.each(data, function(index, value) {
					if (value.indexOf(".") == -1) {
						new_row = "<tr><td class='sample-type' id='" + value + "'>"+value+ " leaves</td>";
						for (var i = 1; i < 6; i++)  {
							new_row += "<td class='data-entry'><input type='text' size=1 name='" + value + i + "'class='data-leaf input-small'></td>";
						}
					}
					$("#leaf-table").append(new_row);
				});
				j = 3;
			});
			$("#date").datepicker({
				maxDate: 0,
				changeYear: true,
				changeMonth: true,
				yearRange: '2000:c', // allow years to be edited back to the start of collection, and up to current year
				//constrainInput: true,
				onSelect: function() {
					$(".ui-datepicker a").removeAttr("href");
				}
			});
			
			var self = this;

			$(".btn-save").click(self.validate);
			$(".clear").click(this.clear);
			$(".clearall").click(this.clearAll);
			
		},
		clearAll: function() {
			event.preventDefault();
			var $alert_modal = $('<div></div>').addClass("modal hide face").attr({
				'tabindex': '-1',
				'role': 'dialog',
				'aria-labelledby': 'dialog',
				'aria-hidden': 'true'
			}).html('\
				<div class="modal-header">\
					<h3>Clear all data?</h3>\
				</div>\
				<div class="modal-body">\
					<p>Are you sure you want to clear all of the data you entered for this observation? This action cannot be undone.</p>\
				</div>\
				<div class="modal-footer">\
					<button class="btn btn-primary" data-dismiss="modal" aria-hidden="true">Cancel</button>\
					<button class="btn btn-danger" id="yes-clear">Yes, clear all.</button>\
				</div>\
			');
			$('body').append($alert_modal);
			$alert_modal.modal();
			$alert_modal.modal('show');
			$alert_modal.on('hidden', function() {
				$alert_modal.remove();
			});
		
			$alert_modal.find('#yes-clear').on('click', function() {
				$alert_modal.modal("hide");
				$(".placeholder").attr("selected", "selected");
				$("input").val("");
			});
			
		},
		clear: function(event) {			
			event.preventDefault();
			var $alert_modal = $('<div></div>').addClass("modal hide face").attr({
				'tabindex': '-1',
				'role': 'dialog',
				'aria-labelledby': 'dialog',
				'aria-hidden': 'true'
			}).html('\
				<div class="modal-header">\
					<h3>Do you want to continue?</h3>\
				</div>\
				<div class="modal-body">\
					<p>Are you sure you want to delete all of the data you entered for this trap? This action cannot be undone.</p>\
				</div>\
				<div class="modal-footer">\
					<button class="btn btn-primary" data-dismiss="modal" aria-hidden="true">Cancel</button>\
					<button class="btn btn-danger" id="yes-clear">Yes, clear this trap.</button>\
				</div>\
			');

			$('body').append($alert_modal);
			$alert_modal.modal();
			$alert_modal.modal('show');
			$alert_modal.on('hidden', function() {
				$alert_modal.remove();
			});
		
			var self = this;
			$alert_modal.find('#yes-clear').on('click', function() {
				$alert_modal.modal("hide");
				var table = self.name.substring(0, self.name.length-1);
				var trap = self.name.substring(self.name.length-1, self.name.length);
				$.each($("." +table), function(index, value) {
					if (value.name.substring(value.name.length-1, value.name.length) == trap) {
						console.log("should be clearing this");
						value.value = "";
					}
				});
			});
		},
		validate: function() {
			event.preventDefault();
			var self = this;
			var error = false;
			console.log("validate");
			$.each($(".placeholder"), function(index, value){
				if (value.selected) {
					$(value).parent().addClass("btn-danger");
					$(".warning").show();
					error = true;
				} else {
					$(value).parent().removeClass("btn-danger");
				}
			});
			if ($(".observers").val() == "") {
				$(".observers").css("background-color", "#F5A9A9");
				$(".warning").show();
				error = true;
			} else {
				$(".observers").css("background-color", "#FFFFFF");
			}
			if (error != true) {
				$(".warning").hide()
				this.save();
			}

		},
		save: function() {
			event.preventDefault();
			console.log("save");
			//this.validate();
			trap_data = [];
			$.each($(".data-leaf"), function(index, td){
				if (td.value != "") {
					trap_data.push({'material': 'leaf', 'value': parseFloat(td.value), 'species': td.name.substring(0, td.name.length-1), 'trap': td.name.substring(td.name.length-1, td.name.length)});
				}
			});
			$.each($(".data-non-leaf"), function(index, td){
				if (td.value != "") {
					trap_data.push({'material': 'non-leaf', 'value': parseFloat(td.value), 'species': td.name.substring(0, td.name.length-1), 'trap': td.name.substring(td.name.length-1, td.name.length)});
				}
			});
			var new_observers_orig = $("#observers").val().split(",");
			var new_observers = [];
			var new_observer = "";
			for (var i = 0; i < new_observers_orig.length; i++){
				new_observer = new_observers_orig[i].trim(" ");
				if (new_observer != "") new_observers.push(new_observer);
			}
			new_obs = ({
				//date: $("#date").val(),
				weather: {"precipitation": $("#precipitation").val(), "sky": $("#sky").val()},
				collection_type: $("#type").val(),
				observers: new_observers,
				trap_data: trap_data,
				notes: $("#notes").val()
			});
			this.model.url = app.config.cgiDir + 'litterfall.py';
			this.model.save(new_obs);
			document.location.hash = document.location.hash;
		}
	
	});
	return newObservationView;
	
	
});