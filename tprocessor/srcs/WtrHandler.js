const { TransactionHandler } = require('sawtooth-sdk/processor/handler');
const { InvalidTransaction } = require('sawtooth-sdk').exceptions;
const { WtrTransactionPayload } = require('./WtrTransactionPayload');
const { NAMESPACE, WtrTransactionState } = require('./WtrTransactionState');
const { WtrCoin } = require('./WtrCoin');
const { WtrCoinPayload } = require('./WtrCoinPayload');
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

        console.log("Action : " + payload.action);

        switch (payload.action) {
            case 'mint':
                payload = WtrCoinPayload.fromBytes(transactionRequest.payload);
                state = new WtrCoin(context, signer, payload.user); 
                return state.mintWtrCoin(payload.coins);
            case 'newTransaction':
                payload = WtrTransactionPayload.fromBytes(transactionRequest.payload);
                state = new WtrTransactionState(context, payload.seller, payload.buyer, signer, payload.address);
                return state.createNewTransaction(payload.total, payload.nonce);
            case 'pay':
                payload = WtrTransactionPayload.fromBytes(transactionRequest.payload);
                state = new WtrTransactionState(context, payload.seller, payload.buyer, signer, payload.address);
                return state.pay();
            case 'requestKey':
                payload = WtrTransactionPayload.fromBytes(transactionRequest.payload);
                state = new WtrTransactionState(context, payload.seller, payload.buyer, signer, payload.address);
                return state.requestKey();
            case 'terminate':
                payload = WtrTransactionPayload.fromBytes(transactionRequest.payload);
                state = new WtrTransactionState(context, payload.seller, payload.buyer, signer, payload.address);
                return state.terminate();
            default:
                throw new InvalidTransaction("Action not found.");
        }
    }
}

module.exports = WtrTransactionHandler;