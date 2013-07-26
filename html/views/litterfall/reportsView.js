define([ 
  'jquery',
	'underscore', 
	'backbone'
], function($, _, Backbone){
	var reportsRow = Backbone.View.extend({
		template: '\
			<tr class="obs<%= index %>">\
			<td><%= index %></td>\
			<td><%= date_formatted</td>\
			<td><%= value.site %></td>\
			<td><%= value.plot %></td>\
			<td><%= value.collection_type %></td>\
			<td><%= value.observers %></td>\
			<td></td>\
			<td></td>\
			</tr>\
			',
		initialize: function() {
		},
		render: function(query) {
			var species_list = ["Acorns reproductive", "All reproductive", "Twigs", "Bark", "Miscellaneous"];
			$.getJSON("data/tree_species.json", function(data){
				$.each(data, function(index, value) {
					species_list.push(value);
				});
			});			
			query = "cgi-bin/litterfall.py" + query;
			$("#spinner").show();
			$.getJSON(query, function(data){
				$("#spinner").hide();
				$.each(data, function(index, value) {
					var date_formatted = toFormattedDate(value.date);
					var regex = new RegExp(",","g")
					var observers = value.observers.toString().replace(regex, ", ");
					$("#litterfall-table").append("<tr class='obs"+index+"'><td>"+date_formatted+"</td><td>"+value.site+"</td><td>"+value.plot+"</td><td>"+value.collection_type+"</td><td></td><td>"+observers+"</td><td></td><td></td></tr>");
					for (var i = 5; i > 0; i--) {
						$(".obs"+index).after("<tr class='obs"+index+"trap"+i+"'><td></td><td></td><td></td><td></td><td></td><td></td><td>"+i+"</td><td></td></tr>");
						$.each(species_list, function(indexx, species){
							var matched = false;
							$.each(value.trap_data, function(ind, sample) {
								if (sample.type == species && sample.trap == i) {
									matched = true;
									$(".obs"+index+"trap"+sample.trap).append("<td>"+sample.value+"</td>");
								}
							});			
							if (!matched) {
									$(".obs"+index+"trap"+i).append("<td></td>");
							}
						});
					}
				});
				var none = true;
				$.each(species_list, function(index, value){
					var blank = true;
					var n = index+9;
					$.each($("#litterfall-table tbody tr td:nth-child("+n+")"), function(i, td){
						if ($(td).text() != ""){
							blank = false;
							none = false;
						}
					});
					if (blank) {
						$("#litterfall-table tr td:nth-child("+n+")").hide();
						$("#litterfall-table tr th:nth-child("+n+")").hide();
					}
				});
				if (data.length > 0) {
					$("#none-found").hide();
					$("#litterfall-table").show();
					$("#hide-empty").hide();
					$("#show-empty").show();

				} else {
					$("#none-found").show();
					$("#litterfall-table").hide();
					$("#hide-empty").hide();
					$("#show-empty").hide();
				}
				$("#litterfall-table").tableNav();
				// currently tablesorter messes everything up, which is unfortunate. 
				//TODO: make a modified version of tablesorter that will not screw everything up.
				//$("#litterfall-table").tablesorter();
			});
			$(".none-close").click(function() {
				event.preventDefault();
				$(".none-close").parent().hide('medium');
			});
			var dis = this;
			$("#hide-empty").click(function() {
				dis.hideEmpty(species_list);
				$("#hide-empty").hide();
				$("#show-empty").show();
			});
			$("#show-empty").click(function() {
				$("#litterfall-table tr td").show();
				$("#litterfall-table tr th").show();
				$("#hide-empty").show();
				$("#show-empty").hide();
			});
					
		},
		hideEmpty: function(species) {
			$.each(species, function(index, value){
					var blank = true;
					var n = index+9;
					$.each($("#litterfall-table tbody tr td:nth-child("+n+")"), function(i, td){
						if ($(td).text() != ""){
							blank = false;
						}
					});
					if (blank) {
						$("#litterfall-table tr td:nth-child("+n+")").hide();
						$("#litterfall-table tr th:nth-child("+n+")").hide();
					}
				});
		
		}

	});		
	return reportsRow;
});
