
const
    express = require('express'),
    router = express.Router(),
    kkboxsdk = require('@kkbox/kkbox-js-sdk');

router.get('/', async (req, res, next) => {
    try {
        let { str } = req.body;

        let response = await fetch(str);

        if (!req.session.kkbox)
            req.session.kkbox = {};

        req.session.kkbox.prevResp = response;

        res.sendStatus(200).send(response.data);
    }
    catch (err) {
        next(err);
    }
});

router.get('/nextpage', async (req, res, next) => {
    try {
        if (req.session.kkbox.prevResp) {
            let response = await fetchNext(req.session.kkbox.prevResp);
            req.session.kkbox.prevResp = response;

            res.sendStatus(200).send(response.data);
        }
        else {
            res.sendStatus(500);
        }
    }
    catch (err) {
        next(err);
    }
});

router.initapi = async (options) => {
    try {
        let auth = new kkboxsdk.Auth(options.client_id, options.client_secret);

        let response = await auth.clientCredentialsFlow.fetchAccessToken();
        let api = new kkboxsdk.Api(response.data.access_token);

        let kkbox = {
            Api: api,
            access_token: response.data.access_token,
        };

        global.kkbox = kkbox;
    }
    catch (err) {
        throw err;
    }
};

module.exports = router;

const
    fetch = async (queryStr) => {
        let response = await global.kkbox.Api.searchFetcher.setSearchCriteria(queryStr, 'track').fetchSearchResult();
        return response;
    },
    fetchNext = async (resp) => {
        let response = await global.kkbox.Api.searchFetcher.fetchNextPage(resp);
        return response;
    };