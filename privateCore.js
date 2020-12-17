//Made by Zachary Mitchell in 2020!
/*I realized the original method for private configs was good, but only if there was only one developer on the team.
This file makes it possible to combine many configs together without being touched. In order for your config file to be read here, it must be inside the privateModules folder and start with "cfg_"*/
const fs = require('fs');

var resultObject = {
    helpDescriptions:[],
    commands:{},
    responses:{},
    cooldowns:{},
}

//These are the original modules sorted out by file name without the cfg_ and .js
var collectedModules = {};

var privateDirectory = fs.opendirSync('./privateModules');
//Look for a file name that starts with cfg_ and ends with .js
for(var currFile; currFile = privateDirectory.readSync();){
    if(currFile.name.indexOf('cfg_') == 0 && currFile.name.indexOf('.js') == currFile.name.length - '.js'.length){
        //Game on!
        var configModule = require('./privateModules/'+currFile.name);
        //fill up the resultObject
        for(var i in resultObject){
            if(configModule[i]){
                //An array configuration
                if(Array.isArray(resultObject[i]))
                    for(var j of configModule[i]) resultObject[i].push(j);
                
                //Object configuration
                else if(typeof resultObject[i] == 'object')
                    for(var j in configModule[i]) resultObject[i][j] = configModule[i][j];
            }
        }

        //Make the file name string to call later
        var configStr = currFile.name.split('cfg_')[1].split('.js')[0];
        collectedModules[configStr] = configModule;
    }
}

//Close the directory - basically stops a warning from printing to the console
privateDirectory.closeSync();

module.exports = {
    resultObject:resultObject,
    collectedModules:collectedModules
}