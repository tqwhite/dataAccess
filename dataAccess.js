'use strict';
var qtools = require('qtools'),
	qtools = new qtools(module),
	events = require('events'),
	util = require('util'),
	fs = require("fs");

//START OF moduleFunction() ============================================================

var moduleFunction = function(args) {
	events.EventEmitter.call(this);

	qtools.validateProperties({
		subject: args,
		targetScope: this, //will add listed items to targetScope
		propList: [
			{
				name: 'callback',
				optional: false
			},
			{
				name: 'clientProfile',
				optional: false
			},
			{
				name: 'schemaName',
				optional: false
			}
		]
	});

	var self = this,
		forceEvent = function(eventName, outData) {
			this.emit(eventName, {
				eventName: eventName,
				data: outData
			});
		}

 
		//PRIVATE FUNCTIONS ====================================

	var getFilename=function(){
		return self.clientProfile.dataSource.schemaSourceNameMapping[self.schemaName];
	}

		//METHODS AND PROPERTIES ====================================

	this.forceEvent = forceEvent;

	//INITIALIZATION ====================================

	this.args = args;
	
		var dataSource = {
		textToJson: require('textToJson'), //this doesn't get used until passed to the commandLIneResponder
		dictionary: require('dictionary')
	};


	var definitionFilePath=__dirname+"/../../dataDefinitions/" + self.clientProfile.dataSource.definitionName + ".js";
	dataSource.dictionary = new dataSource.dictionary({
		//		dataDefinition: require("./dataDefinitions/" + dictionaryName + ".js"),
		dataDefinition: require(definitionFilePath),
		target: 'expressbook'
	});

	
	if (true || self.clientProfile.dataSource.type == 'file') {
		var fileName = self.clientProfile.dataSource.location + getFilename() + '.' + self.clientProfile.dataSource.fileExtension;
	} else {
		qtools.message("we don't do databases yet");
	}
	
	var sourceData = new dataSource.textToJson(fileName, dataSource.dictionary.get(this.schemaName))

	
	sourceData.on('textToJson.noSuchFile', function(){
		args.callback({error:'textToJson.noSuchFile'}, '', {
			clientProfile:self.clientProfile,
			definitionFilePath:fs.realpathSync(definitionFilePath),
			fileName:fileName
			});
	});
	
	sourceData.on('textToJson.gotData', function() {
		sourceData.mapFieldNames();
		sourceData.processLines();
		sourceData.convert();
		sourceData.assemble();

		args.callback('', sourceData.finishedObject, {
			clientProfile:self.clientProfile,
			definitionFilePath:fs.realpathSync(definitionFilePath),
			fileName:fs.realpathSync(fileName)
			});
	});
	
	sourceData.execute();
 
	return this;
};

//END OF moduleFunction() ============================================================

util.inherits(moduleFunction, events.EventEmitter);
module.exports = moduleFunction;