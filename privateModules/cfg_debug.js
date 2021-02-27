/*This file is dedicated for commands that *should not* go to production(!).
When your done testing with these, **comment out respective items in modules.exports**

If you don't... let's just say if it goes to the public PR wE wIlL fInD yOu >:]*/

//Custom imports
var moduleList = [];

//Your list loads here:
var privateModules = {};

for(var i of moduleList)
    privateModules[i] = require('./moduleFolder/'+i+'.js');

delete moduleList;

//Argument hanlding
var commands = {};

//HEY YOU! did you read the first comment in the file?
module.exports = {
    commands:commands,
}
//Hey... bub... read line 1 or ALL IS LOST D: