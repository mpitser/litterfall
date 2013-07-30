define([
  'jquery',
  'underscore',
  'backbone'
], function($, _, Backbone){	
	var plotRowReportsView = Backbone.View.extend({
		tagName: 'tr',
		template: '\
			<td class="btn-column" style="min-width: 60px">\
				<button class="btn-tree btn btn-mini btn-primary btn-analyze" type="button"><i class="icon-white icon-eye-open"></i> More</button>\
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
			</td>\
			',
		initialize: function(){
			this.render();
			
		},
		render: function(){
			var this_tree = this.model.toJSON();
			
			//$el --> gets the jQuery object for this view's element 
			//*.attr('id', this_tree._id.$oid) --> sets 'id' to MongoDB value for tree's ID
			//takes the tree's data, assigns it to this.template, inserts the HTML into the jQuery object for this view's element
			this.$el.attr('id', 'tree' + this_tree._id.$oid).html(_.template(this.template, {tree: this_tree}));
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
		events: {
			'click .btn-analyze': 'goToTree',								//if update button is clicked, runs updateTree function
		},
		goToTree: function(){
			//goto update tree page
			var sub_id = this.model.get("sub_tree_id");
			var tree_url = "/treeid/" + this.model.get("tree_id") + ((sub_id) ? '/subtreeid/' + sub_id : '');
			document.location.hash = document.location.hash + tree_url;

				
		},
	});
	return plotRowReportsView;
});
