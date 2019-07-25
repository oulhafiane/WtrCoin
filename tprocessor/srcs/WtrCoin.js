const { InvalidTransaction } = require('sawtooth-sdk').exceptions;
const { MINTER_PUB_KEY } = require('../config');
const { _hash, NAMESPACE } = require('./Helper');

class WtrCoin {
    constructor (context, signer, user) {
        this.context = context;
        this.timeout = 500;
        this.signer = signer;
        this.user = user;
        this.address = _makeWtrCoinAddress(user);
    }

    getBalance() {
        return this.context.getState([this.address], this.timeout)
            .then ((values) => {
                let coins = values[this.address];
                if (!Object.keys(coins).length) {
                    return 0;
                } else {
                    console.log("User : " + this.user + " => " + coins);
                    return coins;
                }
            })
            .catch ((error) => {
                throw new InvalidTransaction(error);
            })
    }

    mintWtrCoin(coinsToDeposit) {
        if (MINTER_PUB_KEY !== this.signer)
            throw new InvalidTransaction("You are not the minter.");
        return this.getBalance().then((coins) => {
            let newCoins = parseInt(coinsToDeposit) + parseInt(coins);
            let data = _serialize(newCoins.toString());
            let entries = {
                [this.address]: data
            }

            return this.context.setState(entries, this.timeout);
        });
    }
}

const _serialize = (coins) => {
    let data = [];
    data.push([coins].join(''));

    return Buffer.from(data.join(''));
}

const _makeWtrCoinAddress = (x) => NAMESPACE + _hash(x);

module.exports = {
    WtrCoin
}