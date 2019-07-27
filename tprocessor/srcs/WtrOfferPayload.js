const { InvalidTransaction } = require('sawtooth-sdk').exceptions;
const cbor = require('cbor');

class WtrOfferPayload {
    constructor (action, offer, startDate = null, type = null, period = null) {
        this.action = action;
        this.offer = offer;
        this.startDate = startDate;
        this.type = type;
        this.period = period;
    }

    static fromBytes (payload) {
        payload = cbor.decodeFirstSync(payload);
        switch (payload.action) {
            case 'createOffer':
                if (!payload.offer || !payload.type || !payload.startDate)
                    throw new InvalidTransaction('Payload incorrect.');
                if (payload.type === 'auction' && (!payload.period || isNaN(payload.period)))
                    throw new InvalidTransaction("Period of auction not found or incorrect.");
                let period = null;
                if (payload.type === 'auction')
                    period = payload.type;
                return new WtrOfferPayload(
                    payload.action,
                    payload.offer,
                    payload.startDate,
                    payload.type,
                    period
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