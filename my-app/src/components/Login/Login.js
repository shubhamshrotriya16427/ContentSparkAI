import React from "react";
import { message } from "antd";
import { GoogleLogin } from "@react-oauth/google";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../Context/AuthContext";
import logo from "../../assets/logo.jpeg";

const Login = () => {
  const navigate = useNavigate();
  const { login, logout } = useAuth();

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      await login(credentialResponse.credential);
      navigate("/home");
    } catch (error) {
      handleGoogleFailure(error);
    }
  };

  const handleGoogleFailure = (error) => {
    message.error(error.response?.data?.message ?? "Google Login Failed");
    logout();
  };

  return (
    <div className="login-container">
      <div className="signin-box">
        <img src={logo} alt="ContentSparkAI Logo" />
        <div className="social-signin">
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={handleGoogleFailure}
          />
        </div>
      </div>
    </div>
  );
};

export default Login;