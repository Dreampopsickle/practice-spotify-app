const { path } = require('../config/index')
const serveLoginPage = (app) => {
    app.get('/', (req, res) => {
        res.sendFile(path.join(__dirname, '..', 'src', 'login.html'));
    })
};

module.exports = { serveLoginPage };