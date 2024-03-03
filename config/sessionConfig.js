
const { session } = require('../middleware/index');
const sessionConfig = (app, secretKey) => {
    app.use(session({
        secret: secretKey,
        resave: false,
        saveUninitialized: true,
        cookie: { secure: false }
    }))
};

module.exports = { sessionConfig }