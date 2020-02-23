$(function() {
	var f = {};
	
	// New element with specified tag or new customized component
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
	
	
	// Bottle component
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
	
	// update QR code
	var qrLenLimit = [0,    14,   26,   42,   62,   84,   106,  122,  152,  180, 213,
					  251,  287,  331,  362,  412,  450,  504,  560,  624,  666,
					  711,  779,  857,  911,  997,  1059, 1125, 1190, 1264, 1370,
					  1452, 1538, 1628, 1722, 1809, 1911, 1989, 2099, 2213, 2331];
	var qrCanvas = f.New("canvas");
	
	var qrDotSize = 3, qrMargin = 6, qrBlack = "rgb(0, 0, 0)", qrWhite = "rgb(255, 255, 255)";
	
	function updateQRCode(text) {
		var qrVersion = 0;
		for (qrVersion = 0; qrVersion < qrLenLimit.length && qrLenLimit[qrVersion] < text.length; qrVersion++);
		if (qrVersion >= qrLenLimit.length) return false;
		
		var qrCodec;
		try {
			qrCodec = new QRCode(qrVersion, QRErrorCorrectLevel.M);
			qrCodec.addData(text);
			qrCodec.make();
		} catch (err) {
			return false;
		}
		
		var size = qrCodec.getModuleCount(), qrSize = size * qrDotSize + qrMargin * 2;
		qrCanvas.attr("width", qrSize).attr("height", qrSize);
		var context = qrCanvas.get(0).getContext("2d");
		context.fillStyle = qrWhite;
		context.fillRect(0, 0, qrSize, qrSize);
		for (var i = 0; i < size; i++) {
			for (var j = 0; j < size; j++) {
				context.fillStyle = (qrCodec.isDark(i, j) ? qrBlack : qrWhite);
				context.fillRect(qrMargin + qrDotSize * i, qrMargin + qrDotSize * j, qrDotSize, qrDotSize);
			}
		}
		
		$("#qrcode").css({"width": qrSize, "height": qrSize, "background": "url(" + qrCanvas.get(0).toDataURL("image/png") + ")"});
		return true;
	}
	
	
	// main logic
	var bottles = {}, size = 0;
	var MAX_BOTTLE_NUM = 100;
	var ERR_BOTTLE_NUMBER_EXCEED = "您真有耐心，不过这里最多只能放 #1 个瓶子……";
	var ERR_BOTTLE_EXISTS = '换个名字吧，瓶子 "#1" 已经有了~';
	var ERR_BOTTLE_NAME_EMPTY = "给瓶子起个名字呗 :)"
	var ERR_QRCODE_GENERATION_FAIL = "分享二维码生成失败……"
	var DBLCLICK_THRESHOLD = 300;
	
	var silenceMode = false;
	
	
	// change "color selection" controls' background
	$("[name=bottle-color]").each(function() {
		$(this).parent().css("background", this.value);
	});
	
	// "Copy" button and "Copied" tooltip
	$("[data-toggle=tooltip]").tooltip("disable");
	
	
	// Add a bottle
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
	
	function updateQRCodeAndPrompt(text) {
		updateQRCode(text) ? $("#qr-region").show() : ($("#qr-region").hide(), alert(ERR_QRCODE_GENERATION_FAIL));
	}
	
	// if it's visited from a generated template link...
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
		lastSubmitted || ($("#bottle-info").submit().get(0).reset(), updateQRCodeAndPrompt(location.href));
		silenceMode = false;
	}
	
	// generate template link
	$("#generate-templink").on("click", function() {
		var url = location.protocol + "//" + location.host + location.pathname;
		var qsArray = [];
		for (var name in bottles) {
			qsArray.push("n=" + encodeURIComponent(name) + "&i=" + bottles[name].data("color-index"));
		}
		var link = url + "?" + qsArray.join("&")
		$("#template-link").val(link);
		$("#copy-link").prop("disabled", false);
		updateQRCodeAndPrompt(link);
	});
	
	// copy template link
	$("#copy-link").on("click", function() {
		var elem = $("#template-link");
		elem.prop("disabled", false);
		elem.get(0).focus();
		elem.get(0).setSelectionRange(0, elem.val().length);
		document.execCommand("copy") && ($(this).tooltip(), elem.get(0).setSelectionRange(0, 0));
		elem.prop("disabled", true);
	});
	
	// complete button
	$("#complete-button").on("click", function() {
		$("#bottle-info").hide();
		if ($("#copy-link").prop("disabled")) {
			updateQRCodeAndPrompt(location.href);
		}
		$.each(bottles, function(name, value) {
			value.find(".bottle").off("mouseup mousedown touchstart touchend");
		});
	});
});