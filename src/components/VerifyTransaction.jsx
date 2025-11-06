import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../api/client';

export default function VerifyTransaction() {
    const location = useLocation();
    const navigate = useNavigate();
    const [verificationCode, setVerificationCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [transactionInfo, setTransactionInfo] = useState(null);
    const [error, setError] = useState('');

    useEffect(() => {
        if (location.state) {
            setTransactionInfo(location.state);
            console.log('🔍 Transaction info from location:', location.state);
        } else {
            navigate('/topup');
        }
    }, [location, navigate]);

    const handleVerify = async (e) => {
        e.preventDefault();
        setError('');
        
        if (!verificationCode) {
            setError('Please enter the verification code');
            return;
        }

        setLoading(true);

        try {
            // **FIX: transaction_id -> generated_transaction_id**
            const payload = {
                transaction_id: transactionInfo.generated_transaction_id, // এই line change করুন
                verification_code: verificationCode
            };

            console.log('🚀 Sending verification request:', payload);

            const response = await api.post('/verify-transaction', payload);

            console.log('✅ Verification response:', response.data);

            if (response.data.success) {
                alert('✅ Transaction verified successfully! Waiting for admin approval.');
                navigate('/dashboard');
            }
        } catch (error) {
            console.error('❌ Verification error:', error);
            console.error('❌ Error response:', error.response);
            
            const errorMessage = error.response?.data?.message || 'Verification failed. Please try again.';
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    // Test function - সরাসরি database check করার জন্য
    const testDirectVerification = async () => {
        const testData = {
            transaction_id: 'TXN202510052223527afvuw', // generated_transaction_id
            verification_code: 'DW9TQU'
        };

        try {
            console.log('🧪 Testing with direct data:', testData);
            const response = await api.post('/verify-transaction', testData);
            console.log('🧪 Test response:', response.data);
        } catch (error) {
            console.error('🧪 Test error:', error.response);
        }
    };

    if (!transactionInfo) {
        return (
            <div className="container py-4">
                <div className="text-center">
                    <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="container py-5">
            <div className="row justify-content-center">
                <div className="col-lg-6 col-md-8">
                    <div className="card shadow">
                        <div className="card-header bg-success text-white text-center p-3">
                            <h4 className="mb-0">
                                <i className="fas fa-check-circle me-2"></i>
                                Verify Transaction
                            </h4>
                        </div>
                        
                        <div className="card-body p-5">
                            {/* Debug Info */}
                            {/*<div className="alert alert-info">
                                <strong>Debug Information:</strong>
                                <br />
                                Transaction ID: <code>{transactionInfo.generated_transaction_id}</code>
                                <br />
                                Your Code: <code>{transactionInfo.verification_code}</code>
                            </div>*/}

                            {/* Error Message */}
                            {error && (
                                <div className="alert alert-danger">
                                    <i className="fas fa-exclamation-triangle me-2"></i>
                                    {error}
                                </div>
                            )}

                            {/* Transaction Summary */}
                            <div className="transaction-summary bg-light p-4 rounded mb-4">
                                <h6 className="mb-3">
                                    <i className="fas fa-receipt me-2"></i>
                                    Transaction Details:
                                </h6>
                                <div className="row">
                                    <div className="col-5">
                                        <strong>Transaction ID:</strong>
                                    </div>
                                    <div className="col-7">
                                        <code>{transactionInfo.generated_transaction_id}</code>
                                    </div>
                                </div>
                                <div className="row mt-2">
                                    <div className="col-5">
                                        <strong>Amount:</strong>
                                    </div>
                                    <div className="col-7">
                                        ৳ {transactionInfo.amount}
                                    </div>
                                </div>
                                <div className="row mt-2">
                                    <div className="col-5">
                                        <strong>Method:</strong>
                                    </div>
                                    <div className="col-7 text-uppercase">
                                        {transactionInfo.payment_method}
                                    </div>
                                </div>
                            </div>

                            {/* Verification Form */}
                            <form onSubmit={handleVerify}>
                                <div className="form-group my-4">
                                    {/*<label className="form-label">
                                        <i className="fas fa-shield-alt me-2"></i>
                                        Enter Verification Code
                                    </label>*/}
                                    <input
                                        type="text"
                                        className="form-control form-control-lg text-center p-3 my-5"
                                        value={verificationCode}
                                        onChange={(e) => setVerificationCode(e.target.value.toUpperCase())}
                                        placeholder="Enter 6-digit code"
                                        maxLength="6"
                                        style={{ 
                                            fontSize: '18px', 
                                            fontWeight: 'bold',
                                            letterSpacing: '3px'
                                        }}
                                        required
                                    />
                                    {/*<div className="form-text text-center">
                                        <i className="fas fa-key me-1"></i>
                                        Use code: <strong>{transactionInfo.verification_code}</strong>
                                    </div>*/}
                                </div>

                                <div className="d-grid gap-2">
                                    <button 
                                        type="submit" 
                                        className="btn btn-success btn-lg py-3 mb-2"
                                        disabled={loading}
                                    >
                                        {loading ? (
                                            <>
                                                <span className="spinner-border spinner-border-sm me-2"></span>
                                                Verifying...
                                            </>
                                        ) : (
                                            <>
                                                <i className="fas fa-check-circle me-2"></i>
                                                Verify Transaction
                                            </>
                                        )}
                                    </button>
                                    
                                    <div className="d-flex gap-2">
                                        <button 
                                            type="button" 
                                            className="btn btn-outline-secondary flex-fill p-2"
                                            onClick={() => navigate('/topup')}
                                        >
                                            <i className="fas fa-arrow-left me-2"></i>
                                            Back
                                        </button>
                                        {/*<button 
                                            type="button" 
                                            className="btn btn-outline-warning flex-fill"
                                            onClick={() => setVerificationCode(transactionInfo.verification_code || '')}
                                        >
                                            <i className="fas fa-magic me-2"></i>
                                            Auto Fill
                                        </button>*/}
                                        {/*<button 
                                            type="button" 
                                            className="btn btn-outline-info flex-fill"
                                            onClick={testDirectVerification}
                                        >
                                            <i className="fas fa-vial me-2"></i>
                                            Test
                                        </button>*/}
                                    </div>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}