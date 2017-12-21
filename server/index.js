const
    express = require('express'),
    bodyParser = require('body-parser'),
    session = require('express-session'),
    app = express(),
    http = require('http'),
    server = http.createServer(app),
    MODE = process.env.NODE_ENV,
    config = (MODE === 'production' ? require('./config/config') : require('./config/config.dev')),
    mkdirp = require('mkdirp');

global.config = config;

const
    api = {
        songs: require('./api/songs'),
    },
    cookieSecret = require('./config/credential').cookieSecret,
    SessionExpired = config.sessionTimout,
    port = config.port,
    kkboxOption = config.kkbox_sdk;

mkdirp.sync(__dirname + '/logs');

server.listen(port, async () => {
    console.log(`listening ${port}`);
    try {
        await api.songs.initapi(kkboxOption);
    }
    catch (err) {
        console.error(err);
    }
});

// 根據 config 檔決定是否要使用 redis session
let sessionOption = {
    secret: cookieSecret,
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: SessionExpired * 60 * 60 * 1000 },
};

app.use(session(sessionOption));

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: true }));
// parse application/json
app.use(bodyParser.json());
// root routers
app.use('/kkboxapi', api.songs);

// 處理 caughted error & 發送 res
app.use((err, req, res, next) => {
    console.error(err);
    if (!res.headersSent) {
        res.sendStatus(500);
    }
});