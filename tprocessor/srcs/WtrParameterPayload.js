const { InvalidTransaction } = require('sawtooth-sdk').exceptions;
const cbor = require('cbor');

class WtrParameterPayload {
    constructor (action, name, value) {
        this.action = action;
        this.name = name;
        this.value = value;
    }

    static fromBytes (payload) {
        payload = cbor.decodeFirstSync(payload);
        switch (payload.action) {
            case 'addParameter':
                if (!payload.name || !payload.value)
                    throw new InvalidTransaction('Payload incorrect.');
                if (payload.name.indexOf('|') !== -1)
                    throw new InvalidTransaction("Name cannot contain '|'");
                if (payload.value.indexOf('|') !== -1)
                    throw new InvalidTransaction("Value cannot contain '|'");
                return new WtrParameterPayload(
                    payload.action,
                    payload.name,
                    payload.value
                )
            default:
                throw new InvalidTransaction("Action not recognized.");
        }
    }
}

module.exports = {
    WtrParameterPayload
}