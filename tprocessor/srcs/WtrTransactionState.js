const { InvalidTransaction } = require('sawtooth-sdk').exceptions;
const crypto = require('crypto');
const { SERVER_PUB_KEY } = require('../config');

class WtrTransactionState {
    constructor (context, seller, buyer, signer, addresss = null) {
        this.context = context;
        this.timeout = 500;
        this.seller = seller;
        this.buyer = buyer;
        this.signer = signer;
        this.addresss = addresss;
    }

    createNewTransaction (total, nonce) {
        console.log("Creating new transaction...");
        if (null !== this.addresss)
            throw new InvalidTransaction("This transaction already created.");
        if (SERVER_PUB_KEY !== this.signer)
            throw new InvalidTransaction("You are not authorized.");
        console.log("All tests passed : OK.");
        this.addresss = _newWtrTransactionAddress(this.seller, this.buyer, nonce);
        let data = _serialize(this.seller, this.buyer, total);
        let entries = {
            [this.addresss]: data
        }
        console.log("Sending it to validator...");

        return this.context.setState(entries, this.timeout);
    }

    pay () {

    }

    requestKey () {
        //check status if paid
   //     var mykey = crypto.createCipher('aes-128-cbc', 'mypassword');
   //     var mystr = mykey.update('abc', 'utf8', 'hex')
   //     mystr += mykey.update.final('hex');
    }

    terminate () {

    }
}

const _serialize = (seller, buyer, total) => {
    let data = [];
    data.push([seller, buyer, total].join(''));

    return Buffer.from(data.join(''));
}

const _hash = (x) => crypto.createHash('sha512').update(x).digest('hex').toLowerCase().substring(0, 64);
const FAMILY_NAME = 'wtr-transaction-family';
const NAMESPACE = _hash(FAMILY_NAME).substring(0, 6);
const _newWtrTransactionAddress = (x, y, nonce) => 
    NAMESPACE + _hash(x).substring(0, 28) + _hash(y).substring(0, 28) + _hash(nonce).substring(0, 8);

module.exports = {
    NAMESPACE,
    FAMILY_NAME,
    WtrTransactionState
}