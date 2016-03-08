'use strict';
const scriptRunner = require('./script-runner.js');

export class NetworkInterface {
	constructor (interfacesFilePath) {
		this.interfacesFilePath = interfacesFilePath;
	}

	currentConfig () {

	}

	setConfig (interfaceName, settings) {
		scriptRunner.read().then((currentConfig) => {

		});
	}
}