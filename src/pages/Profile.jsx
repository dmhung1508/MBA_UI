import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Navbar from './Navbar';
import Footer from './Footer';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faEnvelope, faIdCard } from '@fortawesome/free-solid-svg-icons';

const Profile = () => {
    const [userData, setUserData] = useState(null);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    // Define common colors
    const colors = {
        primary: '#dc2626',
        secondary: '#ff416c',
        background: '#dc2626'
    };

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const token = sessionStorage.getItem('access_token');
                const response = await axios.get('https://mba.ptit.edu.vn/users/me', {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                setUserData(response.data);
            } catch (err) {
                setError('Failed to fetch user data');
            }
        };

        fetchUserData();
    }, []);

    const handleLogout = () => {
        sessionStorage.removeItem('access_token');
        navigate('/login');
    };

    if (!userData) {
        return <div className="text-center">Loading...</div>;
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-red-100 to-pink-100" style={{ paddingTop: '100px' }}>
            <Navbar />
            
            <div className="container-fluid flex-grow-1 d-flex justify-content-center align-items-center py-5">
                <div className="card shadow" style={{
                    width: '800px',
                    border: 'none',
                    borderRadius: '15px',
                    overflow: 'hidden',
                    backgroundColor: '#ffffff'
                }}>
                    <div className="row g-0">
                        <div className="col-md-6 p-4">
                            <div className="px-4 py-3">
                                <h2 className="mb-4" style={{ fontSize: '24px', fontWeight: '500', color: colors.primary }}>
                                    Profile Information
                                </h2>
                                {error && <div className="alert alert-danger">{error}</div>}
                                
                                <div className="mb-3">
                                    <div className="input-group">
                                        <span className="input-group-text" style={{ backgroundColor: 'transparent', border: `1px solid ${colors.primary}` }}>
                                            <FontAwesomeIcon icon={faUser} style={{ color: colors.primary }} />
                                        </span>
                                        <input
                                            type="text"
                                            className="form-control"
                                            value={userData.username}
                                            readOnly
                                            style={{
                                                backgroundColor: '#ffffff',
                                                border: `1px solid ${colors.primary}`,
                                                padding: '12px 15px',
                                                borderRadius: '8px'
                                            }}
                                        />
                                    </div>
                                </div>

                                <div className="mb-3">
                                    <div className="input-group">
                                        <span className="input-group-text" style={{ backgroundColor: 'transparent', border: `1px solid ${colors.primary}` }}>
                                            <FontAwesomeIcon icon={faEnvelope} style={{ color: colors.primary }} />
                                        </span>
                                        <input
                                            type="email"
                                            className="form-control"
                                            value={userData.email}
                                            readOnly
                                            style={{
                                                backgroundColor: '#ffffff',
                                                border: `1px solid ${colors.primary}`,
                                                padding: '12px 15px',
                                                borderRadius: '8px'
                                            }}
                                        />
                                    </div>
                                </div>

                                {userData.full_name && (
                                    <div className="mb-3">
                                        <div className="input-group">
                                            <span className="input-group-text" style={{ backgroundColor: 'transparent', border: `1px solid ${colors.primary}` }}>
                                                <FontAwesomeIcon icon={faIdCard} style={{ color: colors.primary }} />
                                            </span>
                                            <input
                                                type="text"
                                                className="form-control"
                                                value={userData.full_name}
                                                readOnly
                                                style={{
                                                    backgroundColor: '#ffffff',
                                                    border: `1px solid ${colors.primary}`,
                                                    padding: '12px 15px',
                                                    borderRadius: '8px'
                                                }}
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="col-md-6 text-white d-flex align-items-center justify-content-center"
                            style={{
                                background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`,
                                padding: '40px'
                            }}>
                            <div className="text-center px-4">
                                <h1 className="mb-4"><strong>Welcome Back!</strong></h1>
                                <p className="mb-4">
                                    Here you can view and manage your profile information
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <Footer />
        </div>
    );
}

export default Profile;