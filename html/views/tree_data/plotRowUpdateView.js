define([
  'jquery',
  'underscore',
  'backbone',
  'models/tree_data/Tree'
], function($, _, Backbone, Tree){
	var plotRowUpdateView = Backbone.View.extend({
		tagName: 'tr',				
		template:	'\
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
			<td>\
				<%= tree.latest_DBH_message %>\
			</td>\
			<td>\
				<%= tree.latest_comment %>\
			</td>',
		initialize: function(){
			this.render();
		},
		render: function(){
			var this_tree = this.model.toJSON();
			/*
			this_tree.this_date = "";
			for (date in this_tree.diameter){                      //loop through the list of existing dates and store the most recent
				if (date > this_tree.this_date){					  //Date format is YYYYMMDD (reformated in template html above)
					this_tree.this_date = date;
				}
			}*/
			this_tree.latest_DBH_message = "-";
			this_tree.latest_comment = "-";
			
			if (this_tree.diameter.length > 0) {
				
				// get most recent entry
				// already sorted (the latest comes first) by Tree.parse()
				var most_recent_entry = _.first(this_tree.diameter);
				
				this_tree.latest_DBH_message = most_recent_entry.value + " in " + most_recent_entry.year;
				this_tree.latest_comment = _.isEmpty(most_recent_entry.notes) ? '-' : most_recent_entry.notes;
				
			}
			//$el --> gets the jQuery object for this view's element 
			//*.attr('id', this_tree._id.$oid) --> sets 'id' to MongoDB value for tree's ID
			//takes the tree's data, assigns it to this.template, inserts the HTML into the jQuery object for this view's element
			this.$el.attr('id', this_tree._id.$oid).html(_.template(this.template, {tree: this_tree}));
			this.$el.addClass("tree-cluster-" + this_tree.tree_id);
			this.$el.children().eq(2).css("font-style","italic");
			this.options.targetEl.append(this.el);	

		},
		events: {
			'click .delete-row': 'deleteTree',
			'click .btn-update': 'goToTree',								//if update button is clicked, runs updateTree function
			'click .btn-analyze': 'goToTree',								//if update button is clicked, runs updateTree function
			'click .add-new-sub-tree-from-row': function() {
				$('.add-new-sub-tree').eq(0).trigger("choosing_parent_tree");
				this.model.trigger("add_new_sub_tree_from_row");
				//this.addSubTree(this.model.get("tree_id"));
			}
		},
		goToTree: function(){
			//goto update tree page
			var sub_id = this.model.get("sub_tree_id");
			var tree_url = "/treeid/" + this.model.get("tree_id") + ((sub_id) ? '/subtreeid/' + sub_id : '');
			document.location.hash = document.location.hash + tree_url;
		},
		deleteTree: function(){

			// ask the user whether they're absolutely sure...
			var $alert_modal = $('<div></div>').addClass("modal hide face").attr({
				'tabindex': '-1',
				'role': 'dialog',
				'aria-labelledby': 'dialog',
				'aria-hidden': 'true'
			}).html('\
				<div class="modal-header">\
					<h3>This tree will be gone forever.</h3>\
				</div>\
				<div class="modal-body">\
					<p>Take a deep breathe and think carefully. This tree will never return once it is gone. Are you sure you want to get rid of it?</p>\
				</div>\
				<div class="modal-footer">\
					<button class="btn" data-dismiss="modal" aria-hidden="true">No&mdash;sorry, tree</button>\
					<button class="btn btn-danger" id="no-remorse">Yes&mdash;sorry, tree</button>\
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
				self.deleteTreeFunction();
			});

		},
		deleteTreeFunction: function() {

			var this_tree_el = this.$el;
			this.model.url = app.config.cgiDir + 'tree_data.py';
			var result = this.model.destroy({
			
				success: function(model) { // once done
					
					var this_model = model;					
					this_tree_el.fadeOut("slow", function() {						//function called after fadeOut is done
						
						// remove the row--we need this because if we just hide (using visibility:hidden) the row then the table-stripe class will not work
						$("#"+model.get('_id').$oid).remove();

						var target_tree_id = model.get('tree_id');

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
							updated_tree.url = app.config.cgiDir + 'tree_data.py?oid=' + $(this).attr('id');
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
					
					// reset tablesorter
					$('#plot-table').trigger('update');

				}, 
				error: function(model, xhr) {
					
					var deleteTreeError = new errorView({xhr: xhr});
					deleteTreeError.render().$el.insertAfter($("h1").eq(0));
					
				}
			});
		}
	});
	return plotRowUpdateView;
});
