/* global QUnit */
QUnit.config.autostart = false;

sap.ui.getCore().attachInit(function () {
	"use strict";

	sap.ui.require([
		"comeren/address_transfer/test/unit/AllTests"
	], function () {
		QUnit.start();
	});
});
