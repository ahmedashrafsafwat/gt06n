const net = require('net')
    , dgram = require('dgram')
    , EventEmitter = require( "events" ).EventEmitter;

class Elyez extends EventEmitter {
  constructor(options) {
    super();

    this.options = Object.assign({
      encoding: 'UTF8'
    }, options);

    this.init();
  }

  init() {
    this.data = {};
    this.datarr = [];
    this.plugins = [];
    this.services = [];

    //events
    this.on('processing', this.processData);
  }

  /*
   *  Run in TCP mode (TCP Server)
   */
  tcp() {
    const self = this;
    const server = net.createServer(socket => {
      //socket.setTimedone(3e5);
      socket.setEncoding(self.options.encoding);
      socket.setNoDelay(true);

      self.server = server;

      var id = socket.remoteAddress + ':' + socket.remotePort;
      self.emit('connect', socket.name || id, this);

      socket.on('end', () => {
          //console.log('%s: %s - DISCONNECTED ...', Date(Date.now()), socket.name);
          self.emit('disconnect', socket.name, this);
          self.emit('end', socket.name, this);
      });

      socket.on('error', err => {
          self.emit('error', err, this);
      });

      socket.on('data', (data) => {
        self.data = { raw: data };
        self.process(socket, { raw: data });
      });
    });

    return server.listen.apply(server, arguments);
  }

  /*
   *  Run in UDP mode (UDP Server)
   */
  udp() {
    const self = this;
    const server = dgram.createSocket('udp4');

    server.on('message', (data, client) => {

      //socket client
      const socket = dgram.createSocket('udp4');
      socket.write = (buf) => {
          socket.send(buf, 0, buf.length, client.port, client.address);
      }

      self.data = { raw: data };
      self.process(socket, { raw: data });
    });

    self.server = server;

    return server.bind.apply(server, arguments);
  }

  /*
   *  listen
   *  open server connection
   */
  listen() {
    this.port = arguments[0];

    if (!this.options.mode || this.options.mode.toLowerCase() == 'tcp') this.tcp.apply(this, arguments);
    else this.udp.apply(this, arguments);

    this.emit('listening', this);
  }

  /*
   *  close server connection
   */
  close(callback) {
    this.server.close(callback);

    this.emit('end', this);
    this.emit('close', this);
  }

  /*
   *  set option
   */
  set(key, value) {
    this.options[key] = value;

    return this;
  }

  /*
   *  get option
   */
  get(key) {
    if (key) return this.options[key];

    return this.options;
  }

  /*
   *  use
   *  Register middleware function
   */
  use(fn = function(socket, data, next){}) {
    this.plugins.push(fn);

    return this;
  }

  /*
   *  process
   *  Run each middleware process in series
   */
  process(socket, data) {
    const self = this, plugins = this.plugins;
    let idx = 0;

    // all done or throw an error
    const done = (err) => {
      if (err) return self.emit('error', err, this);

      idx = 0;
      if (data) self.processData(data);
      //if (data) self.emit('processing', data, this);

      setTimeout(function(){
        if (self.datarr[0]) next();
      },10);
    }

    const next = err => {
      const fn = plugins[idx];

      if (err || typeof fn != 'function' || idx > plugins.length) {
        return done(err);
      }

      if (idx == 0) {
        if (!self.datarr[0]) return;
        self.data = Object.assign(data, self.datarr[0]);
        self.datarr.splice(0,1);
      }

      idx += 1;

      try {
        fn(socket, data, next);
      } catch (err) {
        next(err);
      }
    }

    const parser = this.get('parser');
    if (!parser || typeof parser != 'function') return;

    let obj = {raw: data.raw};
    parser(socket, obj, () => {
      const tmp = Object.assign({}, obj);
      self.datarr.push(tmp);
      if (idx == 0) next();
    });
  }

  /*
   *  services
   *  Register service function
   */
  service(fn) {
    this.services.push(fn);

    return this;
  }

  /*
   * processData
   * Run each service process in parallel
   */
  processData(data) {
    const self = this, services = this.services || [];

    // throw an error
    const done = (err, callback) => {
      if (err) return self.emit('error', err, this);

      if (typeof callback == 'function') callback();
    }

    services.map(fn => {
      if (data.raw) delete data.raw;

      try {
        fn(data, done);
      } catch (err) {
        done(err);
      }
    });
  }
}

module.exports = opts => {
  return new Elyez(opts);
};