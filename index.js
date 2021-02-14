// exports.GT06  = require('./lib/GT06');
// exports.GT06N = require('./lib/GT06');
// exports.GT02  = require('./lib/GT02');


const Elyez = require('./lib/Elyez');
const Parser = require('./src/parser/general');
const echo = require('./src/middleware/echo');
const PORT = process.env.PORT || 8080;
const GT06 = require('./lib/GT06');


// TCP Mode (default)
const app = Elyez();

app.on('connect', client => {
  console.log(client, 'CONNECTED');
});
app.on('disconnect', client => {
  console.log(client, 'DISCONNECTED');
});
app.on('error', err => {
  console.error('Error:', err.message);
});

app.set('encoding', 'hex').set('parser',GT06).use(echo())
.service(function(data, done) {
  console.log(data);
  done();
})
.listen(PORT, function() {
  console.log('ق� %s %s', `[${app.options.mode || 'TCP'}:${app.port}]`, 'GeneralGPS' );
});