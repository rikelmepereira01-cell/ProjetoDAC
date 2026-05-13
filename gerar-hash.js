const bcrypt = require('bcrypt');
bcrypt.hash('admin123', 10).then(hash => {
  console.log('Cole esse hash no SQL abaixo:');
  console.log(hash);
});