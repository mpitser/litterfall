define([ 
	'jquery',
	'underscore', 
	'backbone',
	'models/tree_data/Tree'
], function($, _, Backbone, Tree){
	var treeReportsView = Backbone.View.extend({
		tagName: 'div',
		templateReport: '\
		<div id="tree-info">\
			<ul>\
				<li>Species: <span class="display-tree-info species"><%= tree.species %></span><span class="edit-tree-info species"><select></select></span></li>\
				<li>Angle (degrees): <span class="display-tree-info angle"><%= tree.angle %></span><span class="edit-tree-info angle"><input value="<%= tree.angle %>"></input></span></li>\
				<li>Distance (meters): <span class="display-tree-info distance"><%= tree.distance %></span><span class="edit-tree-info distance"><input value="<%= tree.distance %>"></input></span></li>\
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
				<td><span class="display_cell notes"><%= _.escape(entry.notes) %></span>\
			</tr>\
			<% }); %>\
			</tbody>\
			</table>\
		',
		initialize: function(){	
			this.render();	
		},
		render: function() {
			var this_tree = this.model.toJSON();
			//get the dates in descending order
			var dates = this_tree.diameter.sort(function(a,b){return (b.year-a.year)});
			this_tree.dates_desc = dates;
			this.$el.html(_.template(this.templateReport, {tree: this_tree}));
			//$(".back > a").attr("href", "#data/reports/trees/site/" + $(".site-name").text() + "/plot/" + $(".plot-number").text());
			$(".back").unbind("click.back").bind("click.back", $.proxy(function() {
				document.location.hash = "#data/trees/reports/site/" + this.model.get('site') + "/plot/" + this.model.get('plot');
			}, this));
			$(".title").text("Analyzing Tree Data ");
			$("#tree-observations").tablesorter();
		},
	});
	return treeReportsView;
});
