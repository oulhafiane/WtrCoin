const { TransactionHandler } = require('sawtooth-sdk/processor/handler');
const { InvalidTransaction } = require('sawtooth-sdk').exceptions;
const { WtrTransactionPayload } = require('./WtrTransactionPayload');
const { FAMILY_NAME, NAMESPACE, WtrTransactionState } = require('./WtrTransactionState');

class WtrTransactionHandler extends TransactionHandler {
    constructor () {
        super(FAMILY_NAME, ['1.0'], [NAMESPACE]);
    }

    apply (transactionRequest, context) {
        let header = transactionRequest.header;
        let signer = header.signerPublicKey;
        let payload = WtrTransactionPayload.fromBytes(transactionRequest.payload);
        let state = new WtrTransactionState(context, payload.seller, payload.buyer, signer, payload.address);

        console.log("Action : " + payload.action);

        switch (payload.action) {
            case 'newTransaction':
                return state.createNewTransaction(payload.total, payload.nonce);
            case 'pay':
                return state.pay();
            case 'requestKey':
                return state.requestKey();
            case 'terminate':
                return state.terminate();
        }
    }
}

module.exports = WtrTransactionHandler;