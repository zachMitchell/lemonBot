//Made by Zachary Mitchell in 2020!
//cOnVeRt TeXt tO lOoK LiKe ThIs

function creepyCase(str){
    var result = "";
    var caseChange = false;
    var upLow = ['Upper','Lower'];
    for(var i = 0; i < str.length;i++){
        result += str[i]['to'+upLow[caseChange*1]+'Case']();
        caseChange = !caseChange;
    }

    return result;
}

if(typeof module == 'object' && module.exports) module.exports = creepyCase;