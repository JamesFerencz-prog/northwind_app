function example1(arrayOfInts, n){
  if(!Array.isArray(arrayOfInts)) throw new TypeError("arrayOfInts must be an array");
  if(!Number.isInteger(n) || n<1 || n>arrayOfInts.length) throw new RangeError("n must be between 1 and array length");
  let currmin = arrayOfInts[0];
  for(let i=0;i<n;i++) if(arrayOfInts[i] < currmin) currmin = arrayOfInts[i];
  return currmin;
}
function example2(arrayOfInts){
  if(!Array.isArray(arrayOfInts)) throw new TypeError("arrayOfInts must be an array");
  for(let i=0;i<arrayOfInts.length;i++) console.log(String(arrayOfInts[i]));
}
function example3(arrayOfInts, a=10, b=5){
  if(!Array.isArray(arrayOfInts)) throw new TypeError("arrayOfInts must be an array");
  let found = false;
  for(let i=0;i<arrayOfInts.length;i++){
    if(arrayOfInts[i]===a){ console.log("The value of a was found in int array."); found=true; }
    else if(arrayOfInts[i]===b){ console.log("The value of b was found in int array."); found=true; }
  }
  if(!found) console.log("None of the search values were found.");
}
module.exports = { example1, example2, example3 };
