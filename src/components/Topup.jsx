import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import './css/Topup.css';

export default function Topup() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        amount: '',
        payment_method: '',
        mobile_number: '',
        pin: ''
    });
    const [loading, setLoading] = useState(false);
    const [showPaymentDetails, setShowPaymentDetails] = useState(false);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value
        });

        // Payment method select করলে details show করবে
        if (name === 'payment_method' && value) {
            setShowPaymentDetails(true);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const response = await api.post('/initiate-topup', formData);
            if (response.data.success) {
                const transactionId = response.data.data.transaction_id;
                // Verification page এ redirect করবে
                navigate('/verify-transaction', { 
                    state: { 
                        generated_transaction_id: response.data.data.transaction_id,
                        amount: formData.amount,
                        payment_method: formData.payment_method,
                        verification_code: response.data.data.verification_code
                    } 
                });
            }
        } catch (error) {
            alert(error.response?.data?.message || 'Transaction failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container py-5">
            <div className="row justify-content-center">
                <div className="col-md-6">
                    <div className="card shadow">
                        <div className="card-header bg-primary">
                            <h4 className="mb-0">
                                {/*<i className="fas fa-wallet me-2"></i>*/}
                                Add Money to Wallet
                            </h4>
                        </div>
                        
                        <div className="card-body">
                            <form onSubmit={handleSubmit}>
                                {/* Amount Input */}
                                <div className="form-group mb-4">
                                    {/*<label className="form-label">Amount (BDT)</label>*/}
                                    <input
                                        type="number"
                                        className="form-control"
                                        name="amount"
                                        value={formData.amount}
                                        onChange={handleInputChange}
                                        min="1000"
                                        max="50000"
                                        placeholder="Enter amount"
                                        required
                                    />
                                    <div className="amount-info">
                                        Enter amount between BDT <span>৳1,000</span> to <span>৳50,000</span>
                                    </div>
                                </div>

                                {/* Payment Method Selection - Simple Radio Style */}
                                <div className="form-group mb-5">
                                    <label className="form-label">Select Payment Method</label>
                                    
                                    <div className="payment-method-options">
                                        <div className="payment-method">
                                            <input 
                                                type="radio" 
                                                id="bkash" 
                                                name="payment_method" 
                                                value="bkash"
                                                onChange={handleInputChange}
                                                required
                                            />
                                            <label htmlFor="bkash" className="payment-label">
                                                <span>bKash</span>
                                            </label>
                                        </div>
                                        
                                        <div className="payment-method">
                                            <input 
                                                type="radio" 
                                                id="nagad" 
                                                name="payment_method" 
                                                value="nagad"
                                                onChange={handleInputChange}
                                            />
                                            <label htmlFor="nagad" className="payment-label">
                                                <span>Nagad</span>
                                            </label>
                                        </div>
                                        
                                        <div className="payment-method">
                                            <input 
                                                type="radio" 
                                                id="rocket" 
                                                name="payment_method" 
                                                value="rocket"
                                                onChange={handleInputChange}
                                            />
                                            <label htmlFor="rocket" className="payment-label">
                                                <span>Rocket</span>
                                            </label>
                                        </div>
                                    </div>
                                </div>

                                {/* Payment Details - Show when method selected */}
                                {showPaymentDetails && (
                                    <div className="payment-details mb-3">
                                        <div className="form-group">
                                            {/*<label className="form-label">Mobile Number</label>*/}
                                            <input
                                                type="text"
                                                className="form-control"
                                                name="mobile_number"
                                                value={formData.mobile_number}
                                                onChange={handleInputChange}
                                                placeholder="01XXXXXXXXX"
                                                pattern="[0-9]{11}"
                                                required
                                            />
                                        </div>
                                        
                                        <div className="form-group">
                                            {/*<label className="form-label">PIN</label>*/}
                                            <input
                                                type="password"
                                                className="form-control"
                                                name="pin"
                                                value={formData.pin}
                                                onChange={handleInputChange}
                                                placeholder="Enter your PIN"
                                                maxLength="5"
                                                required
                                            />
                                        </div>
                                    </div>
                                )}

                                <button 
                                    type="submit" 
                                    className="btn btn-primary"
                                    disabled={loading || !showPaymentDetails}
                                >
                                    {loading ? (
                                        <>
                                            <span className="spinner-border spinner-border-sm me-2"></span>
                                            Processing...
                                        </>
                                    ) : (
                                        'Request Add Money'
                                    )}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}