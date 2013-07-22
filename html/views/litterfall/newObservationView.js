//TODO: sample type validation
define([ 
	'jquery',
	'underscore', 
	'backbone',
	'collections/tree_data/selectionOptions',
	'views/tree_data/selectionOptionsView'
], function($, _, Backbone, newObservation, selectionOptions, selectionOptionsView){
	var newObservationView = Backbone.View.extend({
		initialize: function() {
			_.bindAll(this, 'validate'); // fixes loss of context for 'this' within methods
			_.bindAll(this, 'save'); // fixes loss of context for 'this' within methods
			this.render();

		},
		render: function() {
			var j;			
			this.addAutocomplete();
			var self = this;
			$.getJSON('data/tree_species.json', function(data){
				$.each(data, function(index, val) {
					new_row = "<tr><td class='sample-type' id='" + val + "'>"+ val + " leaves</td>";
					for (var i = 1; i < 6; i++)  {
						new_row += "<td class='data-entry'><input type='text' size=1 name='" + val + i + "'class='data-leaf input-small'></td>";
					}
					$("#leaf-table").append(new_row);
				});
				self.addValidate();
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
			$(".btn-save").click(self.save);
			$(".clear").click(this.clear);
			$(".clearall").click(this.clearAll);
			$(".close").click(function() {
				event.preventDefault();
				$(".save-success").hide();
			});
		},
		addValidate: function() {
			$("input").blur(this.check);
		},
		check: function() {
			if($(this).hasClass("data-leaf") || $(this).hasClass("data-non-leaf")){
				if (isNaN(this.value)){
					$(this).addClass("alert_invalid");
					$(this).attr("data-original-title", "Please enter a valid number");	
					$(this).tooltip();
					$(this).tooltip("show");
				} else {
					$(this).removeClass("alert_invalid");
					$(this).attr("data-original-title", "");
					$(this).tooltip("destroy");
				}	
			}
		},		
		addAutocomplete: function() {
			$.getJSON(app.config.cgiDir + '/litterfall.py?observers=all', function(data){
           	 	//console.log(data);
				$("#observers").typeahead({
					minLength: 0,
					items: Infinity,
					source: data,
					jsonSource: data,
					type: "observer"
				});
   			});
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
				$("textarea").val("");
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
			$.each($(".placeholder"), function(index, value){
				if (value.selected) {
					$(value).parent().addClass("btn-danger");
					$(value).parent().addClass("alert_invalid");
					$(".warning").show();
					error = true;
				} else {
					$(value).parent().removeClass("btn-danger");
					$(value).parent().removeClass("alert_invalid");

				}
			});
			if ($(".observers").val() == "") {
				$(".observers").addClass("alert_invalid");
				$(".warning").show();
				error = true;
			} else {
				$(".observers").removeClass("alert_invalid");
			}
			var date = new Date($("#date").val());
			if (date == "Invalid Date") {
				error = true;
				$(".warning").show();
				$(".date-picker").addClass("alert_invalid");
			} else {
				$(".date-picker").removeClass("alert_invalid");
			}
			if (error != true) {
				console.log("validation passed");
				$(".warning").hide()
				return true;
			}
			$(".alert_invalid").on("change", self.validate);
			return false;

		},
		save: function() {
			event.preventDefault();
			if (this.validate() == false) {
				console.log("validation failed");
				$('html, body').animate({scrollTop: 0}, 300)
				return;
			} else {
				console.log("save");
				trap_data = [];
				$.each($(".data-leaf"), function(index, td){
					if (td.value != "" && !isNaN(td.value)) {
						trap_data.push({'material': 'leaf', 'value': parseFloat(td.value), 'species': td.name.substring(0, td.name.length-1), 'trap': parseInt(td.name.substring(td.name.length-1, td.name.length))});
					}
				});
				$.each($(".data-non-leaf"), function(index, td){
					if (td.value != "" && !isNaN(td.value)) {
						trap_data.push({'material': 'non-leaf', 'value': parseFloat(td.value), 'species': td.name.substring(0, td.name.length-1), 'trap': parseInt(td.name.substring(td.name.length-1, td.name.length))});
					}
				});
				var new_observers_orig = $("#observers").val().split(",");
				var new_observers = [];
				var new_observer = "";
				for (var i = 0; i < new_observers_orig.length; i++){
					new_observer = new_observers_orig[i].trim(" ");
					if (new_observer != "") new_observers.push(new_observer);
				}
				var date = new Date($("#date").val());
				new_obs = ({
					site: $('#site').val(),
					plot: parseInt($('#plot').val()),
					date: date.toLitterfallDateObject(),
					weather: {"precipitation": $("#precipitation").val(), "sky": $("#sky").val()},
					collection_type: $("#type").val(),
					observers: new_observers,
					trap_data: trap_data,
					notes: $("#notes").val()
				});
				console.log(new_obs);
				this.model.url = app.config.cgiDir + 'litterfall.py';
				this.model.save(new_obs);
				$('html, body').animate({scrollTop: 0}, 300)
				success: $(".save-success").show();
				$(".placeholder").attr("selected", "selected");
				$("input").val("");
				$("textarea").val("");
			}
		}
	
	});
	return newObservationView;
	
	
});