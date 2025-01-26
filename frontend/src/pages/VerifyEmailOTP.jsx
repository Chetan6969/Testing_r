import React from 'react';
import VerifyOTP from '../components/VerifyOTP';
import { useLocation } from 'react-router-dom';

const VerifyEmailOTP = () => {
  const location = useLocation();
  const { email } = location.state || {};

  return <VerifyOTP email={email} type="email" />;
};

export default VerifyEmailOTP;