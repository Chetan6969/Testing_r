import React from 'react';
import VerifyOTP from '../components/VerifyOTP';
import { useLocation } from 'react-router-dom';

const VerifyMobileOTP = () => {
  const location = useLocation();
  const { mobileNumber } = location.state || {};

  return <VerifyOTP mobileNumber={mobileNumber} type="mobile" />;
};

export default VerifyMobileOTP;