const { InvalidTransaction } = require('sawtooth-sdk').exceptions;
const { SERVER_PUB_KEY } = require('../config');
const { _hash, NAMESPACE } = require('./Helper');
const { WtrCoin, _serializeCoins } = require('./WtrCoin');

class WtrTransactionState {
    constructor (context, seller, buyer, signer, addresss = null) {
        this.context = context;
        this.timeout = 500;
        this.seller = seller;
        this.buyer = buyer;
        this.signer = signer;
        this.addresss = addresss;
    }

    getTransaction() {
        return this.context.getState([this.addresss], this.timeout)
            .then ((valuesAddresses) => {
                let value = valuesAddresses[this.addresss];
                console.log("transaction : " + this.addresss + " => " + value);
                if (!value)
                    throw new InvalidTransaction("Can't get data of this transaction.");
                return value;
            })
            .catch ((error) => {
                throw new InvalidTransaction(error);
            });
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
        console.log("Paying a transaction...");
        this.getTransaction().then ((transaction) => {
            let data = transaction.toString().split(',');
            if (data.length < 3)
                throw new InvalidTransaction("This transaction is invalid.");
            let seller = data[0];
            let buyer = data[1];
            let total = parseInt(data[2]);
            if (this.signer !== buyer)
                throw new InvalidTransaction("You are not the buyer.");
            let buyerCoin = new WtrCoin(this.context, buyer);


            return buyerCoin.getBalance().then ((coins) => {
                if (coins < parseInt(total))
                    throw new InvalidTransaction("You don't have enough coins.");
                console.log("Buyer address :" + buyerCoin.address);
                let newCoins = coins - total
                let data = _serializeCoins(newCoins.toString());
                let entries = {
                    [buyerCoin.address]: data
                } 

                return this.context.setState(entries, this.timeout);
   /*             return this.context.setState(entries, this.timeout).then (() => {
                    console.log("the transaction paid.");
                    data = _serialize(seller, buyer, total, 'paid');
                    entries = {
                        [this.addresss]: data
                    }

                    return this.context.setState(entries, this.timeout);
                });
    */
            });
        })
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

const _serialize = (seller, buyer, total, status = null, padlock = null) => {
    let data = [];
    data.push([seller, buyer, total, status, padlock].join(','));

    return Buffer.from(data.join(''));
}

const _newWtrTransactionAddress = (x, y, nonce) => 
    NAMESPACE + _hash(x).substring(0, 28) + _hash(y).substring(0, 28) + _hash(nonce).substring(0, 8);

module.exports = {
    NAMESPACE,
    WtrTransactionState
}