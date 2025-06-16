import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';

const YouTubeAuthError = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [errorMessage, setErrorMessage] = useState('');
  const [errorDetails, setErrorDetails] = useState('');

  useEffect(() => {
    const error = searchParams.get('error');
    const description = searchParams.get('error_description');
    
    if (error) {
      setErrorMessage(getErrorMessage(error));
      setErrorDetails(description || '');
    }
  }, [searchParams]);

  const getErrorMessage = (error) => {
    switch (error) {
      case 'access_denied':
        return 'Access was denied. You need to grant permission to connect your YouTube channel.';
      case 'unauthorized_client':
        return 'The application is not authorized to make this request.';
      case 'invalid_request':
        return 'The request was invalid. Please try again.';
      case 'unsupported_response_type':
        return 'The response type is not supported.';
      case 'invalid_scope':
        return 'The requested scope is invalid.';
      case 'server_error':
        return 'A server error occurred. Please try again later.';
      case 'temporarily_unavailable':
        return 'The service is temporarily unavailable. Please try again later.';
      default:
        return 'An unexpected error occurred during YouTube authentication.';
    }
  };

  const handleRetry = () => {
    // Navigate back to profile to try again
    navigate('/profile');
  };

  const handleGoHome = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="mb-6">
          <svg className="w-16 h-16 text-red-600 mx-auto mb-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
          </svg>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            YouTube Connection Failed
          </h1>
          <p className="text-gray-600 mb-4">
            {errorMessage}
          </p>
          {errorDetails && (
            <p className="text-sm text-gray-500 bg-gray-50 p-3 rounded border">
              {errorDetails}
            </p>
          )}
        </div>

        <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
          <h3 className="font-medium text-red-800 mb-2">Troubleshooting Steps:</h3>
          <ul className="text-sm text-red-700 space-y-1 text-left">
            <li>• Make sure you're signed into the correct Google account</li>
            <li>• Ensure you have a YouTube channel associated with your account</li>
            <li>• Check that you granted all required permissions</li>
            <li>• Try clearing your browser cache and cookies</li>
            <li>• Contact support if the problem persists</li>
          </ul>
        </div>

        <div className="space-y-3">
          <button
            onClick={handleRetry}
            className="w-full px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
          >
            Try Again
          </button>
          <button
            onClick={() => navigate('/profile')}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Go to Profile
          </button>
          <button
            onClick={handleGoHome}
            className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
          >
            Back to Home
          </button>
        </div>

        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
          <h4 className="font-medium text-blue-800 mb-2">Need Help?</h4>
          <p className="text-sm text-blue-700">
            If you continue to experience issues, please check our 
            <span className="font-medium"> troubleshooting guide</span> or 
            <span className="font-medium"> contact support</span>.
          </p>
        </div>
      </div>
    </div>
  );
};

export default YouTubeAuthError;
