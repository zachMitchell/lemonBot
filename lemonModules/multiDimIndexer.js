//Made by Zachary Mitchell in 2020!
/*This is to solve a randomness bias with multi-dimensional arrays.
In a nutshell, turn a multi-dimensional array into a single dimension, without touching the original contents. It should do some basic subtraction to find the correct index given the first dimension*/


//Accepts two-dimensional arrays or an object with all keys pointing to an array
function multiDimIndexer(obj){
    this.obj = obj;
    /*This array will hold more with the following structure:
    0 - key - the key from the array/object (0,1,2 or "a","b","c")
    1 - length - the size of the array from that key
    Pointing to this array is not recommended because it will be re-referenced later if you decide to run this.rebuild*/
    this.keyMap,
    this.length;
    
    //Creates the internal structure
    this.rebuild = function(){
        this.keyMap = [],
        this.length = 0;
        for(var i in this.obj){
            this.keyMap.push([i,this.obj[i].length]);
            this.length+=this.obj[i].length;
        }
    }

    //Returns the key it found plus the value in array format
    this.get = function(index){
        var result = [];

        for(var i of this.keyMap){
            //We subtract everytime the index is greater than the length in order to get a possible value
            if(index > i[1]-1)
                index-=i[1];
            else{
                result = [this.obj[i[0]][index],i[0],index];
                break;
            }
        }

        return result;
    }

    this.rebuild();
}

if(typeof module == 'object' && module.exports) module.exports = multiDimIndexer;