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

    enterAuction(total) {
        return this.getOffer().then((offer) => {
            if (null === offer)
                throw new InvalidTransaction("Offer not found");
            offer = offer.toString().split(',');
            if ("auction" !== offer[1])
                throw new InvalidTransaction("This offer is not and auction.");
            if (this.signer === offer[5])
                throw new InvalidTransaction("You cannot give bid in your auction.");
            if (total <= parseInt(offer[6]))
                throw new InvalidTransaction("Your bid is too low.");
            let addressAuction = _makeWtrAddress(this.offer + "-auction");
            return this.context.getState([addressAuction], this.timeout)
                .then((auctions) => {
                    let auction = auctions[addressAuction];
                    let bids;
                    if (!auction.toString()) {
                        bids = new Map([]);
                    } else {
                        bids = _deserializeBids(auction);
                    }
                    let bid = bids.get(this.signer);
                    if (undefined === bid) {
                        let userCoin = new WtrCoin(this.context, this.signer);
                        return userCoin.getBalance().then((coinsBuf) => {
                            if (null === coinsBuf)
                                throw new InvalidTransaction("You don't have enough coins.");
                            let coins = coinsBuf.toString().split(',');
                            return new WtrParameterState(this.context).getParameters().then((parametersBuf) => {
                                if (null === parametersBuf)
                                    throw new InvalidTransaction("Cannot find any parameters.");
                                let fees = _deserializeParameters(parametersBuf).get('feesBid');
                                if (isNaN(fees))
                                    throw new InvalidTransaction("Cannot get the right parameters.");
                                if (isNaN(coins[0]) || parseInt(coins[0]) < fees)
                                    throw new InvalidTransaction("You don't have enough coins.");
                                coins[0] = parseInt(coins[0]) - parseInt(fees);
                                coins[1] = parseInt(coins[1]) + parseInt(fees);
                                let data = _serializeCoins(coins[0].toString(), coins[1].toString());
                                let entries = {
                                    [userCoin.address]: data
                                }

                                return this.context.setState(entries, this.timeout).then(() => {
                                    bid = {
                                        fees: fees,
                                        total: total
                                    };
                                    bids.set(this.signer, bid);
                                    data = _serializeBids(bids);
                                    entries = {
                                        [addressAuction]: data
                                    };

                                    return this.context.setState(entries, this.timeout);
                                });
                            });
                        });
                    } else {
                        console.log ("total : " + total);
                        console.log( "bid total : "+ bids.values().next().total);
                        if (total <= parseInt(bids.values().next().total))
                            throw new InvalidTransaction("Your bid is too low.");
                        bid = {
                            fees: bid.fees,
                            total: total
                        };
                        bids.set(this.signer, bid);
                        let data = _serializeBids(bids);
                        let entries = {
                            [addressAuction]: data
                        };

                        return this.context.setState(entries, this.timeout);
                    }
                });
        });
    }

    leaveAuction() {

    }

    createOffer(type, startDate, periodParam, total) {
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
                return userCoin.getBalance().then((coinsBuf) => {
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

                    return this.context.setState(entries, this.timeout).then(() => {
                        startDate = startDate.toString();
                        let endDate = new Date(startDate);
                        endDate.setDate(endDate.getDate() + period);
                        let data = _serializeOffer(this.offer, type, fees, startDate, endDate.toString(), this.signer, total);
                        let entries = {
                            [this.address]: data
                        }

                        return this.context.setState(entries, this.timeout);
                    });
                });
            });
        });
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

const _serializeOffer = (offer, type, fees, startDate, endDate, owner, total, confirmed = null) => {
    let data = [];
    data.push([offer, type, fees, startDate, endDate, owner, total, confirmed].join(','));

    return Buffer.from(data.join(''));
}

const _sortByNumber = (a, b) => {
    return parseInt(a.split(',')[0]) - parseInt(b.split(','))[0];
}

const _serializeBids = (bids) => {
    let data = [];
    for (let bid of bids) {
        let bidder = bid[0];
        let fees = bid[1].fees;
        let total = bid[1].total;
        if (bidder.indexOf('|') !== -1)
            throw new InvalidTransaction("Bidder address cannot contain '|'");
        if (fees.indexOf('|') !== -1)
            throw new InvalidTransaction("Fees of auction cannot contain '|'");
        if (total.indexOf('|') !== -1)
            throw new InvalidTransaction("Fees of auction cannot contain '|'");
        data.push([total, bidder, fees].join(','));
    }
    data.sort(_sortByNumber);

    return Buffer.from(data.join('|'));
}

const _deserializeBids = (bidsBuf) => {
    let bids = bidsBuf.toString().split('|').map(x => x.split(','))
        .map(x => [x[1], { fees: x[2], total: x[0] }]);

    return new Map(bids);
}

module.exports = {
    WtrOfferState
}