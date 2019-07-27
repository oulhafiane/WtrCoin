const { TransactionHandler } = require('sawtooth-sdk/processor/handler');
const { InvalidTransaction } = require('sawtooth-sdk').exceptions;
const { WtrPayload } = require('./WtrPayload');
const { NAMESPACE, WtrTransactionState } = require('./WtrTransactionState');
const { WtrCoin } = require('./WtrCoin');
const { WtrParameterState } = require('./WtrParameterState');
const { FAMILY_NAME } = require('../config');

class WtrTransactionHandler extends TransactionHandler {
    constructor () {
        super(FAMILY_NAME, ['1.0'], [NAMESPACE]);
    }

    apply (transactionRequest, context) {
        let header = transactionRequest.header;
        let signer = header.signerPublicKey;
        let payload;
        let state;

        payload = WtrPayload.fromBytes(transactionRequest.payload);

        switch (payload.action) {
            case 'addParameter':
                state = new WtrParameterState(context, signer);
                return state.addParameter(payload.name, payload.value);
            case 'mint':
                state = new WtrCoin(context, payload.user, signer); 
                return state.mintWtrCoin(payload.coins);
            case 'newTransaction':
                state = new WtrTransactionState(context, payload.seller, payload.buyer, signer, payload.address);
                return state.createNewTransaction(payload.total, payload.nonce);
            case 'pay':
                state = new WtrTransactionState(context, payload.seller, payload.buyer, signer, payload.address);
                return state.pay(payload.key, payload.iv);
            case 'terminate':
                state = new WtrTransactionState(context, payload.seller, payload.buyer, signer, payload.address);
                return state.terminate(payload.key, payload.iv);
            default:
                throw new InvalidTransaction("Action not found.");
        }
    }
}

module.exports = WtrTransactionHandler;