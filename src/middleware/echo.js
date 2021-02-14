module.exports = options => {
  //process local options
  //suits for database well
  return function(socket, data, next) {
      socket.write(data.raw);
      next();
  };
};