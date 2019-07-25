const { InvalidTransaction } = require('sawtooth-sdk').exceptions;
const cbor = require('cbor');

class WtrTransactionPayload {
    constructor (action, address, buyer = null, seller = null, total = null) {
        this.action = action;
        this.address = address;
        this.buyer = buyer;
        this.seller = seller;
        this.total = total;
    }

    static fromBytes (payload) {
        payload = cbor.decodeFirstSync(payload);
        let wtrTransactionPayload;
        switch (payload.action) {
            case 'newTransaction':
                if (null === payload.buyer || null === payload.seller || null === payload.total)
                    throw new InvalidTransaction('Payload incorrect.');
                wtrTransactionPayload = new WtrTransactionPayload(
                    payload.action,
                    null,
                    payload.buyer,
                    payload.seller,
                    payload.total
                )
                return wtrTransactionPayload;
            case 'pay':
            case 'requestKey':
            case 'terminate':
                if (null === payload.address)
                    throw new InvalidTransaction('Address not found.');
                wtrTransactionPayload = new WtrTransactionPayload(
                    payload.action,
                    payload.address
                )
                return wtrTransactionPayload();
            default:
                throw new InvalidTransaction("Action not recognized.");
        }
    }
}

module.exports = {
    WtrTransactionPayload
}