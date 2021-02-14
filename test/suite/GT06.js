const net = require('net');
const path = require('path');
const assert = require('assert');
const Elyez = require('@elyez/gateway');
const Concox = require(__root);

const PORT = 8889;

describe('GT06', () => {
    const app = Elyez();
    app
    .set('parser', Concox.GT06)
    .set('encoding', 'hex')
    .listen(PORT);
    
    const client = new net.Socket();
    
    it(`should be able to establish connection to server`, done => {
      client.connect(PORT, '127.0.0.1', done);
      client.on('error', done);
    });

    it(`should have socket.name as id after login data`, done => {
      const str = new Buffer('78780d010358899058141774000076b10d0a', app.options.encoding);
      client.write(str);
      
      //fake network delay and app data changes
      setTimeout(function(){
          assert.ok(app.socket.name);
          done();
      }, 20);
    });
    
    it(`should have id and longitude, latitude data`, done => {
      const str = new Buffer('78781f12100906120d08cb002bf2e80c2d3ed00cd07301fe0a475500c49c02866b110d0a', app.options.encoding);
      client.write(str);

      //fake network delay and app data changes
      setTimeout(function(){
          assert.ok(app.socket.name);
          assert.ok(app.data.id);
          assert.equal(app.socket.name, app.data.id);
          assert.ok(app.data.latitude);
          assert.ok(app.data.longitude);
          done();
      }, 20);
    });
    
    it(`should able to process bulk sent`, done => {
      const str = new Buffer('78781f12100906120d08cb002bf2e80c2d3ed00cd07301fe0a475500c49c02866b110d0a78781f12100906120d12cb002bf43b0c2d42a01dd06701fe0a475500c49c028754130d0a', app.options.encoding);
      client.write(str);

      //fake network delay and app data changes
      setTimeout(function(){
          assert.ok(app.data.id);
          done();
      }, 20);
    });
    
    it(`should have other infos at long data`, done => {
      const str = new Buffer('787825160B0B0F0E241DCF027AC8870C4657E60014020901CC00287D001F726506040101003656A40D0A', app.options.encoding);
      client.write(str);

      //fake network delay and app data changes
      setTimeout(function() {
          assert.ok(app.data.id);
          assert.ok(app.data.others.signal);
          assert.ok(app.data.others.signal > 0);
          done();
      }, 20);
    });
    
    it(`should close server & client connection`, done => {
      client.destroy();
      app.close(done);
    });
});