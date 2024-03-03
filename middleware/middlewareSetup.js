const { express, path } = require('../config/index')
const { cors, cookieParser } = require('../middleware/index');
const setupMiddleWare = (app) => {
    app.use(express.static(path.join(__dirname, 'src')))
    .use(cors())
    .use(cookieParser())
};

module.exports = { setupMiddleWare };