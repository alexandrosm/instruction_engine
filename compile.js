var PEG = require("pegjs");
var fs = require('fs');

function flatten(a) {
	if (a instanceof Array) {
		var result = "";
		for (var i=0; i < a.length; i++) {
			result += flatten(a[i]);
		}
		return result;
	} else {
		return "" + a;
	}
}

function compile(path, filename){
	fs.readFile("instr.pegjs", function (err, data) {
		if (err) {
			throw err;
		}

		var parser = PEG.buildParser(data.toString());
		fs.readFile(path + '/' + filename + '.instr', function (err, data) {
			if (err) {
				throw err;
			}

			console.log(flatten(parser.parse(data.toString(), {trace:true, filename:filename})));
		});
	});
}

compile("instructions", "Device")
