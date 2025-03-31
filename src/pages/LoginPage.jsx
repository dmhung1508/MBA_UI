import React, { useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import Navbar from './Navbar';
import Footer from './Footer';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faLock } from '@fortawesome/free-solid-svg-icons';
import { useNavigate } from 'react-router-dom'; // Import for navigation

const Login = () => {
    const [username, setUsername] = useState('');  // Changed from email to username
    const [password, setPassword] = useState('');
    const [error, setError] = useState(''); // State to handle errors
    const navigate = useNavigate(); // Hook for navigation
    const [successMessage, setSuccessMessage] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(''); // Reset error state

        // Prepare data for the request
        const formData = new URLSearchParams();
        formData.append('username', username);
        formData.append('password', password);
        formData.append('grant_type', 'password'); // Although not required in your backend, some OAuth2 implementations expect this

        try {
            const response = await fetch('https://mba.ptit.edu.vn/token', { // Update with your backend URL
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: formData.toString(),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || 'Login failed');
            }

            const data = await response.json();
            const { access_token, token_type } = data;

            // Store the token (you can also use cookies or other storage methods)
            sessionStorage.setItem('access_token', access_token);
            sessionStorage.setItem('token_type', token_type);
            setSuccessMessage('User login successfully! Redirecting to home page...');
            // Optionally, redirect to a protected route
            setTimeout(() => {
                navigate('/'); // Ensure you have a route for login
            }, 2000); // Ensure this route exists in your React Router setup
        } catch (err) {
            setError(err.message);
            console.error('Login error:', err);
        }
    };

    // Define common colors
    const colors = {
        primary: '#dc2626',
        secondary: '#ff416c',
        background: '#dc2626'
    };

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
                                    Đăng nhập
                                </h2>
                                {error && <div className="alert alert-danger">{error}</div>} {/* Display error if any */}
                                {successMessage && <div className="alert alert-success" role="alert">
                                    {successMessage}
                                </div>}
                                <form onSubmit={handleSubmit}>
                                    <div className="mb-3">
                                        <div className="input-group">
                                            <span className="input-group-text" style={{ backgroundColor: 'transparent', border: `1px solid ${colors.primary}` }}>
                                                <FontAwesomeIcon icon={faUser} style={{ color: colors.primary }} />
                                            </span>
                                            <input
                                                type="text"  // Changed from email to text
                                                className="form-control"
                                                placeholder="Tên đăng nhập"  // Changed from Email to Username
                                                value={username}
                                                onChange={(e) => setUsername(e.target.value)}
                                                required
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
                                                <FontAwesomeIcon icon={faLock} style={{ color: colors.primary }} />
                                            </span>
                                            <input
                                                type="password"
                                                className="form-control"
                                                placeholder="Mật khẩu"
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                required
                                                style={{
                                                    backgroundColor: '#ffffff',
                                                    border: `1px solid ${colors.primary}`,
                                                    padding: '12px 15px',
                                                    borderRadius: '8px'
                                                }}
                                            />
                                        </div>
                                    </div>
                                    <button
                                        type="submit"
                                        className="btn w-100"
                                        style={{
                                            backgroundColor: colors.primary,
                                            color: 'white',
                                            padding: '12px',
                                            borderRadius: '25px',
                                            border: 'none',
                                            transition: 'all 0.3s ease'
                                        }}
                                        onMouseOver={(e) => e.target.style.backgroundColor = colors.secondary}
                                        onMouseOut={(e) => e.target.style.backgroundColor = colors.primary}
                                    >
                                        ĐĂNG NHẬP NGAY
                                    </button>
                                </form>
                            </div>
                        </div>

                        <div className="col-md-6 text-white d-flex align-items-center justify-content-center"
                            style={{
                                background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`,
                                padding: '40px'
                            }}>
                            <div className="text-center px-4">
                                <h1 className="mb-4"> <strong>Xin chào các bạn!</strong></h1>
                                <p className="mb-4">
                                Cung cấp thông tin cá nhân của bạn và bắt đầu hành trình với chúng tớ
                                </p>
                                <a href="/chat/signup">
                                    <button
                                        className="btn"
                                        style={{
                                            color: 'white',
                                            border: '2px solid white',
                                            borderRadius: '25px',
                                            padding: '12px 45px',
                                            backgroundColor: 'transparent',
                                            transition: 'all 0.3s ease'
                                        }}
                                        onMouseOver={(e) => {
                                            e.target.style.backgroundColor = 'white';
                                            e.target.style.color = colors.primary;
                                        }}
                                        onMouseOut={(e) => {
                                            e.target.style.backgroundColor = 'transparent';
                                            e.target.style.color = 'white';
                                        }}
                                    >
                                        Đăng ký
                                    </button>
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <Footer />
        </div>
    );
};

export default Login;
