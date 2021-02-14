const path = require('path');

global.__root = path.join(__dirname, '../');

describe('Concox', () => {
  // Concox GT02
  require('./suite/GT02');
  
  // Concox GT06
  require('./suite/GT06');
});