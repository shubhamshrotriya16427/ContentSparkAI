import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { ConfigProvider, Layout, theme, Spin } from "antd";
import Home from "./components/Home/Home";
import Login from "./components/Login/Login";
import History from "./components/History/History";
import Favourites from "./components/Favourites/Favourites";
import ContentPerformance from "./components/ContentPerformance/ContentPerformance";
import RedditOAuth from "./components/RedditOAuth/RedditOAuth";
import { AuthProvider, useAuth } from "./components/Context/AuthContext";
import { FilterProvider } from "./components/Context/FilterContext";
import "./App.css";

const { Content } = Layout;
const { darkAlgorithm } = theme;
const googleClientId = process.env.REACT_APP_GOOGLE_OAUTH_CLIENT_ID;

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
        <Spin size="large" />
      </div>
    );
  }

  return isAuthenticated ? children : <Navigate to="/" replace />;
};

function AppRoutes() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
        <Spin size="large" />
      </div>
    );
  }

  return (
    <Routes>
      <Route
        path="/"
        element={isAuthenticated ? <Navigate to="/home" replace /> : <Login />}
      />
      <Route
        path="/home"
        element={
          <ProtectedRoute>
            <Home />
          </ProtectedRoute>
        }
      />
      <Route
        path="/history"
        element={
          <ProtectedRoute>
            <History />
          </ProtectedRoute>
        }
      />
      <Route
        path="/favourites"
        element={
          <ProtectedRoute>
            <Favourites />
          </ProtectedRoute>
        }
      />
      <Route
        path="/cms"
        element={
          <ProtectedRoute>
            <ContentPerformance />
          </ProtectedRoute>
        }
      />
      <Route
        path="/reddit-callback"
        element={
          <ProtectedRoute>
            <RedditOAuth />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <div className="App">
      <GoogleOAuthProvider clientId={googleClientId}>
        <Router>
          <AuthProvider>
            <FilterProvider>
              <ConfigProvider theme={{ algorithm: darkAlgorithm }}>
                <Layout className="layout">
                  <Content>
                    <AppRoutes />
                  </Content>
                </Layout>
              </ConfigProvider>
            </FilterProvider>
          </AuthProvider>
        </Router>
      </GoogleOAuthProvider>
    </div>
  );
}

export default App;
