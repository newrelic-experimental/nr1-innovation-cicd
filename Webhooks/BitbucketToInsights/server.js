var newrelic = require("newrelic");
var getMetricEmitter = require('@newrelic/native-metrics');
var request = require('request')
var express = require("express");
var bodyParser = require('body-parser');
var app = express();
var port = process.env.PORT || 8080;
var Transformer = require('./lib/bbtransformer.js')

var emitter = getMetricEmitter({timeout: 15000});
emitter.unbind();
emitter.bind(10000);

app.use(bodyParser.json({type: 'application/json'}));
app.use(express.static(__dirname + '/public'));

app.post("/insights/:accountNumber/key/:xinsertkey", (req, res, next) => {
    var accountNumber = req.params.accountNumber;
    var xInsertKey = req.params.xinsertkey;
    var eventKey = req.headers['x-event-key'];

    var insightEvent = (typeof req.body.actor.username === 'undefined')
        ? Transformer.bbServer(eventKey, req.body) : Transformer.bbCloud(eventKey, req.body);

    console.log(JSON.stringify(insightEvent));

    request.post(`https://insights-collector.newrelic.com/v1/accounts/${accountNumber}/events`, {
        headers:
            {
                'X-Insert-Key': xInsertKey
            },
        json: insightEvent
    }, (error, response, body) => {
        if (error) {
            console.error(error);
            return
        }
        res.json(
            {
                statusCode: response.statusCode,
                success: body.success,
            }
        );
    })
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});

require("cf-deployment-tracker-client").track();
