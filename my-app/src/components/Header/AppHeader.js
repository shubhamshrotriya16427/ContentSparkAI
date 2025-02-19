import React, { useState, useEffect } from "react";
import { Layout, Menu, Button, Drawer } from "antd";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  HomeOutlined,
  HistoryOutlined,
  StarOutlined,
  LogoutOutlined,
  BarChartOutlined,
  MenuOutlined,
} from "@ant-design/icons";
import { useAuth } from "../Context/AuthContext";

const { Header } = Layout;

const AppHeader = ({ isTutorialActive = false }) => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [visible, setVisible] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 767);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 767);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleLogout = () => {
    logout();
  };

  const menuItemStyle = {
    cursor: isTutorialActive ? "not-allowed" : "pointer",
    opacity: isTutorialActive ? 0.5 : 1,
  };

  const menuItems = [
    { key: "/home", icon: <HomeOutlined />, text: "Home" },
    {
      key: "/history",
      icon: <HistoryOutlined />,
      text: "History",
      dataTutorial: "history-tab",
    },
    {
      key: "/favourites",
      icon: <StarOutlined />,
      text: "Favourites",
      dataTutorial: "favourites-tab",
    },
    {
      key: "/cms",
      icon: <BarChartOutlined />,
      text: "Content Performance",
      dataTutorial: "cms-tab",
    },
  ];

  const renderMenuItems = () => (
    <>
      {menuItems.map((item) => (
        <Menu.Item
          key={item.key}
          icon={item.icon}
          style={menuItemStyle}
          data-tutorial={item.dataTutorial}
        >
          {isTutorialActive ? (
            <span>{item.text}</span>
          ) : (
            <Link to={item.key}>{item.text}</Link>
          )}
        </Menu.Item>
      ))}
    </>
  );

  return (
    <Header
      className="header"
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: isMobile ? "0 16px" : "0 50px",
      }}
    >
      <div style={{ display: "flex", alignItems: "center" }}>
        <div className="logo" />
        {isMobile ? (
          <Button icon={<MenuOutlined />} onClick={() => setVisible(true)} />
        ) : (
          <Menu
            theme="dark"
            mode="horizontal"
            selectedKeys={[location.pathname]}
            style={{ flexGrow: 1 }}
          >
            {renderMenuItems()}
          </Menu>
        )}
      </div>
      {!isMobile && (
        <Button
          type="primary"
          icon={<LogoutOutlined />}
          onClick={handleLogout}
          disabled={isTutorialActive}
        >
          Logout
        </Button>
      )}
      <Drawer
        title="Menu"
        placement="left"
        onClose={() => setVisible(false)}
        visible={visible}
        bodyStyle={{ padding: 0 }}
      >
        <Menu
          theme="light"
          mode="vertical"
          selectedKeys={[location.pathname]}
          onClick={() => setVisible(false)}
        >
          {renderMenuItems()}
          <Menu.Item
            key="logout"
            icon={<LogoutOutlined />}
            onClick={handleLogout}
          >
            Logout
          </Menu.Item>
        </Menu>
      </Drawer>
      <style jsx>{`
        @media (max-width: 767px) {
          .ant-menu-overflow {
            display: none;
          }
          .header {
            padding: 0 16px;
          }
        }
      `}</style>
    </Header>
  );
};

export default AppHeader;
