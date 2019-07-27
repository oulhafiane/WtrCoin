const { InvalidTransaction } = require('sawtooth-sdk').exceptions;
const cbor = require('cbor');

class WtrOfferPayload {
    constructor (action, offer, type = null) {
        this.action = action;
        this.offer = offer;
        this.type = type;
    }

    static fromBytes (payload) {
        payload = cbor.decodeFirstSync(payload);
        switch (payload.action) {
            case 'createOffer':
                if (!payload.offer || !payload.type)
                    throw new InvalidTransaction('Payload incorrect.');
                return new WtrOfferPayload(
                    payload.action,
                    payload.offer,
                    payload.type
                );
            case 'leave':
            case 'bid':
                if (!payload.offer)
                    throw new InvalidTransaction('Payload incorrect.');
                return new WtrOfferPayload(
                    payload.action,
                    payload.offer
                );
            default:
                throw new InvalidTransaction("Action not recognized.");
        }
    }
}

module.exports = {
    WtrOfferPayload
}