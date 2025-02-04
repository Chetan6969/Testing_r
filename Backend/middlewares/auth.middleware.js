const userModel = require('../models/user.model');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const blackListTokenModel = require('../models/blackListToken.model');
const captainModel = require('../models/captain.model');


module.exports.authUser = async (req, res, next) => {
    const token = req.cookies.token || req.headers.authorization?.split(' ')[ 1 ];

    if (!token) {
        return res.status(401).json({ message: 'Unauthorized' });
    }


    const isBlacklisted = await blackListTokenModel.findOne({ token: token });

    if (isBlacklisted) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    try {

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await userModel.findById(decoded._id)

        if (!user) {
            return res.status(401).json({ message: "User not found" });
          }

        req.user = user;

        next();

    } catch (err) {
        console.error("Error in auth middleware:", err);
        return res.status(401).json({ message: 'Unauthorized' });
    }
}

module.exports.authCaptain = async (req, res, next) => {
    const token = req.cookies.token || req.headers.authorization?.split(' ')[1];
  
    if (!token) {
      console.log('No token provided');
      return res.status(401).json({ message: 'Unauthorized: No token provided' });
    }
  
    const isBlacklisted = await blackListTokenModel.findOne({ token });
    if (isBlacklisted) {
      console.log('Token is blacklisted');
      return res.status(401).json({ message: 'Unauthorized: Token is blacklisted' });
    }
  
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log('Decoded token:', decoded); // Log decoded token for debugging
  
      const captain = await captainModel.findById(decoded._id);
      console.log('Fetched captain:', captain); // Log fetched captain
  
      if (!captain) {
        console.log('Captain not found in the database');
        return res.status(404).json({ message: 'Captain not found' });
      }
  
      req.captain = captain; // Attach captain to request object
      next();
    } catch (err) {
      console.error('Error in authCaptain middleware:', err);
      return res.status(401).json({ message: 'Unauthorized: Invalid token' });
    }
  };
  
  