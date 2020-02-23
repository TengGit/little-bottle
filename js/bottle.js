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
	
	f.Register('bottle', function(type, formData) {
		var bottleName, bgColor;
		
		for (var i = 0; i < formData.length; i++) {
			switch (formData[i].name) {
			case "bottle-text":
				bottleName = formData[i].value;
				break;
			case "bottle-color":
				if (formData[i].value !== "custom") {
					bgColor = formData[i].value;
				} else {
					bgColor = "black";
				}
				break;
			}
		}
		
		var headPart = f.New('span').addClass("bottle-head").css("background", bgColor).append(f.New('span').addClass("filler"));
		var bodyPart = f.New('span').addClass("bottle-body").css("background", bgColor).append(f.New('span').addClass("filler"));
		var theBottle = f.New('div').addClass("bottle").append(headPart).append(bodyPart);
		var bottleContainer = f.New('div').append(theBottle);
		var nameLabel = f.New("div").addClass("bottle-description").text(bottleName);
		var result = f.New("div").addClass("col p-2").append(bottleContainer).append(nameLabel);
		theBottle.data("bottle", {
			"$sel": theBottle,
			"$val": 0,
			val: function() {
				if (arguments.length) {
					var newValue = arguments[0];
					if (newValue > 80) {
						this.$sel.children(".bottle-head").children(".filler").css("height", (100 - newValue) * 5 + "%");
						this.$sel.children(".bottle-body").children(".filler").css("height", 0);
					} else {
						this.$sel.children(".bottle-head").children(".filler").css("height", "100%");
						this.$sel.children(".bottle-body").children(".filler").css("height", (80 - newValue) * 1.25 + "%");
					}
					this.$val = newValue;
				} else {
					return this.$val;;
				}
			},
			name: bottleName
		});
		return result;
	});
	
	
	var bottles = {}, size = 0;
	var MAX_BOTTLE_NUM = 100;
	var ERR_BOTTLE_NUMBER_EXCEED = "您真有耐心，不过这里最多只能放 #1 个瓶子……";
	var ERR_BOTTLE_EXISTS = '换个名字吧，瓶子 "#1" 已经有了~';
	var ERR_BOTTLE_NAME_EMPTY = "给瓶子起个名字呗 :)"
	var DBLCLICK_THRESHOLD = 300;
	
	var silenceMode = false;
	
	$("[name=bottle-color]").each(function() {
		$(this).parent().css("background", this.value);
	});
	
	$("[data-toggle=tooltip]").tooltip("disable");
	
	$("#bottle-info").on("submit", function(e) {
		e.preventDefault();
		// check validity here
		var bottleName = $("#bottle-text").val();
		var lastClickTime = 0;
		
		if (size >= MAX_BOTTLE_NUM) {
			silenceMode || alert(ERR_BOTTLE_NUMBER_EXCEED.replace("#1", MAX_BOTTLE_NUM));
			return;
		} else if (bottles[bottleName] !== undefined) {
			silenceMode || alert(ERR_BOTTLE_EXISTS.replace("#1", bottleName));
			return;
		} else if (bottleName == "") {
			silenceMode || alert(ERR_BOTTLE_NAME_EMPTY);
			return;
		}
		
		var newBottle = f.New('bottle', $(this).serializeArray());
		var bottleEntity = newBottle.find(".bottle");
		bottleEntity.data("currentIntervalHandler", null);
		bottleEntity.on("mousedown touchstart", function(e) {
			e.preventDefault();
			var bottle = $(this).parent().parent()
			var time = Date.now();
			if (time - lastClickTime > DBLCLICK_THRESHOLD) {
				var lastIntervalHandler = $(this).data("currentIntervalHandler");
				if (lastIntervalHandler !== null) clearInterval(lastIntervalHandler);
				$(this).data("currentIntervalHandler", setInterval(function(sel) {
					var bottle = sel.data("bottle");
					if (bottle.val() < 100) {
						bottle.val(bottle.val() + 1);
					}
				}, 20, $(this)));
				lastClickTime = time;
			} else {
				$(this).data("bottle").val(0);
				lastClickTime = 0;
			}
		});
		bottleEntity.on("mouseup touchend", function() {
			var handler = $(this).data("currentIntervalHandler");
			if (handler !== null) clearTimeout(handler);
			$(this).data("currentIntervalHandler", null);
		});
		$("#bottle-container").append(newBottle);
		
		newBottle.data("color-index", $("[name=bottle-color]:checked").index("[name=bottle-color]"));
		bottles[bottleName] = newBottle;
		size++;
	}).one("submit", function() {
		$(".tip-after-add").show().alert();
	});
	
	var queryString = location.search;
	if (queryString.length) {
		silenceMode = true;
		var bottleList = queryString.substring(1).split("&");
		var lastSubmitted = true;
		for (var i = 0; i < bottleList.length; i++) {
			var equalSign = bottleList[i].indexOf("=");
			if (equalSign !== -1) {
				var name = bottleList[i].substring(0, equalSign), value = decodeURIComponent(bottleList[i].substring(equalSign + 1));
				switch (name) {
				case "n":
					lastSubmitted || $("#bottle-info").submit().get(0).reset();
					lastSubmitted = false;
					$("#bottle-text").val(value.substring(0, 10));
					break;
				case "i":
					$("[name=bottle-color]").eq(parseInt(value)).click();
					break;
				}
			}
		}
		lastSubmitted || $("#bottle-info").submit().get(0).reset();
		silenceMode = false;
	}
	
	$("#generate-templink").on("click", function() {
		var url = location.protocol + "//" + location.host + location.pathname;
		var qsArray = [];
		for (var name in bottles) {
			qsArray.push("n=" + encodeURIComponent(name) + "&i=" + bottles[name].data("color-index"));
		}
		$("#template-link").val(url + "?" + qsArray.join("&"));
		$("#copy-link").prop("disabled", false);
	});
	
	$("#copy-link").on("click", function() {
		var elem = $("#template-link");
		elem.prop("disabled", false);
		elem.get(0).focus();
		elem.get(0).setSelectionRange(0, elem.val().length);
		document.execCommand("copy") && ($(this).tooltip(), elem.get(0).setSelectionRange(0, 0));
		elem.prop("disabled", true);
	});
});