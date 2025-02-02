const rideModel = require('../models/ride.model');
const mapService = require('./maps.service');
const bcrypt = require('bcrypt');
const crypto = require('crypto');

async function getFare(pickup, destination) {
    if (!pickup || !destination) {
        throw new Error('Pickup and destination are required');
    }

    const distanceTime = await mapService.getDistanceTime(pickup, destination);

    const baseFare = {
        '4-seater': 30,
        '7-seater': 50,
        '11-seater': 70
    };

    const perKmRate = {
        '4-seater': 10,
        '7-seater': 15,
        '11-seater': 20
    };

    const perMinuteRate = {
        '4-seater': 2,
        '7-seater': 3,
        '11-seater': 4
    };

    console.log("(ride.service.js)Distance & Time Data:", distanceTime); // Debugging

    const fare = {
        '4-seater': Math.round(baseFare['4-seater'] + ((distanceTime.distance.value / 1000) * perKmRate['4-seater']) + ((distanceTime.duration.value / 60) * perMinuteRate['4-seater'])),
        '7-seater': Math.round(baseFare['7-seater'] + ((distanceTime.distance.value / 1000) * perKmRate['7-seater']) + ((distanceTime.duration.value / 60) * perMinuteRate['7-seater'])),
        '11-seater': Math.round(baseFare['11-seater'] + ((distanceTime.distance.value / 1000) * perKmRate['11-seater']) + ((distanceTime.duration.value / 60) * perMinuteRate['11-seater']))
    };

    console.log("(ride.service.js)Calculated Fare:", fare); // Debugging
    return fare;
}

module.exports.getFare = getFare;


function getOtp(num) {
    function generateOtp(num) {
        const otp = crypto.randomInt(Math.pow(10, num - 1), Math.pow(10, num)).toString();
        return otp;
    }
    return generateOtp(num);
}


module.exports.createRide = async ({
    user, pickup, destination, vehicleType
}) => {
    if (!user || !pickup || !destination || !vehicleType) {
        throw new Error('All fields are required');
    }

    const fare = await getFare(pickup, destination);



    const ride = rideModel.create({
        user,
        pickup,
        destination,
        otp: getOtp(6),
        fare: fare[ vehicleType ]
    })

    return ride;
}

module.exports.confirmRide = async ({
    rideId, captain
}) => {
    if (!rideId) {
        throw new Error('Ride id is required');
    }

    await rideModel.findOneAndUpdate({
        _id: rideId
    }, {
        status: 'accepted',
        captain: captain._id
    })

    const ride = await rideModel.findOne({
        _id: rideId
    }).populate('user').populate('captain').select('+otp');

    if (!ride) {
        throw new Error('Ride not found');
    }

    return ride;

}

module.exports.startRide = async ({ rideId, otp, captain }) => {
    if (!rideId || !otp) {
        throw new Error('Ride id and OTP are required');
    }

    const ride = await rideModel.findOne({
        _id: rideId
    }).populate('user').populate('captain').select('+otp');

    if (!ride) {
        throw new Error('Ride not found');
    }

    if (ride.status !== 'accepted') {
        throw new Error('Ride not accepted');
    }

    if (ride.otp !== otp) {
        throw new Error('Invalid OTP');
    }

    await rideModel.findOneAndUpdate({
        _id: rideId
    }, {
        status: 'ongoing'
    })

    return ride;
}

module.exports.endRide = async ({ rideId, captain }) => {
    if (!rideId) {
        throw new Error('Ride id is required');
    }

    const ride = await rideModel.findOne({
        _id: rideId,
        captain: captain._id
    }).populate('user').populate('captain').select('+otp');

    if (!ride) {
        throw new Error('Ride not found');
    }

    if (ride.status !== 'ongoing') {
        throw new Error('Ride not ongoing');
    }

    await rideModel.findOneAndUpdate({
        _id: rideId
    }, {
        status: 'completed'
    })

    return ride;
}

