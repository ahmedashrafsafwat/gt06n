const util = require('./util')
    , crc16 = require('crc16-itu')

const parse = (socket, data, callback) => {
  let gps = {
      gpstime   : util.toTime(data.substr(8,2), data.substr(10,2), data.substr(12,2), data.substr(14,2), data.substr(16,2), data.substr(18,2), 'hex'),
      satellite : util.hex2int(data.substr(21,1)),
      longitude : parseFloat(util.hex2int(data.substr(30,8)) / 1800000),
      latitude  : parseFloat(util.hex2int(data.substr(22,8)) / 1800000),
      altitude  : 0,
      speed     : util.hex2int(data.substr(38,2)),
      heading   : 0,
      mileage   : 0,
      event     : 0,
      input     : '00000000',
      output    : '00000000',
      location  : '',
      received  : new Date().toISOString(),
      others    : {}
  };

  let binary = util.hex2bin(data.substr(40,2)) + util.hex2bin(data.substr(42,2));

  if (parseInt(binary.substr(4,1)) == 1) gps.longitude *= -1;
  if (parseInt(binary.substr(5,1)) == 0) gps.latitude *= -1;

  gps.heading = parseInt( binary.substr(6,10), 2);

  gps.others.gsm = {
      mcc: parseInt("0x"+data.substr(44,4)),
      mnc: parseInt("0x"+data.substr(48,2)),
      lac: parseInt("0x"+data.substr(50,4)),
      cid: parseInt("0x"+data.substr(54,6))
  }

  const statusInfo = socket.statusInfo;
  if (statusInfo) {
    gps.input = statusInfo.input;
    gps.others.signal = statusInfo.signal;
    gps.others.batt = statusInfo.batt;
  }

  if (data.length > 75) {
    const statusInfo = util.hex2bin(data.substr(62,2));
    gps.input = '0' + statusInfo.substr(5,1) + statusInfo.substr(6,1) + '0';

    if (statusInfo.substr(2,3) === '100') gps.event = -65;
    else if (statusInfo.substr(2,3) === '011') gps.event =  17;
    else if (statusInfo.substr(2,3) === '010')  gps.event = -23;
    else if (statusInfo.substr(2,3) === '001')  gps.event =  30;

    const voltage = util.hex2int(data.substr(64,2));
    gps.others.batt = parseInt(voltage * 100/6) + '%';
    gps.others.signal = 3 * util.hex2int("0"+data.substr(67,1));

    const alarm = util.hex2int(data.substr(68,2));

    if (alarm === 0) {}
    else if (alarm === 1) gps.event = 65;
    else if (alarm === 2)  gps.event = 23;
    else if (alarm === 3)  gps.event =  30;
    else if (alarm === 14) gps.event =  17;
    else if (alarm === 20) gps.event = 102;
  }

  return gps;
}

const update = (socket, data) => {
  const statusInfo = util.hex2bin( data.substr(8,2) );
  const voltage = util.hex2int(data.substr(10,2));

  const current = {
    input: '0' + statusInfo.substr(5,2) + '00000',
    ignition: (statusInfo.substr(6,1) || '0') == '1',
    batt: parseInt(voltage * 100/6) + '%',
    signal: 3 * util.hex2int("0"+data.substr(13,1))
  }

  socket.statusInfo = current;
}

module.exports = (socket, data, next) => {
  const buf = data.raw.toString('hex');

  const cmdSplit = buf.split('7878').slice(1);

  cmdSplit.map( buf => {
      buf = '7878' + buf;
      let cmd = buf.substr(6,2);

      let serialNo;

      /***** LOGIN PACKET *****/
      if (cmd == '01') {
          socket.name = buf.substr(9,15);
          serialNo = buf.substr(-12, 4);
      }
      /***** HEARTBEAT *****/
      else if (cmd == '13') {
          update(socket, buf);
          serialNo = buf.substr(-12,4);
      }
      /***** LOCATION PACKET *****/
      else if (cmd == '12') {
          data.id = socket.name;
          var parseData = parse(socket, buf);
          data = Object.assign(data, parseData);
          next();
      }
      /***** ALARM PACKET *****/
      else if (cmd == '16') {
          data.id = socket.name;
          var parseData = parse(socket, buf);
          data = Object.assign(data, parseData);
          serialNo = buf.substr(-12, 4);
          next();
      }

      if (serialNo) {
        const content = `05${cmd}${serialNo}`;
        const crcCheck = crc16(content, 'hex').toString(16);
        let str = new Buffer(`7878${content}${'0000'.substr(0, 4 - crcCheck.length) + crcCheck}0D0A`, 'hex');
        socket.write(str);
      }
  });
};