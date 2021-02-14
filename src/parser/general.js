/*
 * Example general data (ASCII)
 *   tx,IMEI,yymmddHHMMSS,Longitude,Latitude,Altitude,Satellite,Speed,Heading,Mileage,I/O
 *   $$,123456789086425,170131163459,101.12345,-6.09876,0,12,45,216,11321.56,24C9
 * bulk data have ';' in the end of each
 *   $$,123456789086425,170131163459,101.12345,-6.09876,0,12,45,216,11321.56,24C9;$$,123456789086425,170131163511,101.12345,-6.09876,0,12,33,221,11324.01,24C9
 */
const parse = (data, callback) => {
  const [tx,imei,gpstime,lng,lat,alt,sat,speed,heading,mileage,io] = data.split(',');

  let gps = {
      id        : imei,
      gpstime   : '',
      longitude : parseFloat(lng),
      latitude  : parseFloat(lat),
      altitude  : parseInt(lat),
      satellite : parseInt(sat),
      speed     : parseInt(speed),
      heading   : parseInt(heading),
      mileage   : parseFloat(mileage),
      event     : 0,
      input     : '00000000',
      output    : '00000000',
      location  : '',
      received  : new Date().toISOString(),
      others    : {}
  };

  const [yy, mm, dd, hh, ii, ss] = gpstime.match(/.{1,2}/g);
  // set static timezone based on device tz
  // better to process it with middleware getting from database
  const timezone = 'Z';  //'+0700';
  gps.gpstime = `20${yy}-${mm}-${dd}T${hh}:${ii}:${ss}.000${timezone}`;

  const hex2bin = function(hex){
    const filler = '00000000';
    let str = parseInt("0x"+hex, 16).toString(2);

    return filler.substr(0, 8 - str.length) + str;
  };

  gps.input = hex2bin( io.substr(0,2) );
  gps.output = hex2bin( io.substr(2,2) );

  return gps;
}

module.exports = (socket, data, next) => {
  const buf = data.raw.toString();
  buf.split(';').map(raw => {
    let parseData = parse(raw);
    data = Object.assign({raw: data.raw}, parseData);

    next();
  });
};