const { InvalidTransaction } = require('sawtooth-sdk').exceptions;
const { _makeWtrAddress } = require('./Helper');

class WtrOfferState {
    constructor (context, signer, offer) {
        this.context = context;
        this.timeout = 500;
        this.offer = offer;
        this.signer = signer;
        this.address = _makeWtrAddress(offer);
    }

    getOffer() {
        return this.context.getState([this.address], this.timeout)
            .then ((values) => {
                let offer = values[this.address];
                if (!offer.toString()) {
                    return null;
                } else {
                    return offer;
                }
            })
            .catch ((error) => {
                throw new InvalidTransaction(error);
            });
    }

    createOffer(type) {
        return this.getOffer().then((offer) => {
            if (null !== offer)
                throw new InvalidTransaction("This offer already exists.");
            let data = _serializeOffer(this.offer, type, this.signer);
            let entries = {
                [this.address]: data
            }

            return this.context.setState(entries, this.timeout);
        });
    }
}

const _serializeOffer = (offer, type, owner, bids = null) => {
    let data = [];
    data.push([offer, type, owner, bids].join(','));

    return Buffer.from(data.join(''));
}

module.exports = {
    WtrOfferState
}