const { path } = require('../config/index')
const authStateRoute = (app) => {
    app.get('/authenticated', (req, res) => {
        // res.sendFile('/authenticated.html');
        res.sendFile(path.join(__dirname, '..', 'src', 'authenticated.html'));
    })
};

module.exports = { authStateRoute };