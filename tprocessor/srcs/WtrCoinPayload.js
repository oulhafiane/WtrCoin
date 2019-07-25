const { InvalidTransaction } = require('sawtooth-sdk').exceptions;
const cbor = require('cbor');

class WtrCoinPayload {
    constructor (action, user, coins) {
        this.action = action;
        this.user = user;
        this.coins = coints;
    }

    static fromBytes (payload) {
        payload = cbor.decodeFirstSync(payload);
        switch (payload.action) {
            case 'mint':
                if (null === payload.coins || null === payload.user)
                    throw new InvalidTransaction('Payload incorrect.');
                return new WtrCoinPayload(
                    payload.action,
                    payload.user,
                    payload.coins
                )
            default:
                throw new InvalidTransaction("Action not recognized.");
        }
    }
}

module.exports = {
    WtrCoinPayload
}