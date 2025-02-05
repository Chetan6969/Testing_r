const rideService = require('../services/ride.service');
const { validationResult } = require('express-validator');
const mapService = require('../services/maps.service');
const { sendMessageToSocketId } = require('../socket');
const rideModel = require('../models/ride.model');


// Backend/controllers/ride.controller.js
module.exports.createRide = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { pickup, destination, vehicleType } = req.body;

    try {
        const fareData = await rideService.getFare(pickup, destination);
        
        const ride = await rideService.createRide({
            user: req.user._id,
            pickup,
            destination,
            vehicleType,
            fare: fareData[vehicleType]
        });

        // Send email to admin
        await sendEmailToAdmin(ride);
        
        res.status(201).json({ 
            ...ride.toObject(), 
            message: "Ride request sent to admin for approval" 
        });

    } catch (err) {
        console.error('Error creating ride:', err);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

async function sendEmailToAdmin(ride) {
    const adminEmail = process.env.ADMIN_EMAIL;
    const user = await userModel.findById(ride.user);
    
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: adminEmail,
        subject: 'New Ride Request',
        html: `
            <h3>New Ride Request Received</h3>
            <p>User: ${user.fullname.firstname} ${user.fullname.lastname}</p>
            <p>Pickup: ${ride.pickup}</p>
            <p>Destination: ${ride.destination}</p>
            <p>Vehicle Type: ${ride.vehicleType}</p>
            <p>Fare: ₹${ride.fare}</p>
        `
    };
    
    await transporter.sendMail(mailOptions);
}



module.exports.getFare = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { pickup, destination } = req.query;

    try {
        const fare = await rideService.getFare(pickup, destination);
        return res.status(200).json(fare);
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
}

module.exports.confirmRide = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { rideId } = req.body;

    try {
        const ride = await rideService.confirmRide({ rideId, captain: req.captain });

        sendMessageToSocketId(ride.user.socketId, {
            event: 'ride-confirmed',
            data: {
                ...ride.toObject(),
                otp: ride.otp, // Ensure OTP is included
                captain: ride.captain, // Ensure captain details are included
            }
        });

        return res.status(200).json(ride);
    } catch (err) {
        console.log(err);
        return res.status(500).json({ message: err.message });
    }
}

module.exports.startRide = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { rideId, otp } = req.query;

    try {
        const ride = await rideService.startRide({ rideId, otp, captain: req.captain });

        console.log(ride);

        sendMessageToSocketId(ride.user.socketId, {
            event: 'ride-started',
            data: ride
        })

        return res.status(200).json(ride);
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
}

// Backend/controllers/ride.controller.js
module.exports.endRide = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { rideId } = req.body;

    try {
        const ride = await rideService.endRide({ rideId, captain: req.captain });

        sendMessageToSocketId(ride.user.socketId, {
            event: 'ride-ended',
            data: ride
        });

        return res.status(200).json(ride);
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
}

// Backend/controllers/ride.controller.js
module.exports.getUserRideHistory = async (req, res) => {
    try {
        const rides = await rideModel.find({ user: req.user._id })
            .populate('captain', 'fullname vehicle')
            .sort({ createdAt: -1 });
        res.status(200).json(rides);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};


module.exports.getCaptainRideHistory = async (req, res) => {
    try {
        const rides = await rideModel.find({ captain: req.captain._id }).sort({ createdAt: -1 });
        res.status(200).json(rides);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

module.exports.getRideById = async (req, res) => {
    try {
        const ride = await rideModel.findById(req.params.rideId)
            .populate('user')
            .populate('captain');
        res.status(200).json(ride);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};


module.exports.getAutoCompleteSuggestions = async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { input } = req.query;

        if (!input || input.length < 3) {
            return res.status(400).json({ message: 'Input must be at least 3 characters long' });
        }

        const suggestions = await mapService.getAutoCompleteSuggestions(input);
        res.status(200).json(suggestions);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Internal server error' });
    }
};