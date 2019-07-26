const { InvalidTransaction } = require('sawtooth-sdk').exceptions;
const { SERVER_PUB_KEY } = require('../config');
const { _hash, NAMESPACE } = require('./Helper');
const { WtrCoin, _serializeCoins } = require('./WtrCoin');
const crypto = require('crypto');

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
                if (value === undefined)
                    throw new InvalidTransaction("Can't get data of this transaction.");
                return value;
            })
            .catch ((error) => {
                throw new InvalidTransaction(error);
            });
    }

    createNewTransaction (total, nonce) {
        if (null !== this.addresss)
            throw new InvalidTransaction("This transaction already created.");
        if (SERVER_PUB_KEY !== this.signer)
            throw new InvalidTransaction("You are not authorized.");
        this.addresss = _newWtrTransactionAddress(this.seller, this.buyer, nonce);
        let data = _serialize(this.seller, this.buyer, total);
        let entries = {
            [this.addresss]: data
        }

        return this.context.setState(entries, this.timeout);
    }

    pay (key, iv) {
        return this.getTransaction().then ((transaction) => {
            let data = transaction.toString().split(',');
            if (data.length !== 5)
                throw new InvalidTransaction("This transaction is invalid.");
            let seller = data[0];
            let buyer = data[1];
            let total = parseInt(data[2]);
            if (this.signer !== buyer)
                throw new InvalidTransaction("You are not the buyer.");
            if (data[3] === 'paid')
                throw new InvalidTransaction("This transaction already paid");
            let buyerCoin = new WtrCoin(this.context, buyer);


            return buyerCoin.getBalance().then ((coins) => {
                if (coins < parseInt(total))
                    throw new InvalidTransaction("You don't have enough coins.");
                let newCoins = coins - total;
                let data = _serializeCoins(newCoins.toString());
                let entries = {
                    [buyerCoin.address]: data
                } 

                return this.context.setState(entries, this.timeout).then (() => {
                    padlock = _crypt('disagree yellow borrowed comment directly silicon subway largest show dilemma issues rebels', key, iv);
                    data = _serialize(seller, buyer, total, 'paid', padlock.toString('hex'));
                    entries = {
                        [this.addresss]: data
                    }

                    return this.context.setState(entries, this.timeout);
                });
            });
        });
    }

    terminate (key, iv) {
        return this.getTransaction().then ((transaction) => {
            let data = transaction.toString().split(',');
            if (data.length !== 5)
                throw new InvalidTransaction("This transaction is invalid.");
            let seller = data[0];
            let buyer = data[1];
            let total = parseInt(data[2]);
            let padlock = data[4];
            if (this.signer !== seller)
                throw new InvalidTransaction("You are not the seller.");
            if (data[3] === 'terminated')
                throw new InvalidTransaction("This transaction already terminated.");
            if (data[3] !== 'paid')
                throw new InvalidTransaction("This transaction not paid yet or canceled.");
            let sellerCoin = new WtrCoin(this.context, seller);
            
            return sellerCoin.getBalance().then ((coins) => {
                if (isNaN(coins))
                    coins = 0;
                let newCoins = coins + total;
                let data = _serializeCoins(newCoins.toString());
                let entries = {
                    [sellerCoin.address]: data
                } 

                return this.context.setState(entries, this.timeout).then (() => {
                    decrypted = _decrypt(padlock, key, iv);
                    if (decrypted.toString() !== 'disagree yellow borrowed comment directly silicon subway largest show dilemma issues rebels')
                        throw new InvalidTransaction("Invalid key.");
                    data = _serialize(seller, buyer, total, 'terminated', 'terminated');
                    entries = {
                        [this.addresss]: data
                    }

                    return this.context.setState(entries, this.timeout);
                });
            });
            
            
        });
    }
}

const _crypt = (data, key, iv) => {
    let cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(key, 'base64'), Buffer.from(iv, 'base64'));
    let padlock = cipher.update(data);
    padlock = Buffer.concat([padlock, cipher.final()]);

    return padlock;
}

const _decrypt = (padlock, key, iv) => {
    let decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(key, 'base64'), Buffer.from(iv, 'base64'));
    let decrypted = decipher.update(Buffer.from(padlock, 'hex'));
    decrypted = Buffer.concat([decrypted, decipher.final()]);

    return decrypted;
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