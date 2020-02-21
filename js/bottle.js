$(function() {
	var f = {};
	
	(function(exports) {
		'use strict';
		
		var registered = {};
		
		exports.New = function(type) {
			var create = registered[type];
			if (create) {
				return create.apply(undefined, arguments)
			} else {
				var result = $(document.createElement(type));
				if (arguments.length == 2) {
					var attr = arguments[1];
					for (var name in attr) {
						result[name](attr[name]);
					}
				}
				return result;
			}
		}
		
		exports.Register = function(type, factory) {
			var prev = registered[type];
			registered[type] = factory;
			return prev;
		}
		
		exports.Unregister = function(type) {
			var prev = registered[type];
			delete registered[type];
			return prev;
		}
		
		return exports;
		
	})(f);
	
	f.Register('bottle', function(type, obj) {
		var headPart = f.New('span', {
			"addClass": ["bottle-head"],
			"append": [f.New('span').addClass("filler")]
		});
		
		var bodyPart = f.New('span', {
			"addClass": ["bottle-body"],
			"append": [f.New('span').addClass("filler")]
		});
		
		return f.New('div').addClass("bottle").append(headPart).append(bodyPart);
	});
	
	$("#add-bottle").on("click", function() {
		$("#bottle-container").append(f.New('bottle'));
	});
});