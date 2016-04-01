var _ = require("lodash");

/*
step template, fully expanded

{
	name: "",
	content: "",
	action: {
		text: "",
		target: ""
	},
	duration: "x minutes",
	extras: [
		{
			type: "info",
			content: "",
			expand: true
		}
	],
	steps: []
}
*/
var Step = function (content, replacements) {
	content = _.defaults(content, {steps:[], extras:[]});
	replacements = replacements || {};

	//this could be evolved into a much more sophisticated validator,
	//including deep structure and data types. For now, it is ok.
	content = _.pick(content,
		["name","content","action","duration","steps", "extras"]
	);

	self = this;
	_.forOwn(content, function(value, key) {
		self[key] = _.clone(value);
	});

	this.steps = this.steps.map(function (e){return new Step(e, replacements)});
};

Step.prototype.addStep = function (step) {
	this.steps.push(new Step(step));
};

Step.prototype.getStep = function(path) {
	var self = this;
	path.split(" > ").map(function (element){
		self = _.find(self.steps, {name: element});
	});

	return self
};

Step.prototype.alterStep = function(name, step) {
	this.steps[_.findIndex(this.steps, {name: name})] = new Step(step);
};

Step.prototype.addExtra = function(extra) {
	this.extras.push(extra)
};

Step.prototype.clone = function(){
	var ret = new Step(this);
	ret.steps = this.steps.map(function (e){return e.clone()})
}

var device = new Step();

device.addStep({
		name: "download",
		content: "Download the pre-configured Resin OS image.",
		action: {
			text: "Download OS",
			target: "{{image.url}}"
		},
		duration: "3 minutes",
		extras: [{
			type: "info",
			content: "The download includes ResinOS Linux [{{OS.base.version}}]({{OS.base.repo}}), the Resin.io Supervisor [{{OS.supervisor.version}}]({{OS.supervisor.repo}}), as well as [configuration file]({{OS.config.url}}) that allows your device to securely authenticate and automatically provision into your application. Read more about the [resin.io provisioning process](provisioning docs link).",
			expand: true
		}]
	}
);

device.addStep({
	name: "burn",
	content: "Burn the Resin OS image to the installation medium or device.",
	duration: "5 minutes"
});

device.addStep({
	name: "initialize",
	steps: [
		{
			name: "insert medium",
			content: "Insert the {{Application.device-type.install-medium}} into the {{Application.device-type.name}}",
			duration: "1-5 minutes"
		},
		{
			name: "ensure connectivity",
			content: "Ensure the device can connect to your preferred network",
			duration: "1-5 minutes",
			extras: [{
				type: "info",
				content: "- If you're using an ethernet cable, plug it into the device and ensure it leads to an internet-connected socket.\n" +
				"- If you're using a wifi or 3g dongle, plug it into the usb port.\n" +
				"- If you're using a device with onboard wifi, there's nothing to do for this step\n",
				expand: false
			}]
		},
		{
			name: "boot",
			content: "Power the device up and perform the appropriate steps for it to provision",
			duration: "1-5 minutes",
			extras: []
		}
	]
});

var removableMediaDevice = new Step(device);

removableMediaDevice.getStep("burn").content = "Burn the Resin OS image to {{Application.deviceType.installMedium}}.";

removableMediaDevice.getStep("burn").addStep({
	name: "writer",
	content: "Download and install [Etcher]({{Etcher.downloadUrl[user.OS]}}). ([see all versions]({{Etcher.downloadListUrl}}). You may also use an image writer of your choice.",
	action: {
		text: "Download Etcher",
		target: "{{Etcher.downloadUrl[user.OS]}}"
	},
	duration: "2 minutes"
});

removableMediaDevice.getStep("burn").addStep({
	name: "selectFile",
	content: "Start the writer and select the file {{OS.imageName}} in your download folder."
});

removableMediaDevice.getStep("burn").addStep({
	name: "write",
	content: "Insert your {{Application.deviceType.installMedium}}, make sure it's selected, and press \"Burn!\".",
	duration: "4 minutes",
	extras: [
		{
			type: "warning",
			content: "This will overwrite your {{Application.deviceType.installMedium}}. Please make sure any important data is backed up",
			expand: true
		}
	]
});

removableMediaDevice.getStep("burn").addStep({
	name: "remove",
	content: "When writing is finished, remove the {{Application.deviceType.installMedium}}",
	action: {
		text: "",
		target: ""
	},
	duration: "x minutes"
});

var externalBootDevice = new Step(removableMediaDevice);

externalBootDevice.getStep("burn > remove").addExtra({
	type: "info",
	content: "You can write {{Application.deviceType.installMedia}} for as many devices as you want, using the same OS image file download.",
	expand: true
});

externalBootDevice.getStep("initialize > boot").content = "Power your device up and hang tight. Your device should appear here in a few seconds.";




//TODO: Add ability for an inheriting instruction set to replace parent text variables with a specific value.
//For instance SDCardDevice should be able to replace {{Application.deviceType.installMedium}} with "SD card".

// for LED devices:

//{
//	type: "troubleshoot",
//		content: "If, upon final boot, the device LED is blinking in groups of four, it is an indication that the device cannot connect to the internet. Please ensure the network adapter is functional. [More troubleshooting tips]().",
//	expand: false
//}