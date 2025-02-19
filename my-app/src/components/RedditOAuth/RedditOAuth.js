import React, { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { message, Spin } from "antd";
import { useAuth } from "../Context/AuthContext";

const RedditOAuth = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { api, isLogout } = useAuth();

  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const code = urlParams.get("code");
    const error = urlParams.get("error");

    const exchangeCodeForToken = async (code) => {
      const processedKey = `reddit_oauth_processed_${code}`;
      if (localStorage.getItem(processedKey)) {
        console.log("Already processed this code, skipping");
        navigate("/cms");
        return;
      }

      localStorage.setItem(processedKey, "true");
      console.log("Processing code:", code);

      try {
        const response = await api.post("/reddit-callback", { code });
        console.log("Received response:", response.data);

        if (response.data.success) {
          message.success(response.data.message);
        } else {
          throw new Error(
            response.data.error || "Failed to link Reddit account"
          );
        }
      } catch (error) {
        console.error("Error linking Reddit account:", error);
        if (!isLogout) {
          message.error(
            error.response?.data?.error ||
              error.message ||
              "An error occurred while linking Reddit account"
          );
        }
      } finally {
        localStorage.removeItem(processedKey);
        navigate("/cms");
      }
    };

    if (code) {
      exchangeCodeForToken(code);
    } else if (error) {
      console.log("Received error from Reddit:", error);
      if (!isLogout) {
        message.error("Reddit authorization failed: " + error);
      }
      navigate("/cms");
    } else {
      console.log("No authorization code received");
      if (!isLogout) {
        message.error("No authorization code received");
      }
      navigate("/cms");
    }
  }, [location, api, navigate]);

  return <Spin tip="Linking your Reddit account..." />;
};

export default RedditOAuth;
