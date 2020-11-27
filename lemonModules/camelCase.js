//Made by Zachary Mitchell in 2020!
//Remove spaces from a sentence and mash all words into a single monstrosity
function camelCase(argLst){
    var result = '';
    if(typeof argLst == 'string'){
        argLst = argLst.split(' ');
    }

    for(var i = 0;i< argLst.length;i++)
        result+=argLst[i][0]['to'+(i == 0?'Lower':'Upper')+'Case']() + argLst[i].substring(1);
    
    return result;
}

if(typeof module == 'object' && module.exports) module.exports = camelCase;