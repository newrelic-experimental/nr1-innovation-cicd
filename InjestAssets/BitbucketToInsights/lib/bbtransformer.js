var eventType = 'BitbucketEvent';
var flatten = require('flat');
var PRWhitelistFields = require('../lib/fieldWhitelist');

module.exports = {
    bbCloud: (eventKey, gitBody) => {
        return {
            eventType: eventType,
            eventName: eventKey,
            actor: gitBody.repository.name,
            repository: gitBody.repository.name,
            commit: (gitBody.commit && gitBody.commit.hash) || null,
        };
    },

    bbServer: (eventKey, gitBody) => {
        var gitBodyFlat = flatten(gitBody);

        for (let field in gitBodyFlat) {
            if ((PRWhitelistFields.indexOf(field) === -1)) {
                delete gitBodyFlat[field];
            }

        }
        gitBodyFlat['eventType'] = eventType;
        gitBodyFlat['eventName'] =eventKey;

        return gitBodyFlat;
    }
};
