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
			var self = this;
			$.getJSON('data/tree_species.json', function(data){
				$.each(data, function(index, val) {
					new_row = "<tr><td class='sample-type' id='" + val + "'>"+ val + " leaves</td>";
					for (var i = 1; i < 6; i++)  {
						new_row += "<td class='data-entry'><input type='text' size=1 id='" + val.replace(" ", "_") + i + "'class='data-leaf input-small'></td>";
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
			var today = new Date();
			today = (today.getMonth() + 1) + "/" + today.getDate() +  "/" + today.getFullYear();
			//console.log(today);
			
			$("#date").val(today);
			$(".btn-save").click(self.save);
			$(".clear").click(this.clear);
			$(".clearall").click(this.clearAll);
			$(".close").click(function() {
				event.preventDefault();
				$(".save-success").hide();
			});	
			this.addAutocomplete();
			if (this.model.get("_id") != undefined) {
				this.renderEdit();
			}
		},
		renderEdit: function() {
			$("h2").text("Edit Observation in the Litterfall Database");
			$(".btn-save").text("Update");
			$.getJSON('cgi-bin/litterfall.py?oid='+ this.model.get("_id").$oid, function(data){
				var value = data[0];
				$('.date-picker').val(toFormattedDate(value.date));
				$('.' + value.site).attr("selected", "selected");
				$('.observers').val(value.observers);
				$('.notes').val(value.notes);
				$("#plot").val(value.plot);
				if (value.weather != undefined) {
					$("#precipitation").val(value.weather.precipitation);
					$("#sky").val(value.weather.sky);
				}
				$("#type").val(value.collection_type);
				$.each(value.trap_data, function(index, val) {
					$('#'+val.type.replace(" ", "_") + val.trap).val(val.value);
				});				
				$("#site").val(value.site);

			});	
		},
		addValidate: function() {
			$("input").blur(this.check);
		},
		check: function() {
			console.log("in check fxn");
			if ($(this).hasClass("data-leaf") || $(this).hasClass("data-non-leaf")){
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
			$.getJSON(app.config.cgiDir + '/litterfall.py?observers=getList', function(data){
				$("#observers").typeahead({
					minLength: 0,
					items: Infinity,
					source: data,
					jsonSource: data,
					type: "observersList"
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
					<h3><i class="icon-large icon-warning-sign"></i> Clear all data?</h3>\
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
					<h3><i class="icon-large icon-warning-sign"></i> Clear this trap?</h3>\
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
				
				/* clear all data from trap column */
				$.each($("." +table), function(index, value) {
					if (value.id.substring(value.id.length-1, value.id.length) == trap) {
						value.value = "";
					}
				});
				
			});
		},
		validate: function() {
			console.log("validate called")
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
				$(".date-picker").addClass("alert_invalid");
				$(".warning").show();
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
				$('html, body').animate({scrollTop: 0}, 300)
				return;
			} else {
				trap_data = [];
				$.each($(".data-leaf"), function(index, td){
					if (td.value != "" && !isNaN(td.value)) {
						trap_data.push({'material': 'leaf', 'value': parseFloat(td.value), 'type': td.id.substring(0, td.id.length-1).replace("_", " "), 'trap': parseInt(td.id.substring(td.id.length-1, td.id.length))});
					}
				});
				$.each($(".data-non-leaf"), function(index, td){
					if (td.value != "" && !isNaN(td.value)) {
						trap_data.push({'material': 'non-leaf', 'value': parseFloat(td.value), 'type': td.id.substring(0, td.id.length-1).replace("_", " "), 'trap': parseInt(td.id.substring(td.id.length-1, td.id.length))});
					}
				});
				if (trap_data.length == 0 && $(".trap-warning").css('display') == 'none') {
					$(".trap-warning").show();
					return;
				}
				var new_observers_orig = $("#observers").val().split(",");
				var new_observers = [];
				var new_observer = "";
				for (var i = 0; i < new_observers_orig.length; i++){
					new_observer = new_observers_orig[i].trim(" ");
					if (new_observer != "") new_observers.push(new_observer);
				}
				var site = $('#site').val()
				site = site.charAt(0).toUpperCase() + site.slice(1);
				var date = new Date($("#date").val());
			
				new_obs = ({
					site: site,
					plot: parseInt($('#plot').val()),
					date: date.toLitterfallDateObject(),
					weather: {"precipitation": $("#precipitation").val(), "sky": $("#sky").val()},
					collection_type: $("#type").val(),
					observers: new_observers,
					trap_data: trap_data,
					notes: $("#notes").val()
				});
				this.model.url = app.config.cgiDir + 'litterfall.py';
				this.model.save(new_obs);
				console.log(this.model.attributes);
				$('html, body').animate({scrollTop: 0}, 300);
				$(".btn-save").text("Update");
				$("h2").text("Edit Observation in the Litterfall Database");
				$("#obs-info").append("<div class='alert alert-success save-success'>Observation saved successfully!<a class='close'>&times;</a></div>");
			}
		}
	
	});
	return newObservationView;
	
	
});