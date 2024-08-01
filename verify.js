const bcrypt = require('bcryptjs');

const userEnteredPassword = 'admin123';
const storedHashedPassword = '$2a$10$8.AEs.4RM66iTNgD0O/28uAaYyUjPRDtIm4hxHKiPFweuBBmlhgQ2';

bcrypt.compare(userEnteredPassword, storedHashedPassword, (err, result) => {
    if (err) throw err;
    if (result) {
        console.log('Password is correct');
    } else {
        console.log('Password is incorrect');
    }
});
