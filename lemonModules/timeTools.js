//Made by Zachary Mitchell in 2020!
//Tools to help bots tell time; this includes rendering a time based on a number in seconds, creating a timeface, among other items.

function secondsToTime(seconds = 0){
    //Numbers that were originally the inserted seconds
    var results = {hrs:0,mins:0,seconds:0};
    //These are the values for hours and minutes converted to seconds.
    const hv = 3600, mv = 60;
    //Accumulate numbers:
    //hours
    while(seconds >= hv){
        results.hrs += 1;
        seconds -= hv;
    }

    while(seconds >= mv){
        results.mins += 1;
        seconds -= mv;
    }

    results.seconds = seconds;
    return results;
}

//Create a phrase based on a time object
function timeToEnglish(timeObj){
    var result = '';
    for(var i in timeObj)
        if(timeObj[i]) result+=(result.length?', ':'')+timeObj[i]+' '+i;

    return result;
}

//Convert a timestamp to an object holding hours minutes and seconds
function timestampToObj(str = '0:0:0'){
    var results = {},
        timestamp = str.split(':').slice(0,3);
    var indexes = ['hrs','mins','seconds'].slice(3-timestamp.length,3);

    timestamp.forEach((e,f)=>results[indexes[f]] = e*1 || 0);

    return results;
}

//Find time stamps inside a string
function findTimestamps(input=''){
    var results = [];
    var target = input;

    //We can accept both array and string here
    if(!Array.isArray(input) && typeof input == 'string')
        target = target.split(' ');
    
    for(var i of target){
        var valid = true;
        if(i.indexOf(':') > -1){
            //split everything up to confirm everything has numbers.
            for(var j of i.split(':')){
                if(isNaN(j)){
                    valid = false;
                    break;
                }
            }
        }
        else valid = false;

        if(valid) results.push(i);
    }

    return results;
}

//Take a string or array to make time stamps
var strToTimeObjs = str=>findTimestamps(str).map(e=>timestampToObj(e));

//Go full circle and turn a time object back into seconds
var timeToSeconds = timeObj=>((timeObj.hrs || 0) * 3600) + ((timeObj.mins || 0) * 60) + (timeObj.seconds || 0);

if(typeof module == 'object' && typeof module.exports == 'object')
    module.exports = {
        secondsToTime:secondsToTime,
        timeToEnglish:timeToEnglish,
        timestampToObj:timestampToObj,
        findTimestamps:findTimestamps,
        strToTimeObjs:strToTimeObjs,
        timeToSeconds:timeToSeconds
    }