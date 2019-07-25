const { InvalidTransaction } = require('sawtooth-sdk').exceptions;
const { WtrCoinPayload } = require('./WtrCoinPayload');
const cbor = require('cbor');

class WtrPayload {
    constructor (action, address, buyer = null, seller = null, total = null, nonce = null) {
        this.action = action;
        this.address = address;
        this.buyer = buyer;
        this.seller = seller;
        this.total = total;
        this.nonce = nonce;
    }

    static fromBytes (payloadBuf) {
        let payload = cbor.decodeFirstSync(payloadBuf);
        switch (payload.action) {
            case 'mint':
                return WtrCoinPayload.fromBytes(payloadBuf);
            case 'newTransaction':
                if (null === payload.buyer || null === payload.seller
                    || null === payload.total || null === payload.nonce)
                    throw new InvalidTransaction('Payload incorrect.');
                return new WtrPayload(
                    payload.action,
                    null,
                    payload.buyer,
                    payload.seller,
                    payload.total,
                    payload.nonce
                )
            case 'pay':
            case 'requestKey':
            case 'terminate':
                if (null === payload.address)
                    throw new InvalidTransaction('Address not found.');
                return new WtrPayload(
                    payload.action,
                    payload.address.toString()
                )
            default:
                throw new InvalidTransaction("Action not recognized.");
        }
    }
}

module.exports = {
    WtrPayload
}