'use strict';

const exec = require('child_process').exec;
const path     = require('path');
const fs       = require('fs');

const READ_SCRIPT_PATH  = path.join(__dirname, './awk/readInterfaces.awk');
const WRITE_SCRIPT_PATH = path.join(__dirname, './awk/changeInterface.awk');
const DEFAULT_INTERFACE = 'eth0';
const DEFAULT_INTERFACE_FILE_LOCATION = '/etc/network/interfaces';
const ADDRESS_RETURN_ORDER = ['address', 'netmask', 'gateway'];

const convertArgs = function convertArgs (forScript, interfacesFilePath, args) {
  const converted = [interfacesFilePath];

  if (forScript === READ_SCRIPT_PATH) {
    converted.push(`device=${args.device}`);
  } else {
    converted.push(`dev=${args.device}`);
  }
  delete args.device;

  for (let key in args) {
    converted.push(`${key}=${args[key]}`);
  }

  return converted.join(' ');
}

const formatResult = function formatResult (textResult) {
  const rawResult  = textResult.trim().split(' ');
  const formattedResult = {};

  if (rawResult.length === 1 && (rawResult[0] === 'dhcp' || rawResult[0] === 'manual')) {
    formattedResult.mode = rawResult[0];
  } else {
    for (let i = 0; i < rawResult.length; i++) {
      formattedResult[ADDRESS_RETURN_ORDER[i]] = rawResult[i];
    }
  }
  return formattedResult;
}

const runScript = function runScript (scriptName, args) {
	return new Promise((resolve, reject) => {
		const child = exec(`awk -f ${scriptName} ${args}`, (error, stdout, stderr) => {
		  if (error) {
		    reject(error);
		  }
      resolve(stdout);
		});
	});
};

const read = function read (interfacesFilePath, interfaceName) {
  interfacesFilePath = interfacesFilePath || DEFAULT_INTERFACE_FILE_LOCATION;
  interfaceName = interfaceName || DEFAULT_INTERFACE;

  return new Promise((resolve, reject) => {
    runScript(READ_SCRIPT_PATH, [interfacesFilePath, `device=${interfaceName}`].join(' '))
      .then((success) => {
         resolve(formatResult(success));
      }).catch((error) => {
        reject(error);
      })
  });
  
};

const write = function write (interfacesFilePath, interfaceName, args) {
  interfacesFilePath = interfacesFilePath || DEFAULT_INTERFACE_FILE_LOCATION;
  interfaceName = interfaceName || DEFAULT_INTERFACE;

  return new Promise ((resolve, reject) => {
    args.device = interfaceName;
    runScript(WRITE_SCRIPT_PATH, convertArgs(WRITE_SCRIPT_PATH, interfacesFilePath, args))
      .then((newText) => {
        fs.writeFile(interfacesFilePath, newText, (fileWriteError) => {
          if (fileWriteError) {
            console.log(`File write error: ${fileWriteError}`);
            reject(fileWriteError);
          } else {
            read(interfacesFilePath, interfaceName).then((newValues) => {
              resolve(newValues);
            }).catch((readError) => {
              reject(readError);
            })
          }
        });
      })
      .catch((error) => {
        console.log(`Error running script: ${error}`);
      });
  });
};

module.exports = {
	read,
	write
};