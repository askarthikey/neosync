import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';

const YouTubeAuthSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [channelName, setChannelName] = useState('');
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    const channel = searchParams.get('channel');
    const status = searchParams.get('status');
    
    if (channel) {
      setChannelName(decodeURIComponent(channel));
    }
    
    // Countdown timer
    const countdownTimer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(countdownTimer);
          navigate('/profile');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(countdownTimer);
  }, [searchParams, navigate]);

  const handleGoToProfile = () => {
    navigate('/profile');
  };

  const handleGoHome = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center px-4">
      <div className="max-w-lg w-full bg-white rounded-xl shadow-xl p-8 text-center">
        <div className="mb-6">
          <div className="relative">
            <svg className="w-20 h-20 text-green-500 mx-auto mb-4 animate-pulse" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
            </svg>
          </div>
          
          <h1 className="text-3xl font-bold text-gray-800 mb-3">
            🎉 YouTube Connected!
          </h1>
          
          {channelName && (
            <div className="bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg p-4 mb-4">
              <p className="text-sm font-medium mb-1">Channel Connected:</p>
              <p className="text-lg font-bold">{channelName}</p>
            </div>
          )}
          
          <p className="text-gray-600 mb-4">
            Your YouTube channel has been successfully connected to your account!
          </p>
        </div>

        <div className="bg-green-50 border-l-4 border-green-400 p-4 mb-6">
          <h3 className="font-semibold text-green-800 mb-3">
            What You Can Do Now:
          </h3>
          <ul className="text-sm text-green-700 space-y-2 text-left">
            <li className="flex items-start">
              <span className="text-green-500 mr-2">✓</span>
              Editors can upload videos directly to your channel
            </li>
            <li className="flex items-start">
              <span className="text-green-500 mr-2">✓</span>
              All uploads are set to private by default for your review
            </li>
            <li className="flex items-start">
              <span className="text-green-500 mr-2">✓</span>
              You maintain full control and can revoke access anytime
            </li>
            <li className="flex items-start">
              <span className="text-green-500 mr-2">✓</span>
              Manage editor permissions from your profile page
            </li>
          </ul>
        </div>

        <div className="space-y-3">
          <button
            onClick={handleGoToProfile}
            className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
          >
            Go to Profile
          </button>
          <button
            onClick={handleGoHome}
            className="w-full px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
          >
            Back to Dashboard
          </button>
        </div>

        <div className="mt-6 p-3 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-700">
            <span className="font-medium">Auto-redirecting to profile in {countdown} seconds...</span>
          </p>
          <div className="w-full bg-blue-200 rounded-full h-1 mt-2">
            <div 
              className="bg-blue-600 h-1 rounded-full transition-all duration-1000"
              style={{ width: `${((5 - countdown) / 5) * 100}%` }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default YouTubeAuthSuccess;
