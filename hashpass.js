const bcrypt = require('bcryptjs');

const password = 'admin123';
const saltRounds = 10; // 盐值轮次，可以根据需要调整

bcrypt.genSalt(saltRounds, (err, salt) => {
    if (err) throw err;
    bcrypt.hash(password, salt, (err, hash) => {
        if (err) throw err;
        console.log('Hashed password:', hash);
    });
});
