//E
function eMark(str){
    var res = '';
    for(var i of str){
        if( i == 'e' || i == 'E') res+='['+i+']';
        else res+=i;
    }
    return res;
}

if(typeof module == 'object' && module.exports) module.exports = eMark;