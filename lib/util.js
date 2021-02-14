"use strict";

function fixDateTime(str) {
   let dt = str + "";
   if (parseInt(str) < 10) dt = "0" + parseInt(str);

   return dt;
}

var util = {};

util.int2str = function(num){
  return (parseInt(num) < 10 && parseInt(num) > -10 ? '0' : '') + num;
};

util.hex2int = function(hex){
  return parseInt("0x"+hex, 16);
};

util.hex2bin = function(hex){
  const filler = '00000000';
  let str = parseInt("0x"+hex, 16).toString(2);

  return filler.substr(0, 8 - str.length) + str;
};
util.decimalToHexString = function(number) {
    if (number < 0) {
        number = 0xFFFFFFFF + number + 1;
    }
    return number.toString(16).toUpperCase();
};
util.ConvertDMSToDD = function (degrees, minutes,direction) {
    var dd = degrees + minutes/60 ;

    if (direction == "S" || direction == "W") {
        dd = dd * -1;
    } // Don't do anything for N or E
    return dd;
};
util.toTime = function(y,m,d,h,i,s,format){
  var yy = format == 'hex' ? util.hex2int(y) : y;
  if (yy.toString().length == 2) yy = '20' + fixDateTime(yy);

  var mm = fixDateTime(format == 'hex' ? util.hex2int(m) : m);
  var dd = fixDateTime(format == 'hex' ? util.hex2int(d) : d);
  var hh = fixDateTime(format == 'hex' ? util.hex2int(h) : h);
  var ii = fixDateTime(format == 'hex' ? util.hex2int(i) : i);
  var ss = fixDateTime(format == 'hex' ? util.hex2int(s) : s);

  return `${yy}-${mm}-${dd} ${hh}:${ii}:${ss}`;
};

module.exports = util;