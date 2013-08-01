define([ 
	'jquery',
	'underscore', 
	'backbone'
], function($, _, Backbone) {
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
			$("#analyze-data").hide();	
			$("#loading").show();
			$("#csv").text("Date,Site,Plot,Collection Type,Observer 1,Observer 2,Observer 3,Trap,Acorns reproductive,All reproductive,Twigs,Bark,Miscellaneous");
			console.log("first")
			var species_list = ["Acorns reproductive", "All reproductive", "Twigs", "Bark", "Miscellaneous"];
			$.getJSON("data/tree_species.json", function(data){
				console.log(data);
				$.each(data, function(index, value) {
					species_list.push(value);
					var prev_csv = $("#csv").text()
					$("#csv").text(prev_csv + value + ",")
				});			
				$("#csv").text($("#csv").text() + "\n");
			});	
			var dis = this;
			query = "cgi-bin/litterfall.py" + query;
			$.getJSON(query, function(data){
				var time = 100;
				$.each(data, function(index, value) {
					var date_formatted = toFormattedDate(value.date);
					var regex = new RegExp(",","g")
					var observers = value.observers.toString().replace(regex, ", ");
					$("#litterfall-table").append("<tr class='obs"+index+"'><td>"+date_formatted+"</td><td>"+value.site+"</td><td>"+value.plot+"</td><td>"+value.collection_type+"</td><td></td><td>"+observers+"</td><td></td><td></td></tr>");
					for (var i = 5; i > 0; i--) {
						$(".obs"+index).after("<tr class='obs"+index+"trap"+i+"'><td></td><td></td><td></td><td></td><td></td><td></td><td>"+i+"</td><td></td></tr>");
						var prev_csv = $("#csv").text()
						var csv_line = date_formatted + "," + value.site + "," + value.plot + "," + value.collection_type + "," + value.observers + "," 
						for (j = 0; j < 3 - value.observers.length; j++){
							csv_line += ",";
						}
						csv_line += i + ",";
						$.each(species_list, function(indexx, species){
							var matched = false;
							$.each(value.trap_data, function(ind, sample) {
								if (sample.type == species && sample.trap == i) {
									matched = true;
									$(".obs"+index+"trap"+sample.trap).append("<td>"+sample.value+"</td>");
									csv_line += sample.value + ","
								}
							});			
							if (!matched) {
									$(".obs"+index+"trap"+i).append("<td></td>");
									csv_line += ","
							}
						});
						$("#csv").text($("#csv").text() + csv_line + "\n");
					}					
				});
				var none = true;
				$.each(species_list, function(index, value){
					console.log("finding blanks");
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
					$("#export-data").show()

				} else {
					$("#none-found").show();
					$("#litterfall-table").hide();
					$("#hide-empty").hide();
					$("#show-empty").hide();
					$("#export-data").hide();
				}
				$("#litterfall-table").tableNav();
				// currently tablesorter messes everything up, which is unfortunate. 
				//TODO: make a modified version of tablesorter that will not screw everything up.
				//$("#litterfall-table").tablesorter();
				console.log("finished getJSON");
				$("#analyze-data").show();
				$("#loading").hide();

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
			$("#export-data").click(function() {
				dis.exportData();
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
		
		},
		
		exportData: function() {
			//console.log($("#litterfall-table").text());
			this.createCSVFile($("#csv").text());
		},
		createCSVFile: function(CSV) {
    	
			// --------------
			// the code below is copied from some random website
			// it will post the content to a Python script file, which will create the file with the proper header
			// and file name
			
			// Creating a 1 by 1 px invisible iframe:

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
	
				form.attr('action',app.config.cgiDir + "create_file.py");
				form.find('input[name=filename]').val("litterfall");
				form.find('input[name=content]').val(CSV);
	
				// Submitting the form to download.php. This will
				// cause the file download dialog box to appear.
	
				form.submit();
			}, 50);
			
    	}

	});		
	return reportsRow;
});
