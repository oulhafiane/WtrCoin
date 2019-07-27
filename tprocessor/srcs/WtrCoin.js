const { InvalidTransaction } = require('sawtooth-sdk').exceptions;
const { MINTER_PUB_KEY } = require('../config');
const { _hash, NAMESPACE } = require('./Helper');

class WtrCoin {
    constructor (context, user, signer = null) {
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
                if (coins === undefined) {
                    return null;
                } else {
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
        return this.getBalance().then((coinsBuf) => {
            let coins = [];
            if (null === coinsBuf) {
                coins[0] = 0;
                coins[1] = 0;
            } else {
                coins = coinsBuf.toString().split(',');
            }
            if (isNaN(coins[0]))
                coins[0] = 0;
            if (isNaN(coins[1]))
                coins[1] = 0;
            let newCoins = parseInt(coinsToDeposit) + coins[0];
            let data = _serializeCoins(newCoins.toString(), coins[1].toString());
            let entries = {
                [this.address]: data
            }

            return this.context.setState(entries, this.timeout);
        });
    }
}

const _serializeCoins = (coins, onhold) => {
    let data = [];
    data.push([coins, onhold].join(','));

    return Buffer.from(data.join(''));
}

const _makeWtrCoinAddress = (x) => NAMESPACE + _hash(x);

module.exports = {
    WtrCoin,
    _serializeCoins
}