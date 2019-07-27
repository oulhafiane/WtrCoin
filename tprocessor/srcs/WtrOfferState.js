const { InvalidTransaction } = require('sawtooth-sdk').exceptions;
const { _makeWtrAddress } = require('./Helper');
const { WtrParameterState, _deserializeParameters } = require('./WtrParameterState');
const { WtrCoin, _serializeCoins } = require('./WtrCoin');

class WtrOfferState {
    constructor(context, offer, signer = null) {
        this.context = context;
        this.timeout = 500;
        this.offer = offer;
        this.signer = signer;
        this.address = _makeWtrAddress(offer);
    }

    getOffer() {
        return this.context.getState([this.address], this.timeout)
            .then((values) => {
                let offer = values[this.address];
                if (!offer.toString()) {
                    return null;
                } else {
                    return offer;
                }
            })
            .catch((error) => {
                throw new InvalidTransaction(error);
            });
    }

    createOffer(type, startDate, periodParam) {
        return this.getOffer().then((offer) => {
            if (null !== offer)
                throw new InvalidTransaction("This offer already exists.");
            if (type !== 'sale' && type !== 'purchase' && type !== 'bulkPurchase' && type !== 'auction')
                throw new InvalidTransaction("Type of offer is invalid.");
            return new WtrParameterState(this.context).getParameters().then((parametersBuf) => {
                if (null === parametersBuf)
                    throw new InvalidTransaction("Cannot find any parameters.");
                let parameters = _deserializeParameters(parametersBuf);
                let fees = _getFees(type, parameters, periodParam);
                let period = _getPeriod(type, parameters, periodParam);
                if (isNaN(fees) || isNaN(period))
                    throw new InvalidTransaction("Cannot get the right parameters.");
                let userCoin = new WtrCoin(this.context, this.signer);
                return userCoin.getBalance().then ((coinsBuf) => {
                    if (null === coinsBuf)
                        throw new InvalidTransaction("You don't have enough coins.");
                    let coins = coinsBuf.toString().split(',');
                    if (parseInt(coins[0]) < fees)
                        throw new InvalidTransaction("You don't have enough coins.");
                    coins[0] = parseInt(coins[0]) - fees; 
                    coins[1] = parseInt(coins[1]) + fees;
                    let data = _serializeCoins(coins[0].toString(), coins[1].toString());
                    let entries = {
                        [userCoin.address]: data
                    }
            
                    return this.context.setState(entries, this.timeout).then (() => {
                        startDate = startDate.toString();
                        let endDate = new Date(startDate);
                        endDate.setDate(endDate.getDate() + period);
                        let data = _serializeOffer(this.offer, type, startDate, endDate.toString(), this.signer);
                        let entries = {
                            [this.address]: data
                        }

                        return this.context.setState(entries, this.timeout);
                    }).catch((error) => { throw new InvalidTransaction(error)});
                }).catch((error) => { throw new InvalidTransaction(error)});;
            }).catch((error) => { throw new InvalidTransaction(error)});;
        }).catch((error) => { throw new InvalidTransaction(error)});;
    }
}

const _getPeriod = (type, parameters, periodParam = null) => {
    let period;
    switch (type) {
        case 'sale':
        case 'purchase':
        case 'bulkPurchase':
            period = parameters.get('periodOffer');
            break;
        case 'auction':
            periodParam = parseInt(periodParam);
            console.log("Period " + periodParam);
            if (periodParam === 1)
                period = parameters.get('smallPeriodAuctionBid');
            else if (periodParam === 2)
                period = parameters.get('mediumPeriodAuctionBid');
            else if (periodParam === 3)
                period = parameters.get('largePeriodAuctionBid');
            else
                throw new InvalidTransaction("Period of auction is invalid.");
            break;
        default:
            throw new InvalidTransaction("Type of offer is invalid.");
    }

    return parseInt(period);
}

const _getFees = (type, parameters, periodParam = null) => {
    let fees;
    switch (type) {
        case 'sale':
            fees = parameters.get('feesSaleOffer');
            break;
        case 'purchase':
            fees = parameters.get('feesPurchaseOffer');
            break;
        case 'bulkPurchase':
            fees = parameters.get('feesBulkPurchaseOffer');
            break;
        case 'auction':
            periodParam = parseInt(periodParam);
            if (periodParam === 1)
                fees = parameters.get('feesSmallAuctionBid');
            else if (periodParam === 2)
                fees = parameters.get('feesMediumAuctionBid');
            else if (periodParam === 3)
                fees = parameters.get('feesLargeAuctionBid');
            else
                throw new InvalidTransaction("Period of auction is invalid.");
            break;
        default:
            throw new InvalidTransaction("Type of offer is invalid.");
    }

    return parseInt(fees);
}

const _serializeOffer = (offer, type, startDate, endDate, owner, bids = null, confirmed = null) => {
    let data = [];
    data.push([offer, type, startDate, endDate, owner, bids, confirmed].join(','));

    return Buffer.from(data.join(''));
}

module.exports = {
    WtrOfferState
}