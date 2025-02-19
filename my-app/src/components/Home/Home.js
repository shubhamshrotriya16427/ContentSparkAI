import React, { useState, useEffect } from "react";
import { Row, Col } from "antd";
import FilterForm from "../Filter/FilterForm";
import PromptPanel from "../PromptPanel/PromptPanel";
import Tutorial from "../Tutorial/Tutorial";
import AppHeader from "../Header/AppHeader";
import { useAuth } from "../Context/AuthContext";

const Home = () => {
  const [savedFilters, setSavedFilters] = useState({});
  const [isFirstTimeUser, setIsFirstTimeUser] = useState(false);
  const [tutorialStep, setTutorialStep] = useState(0);
  const [isTutorialActive, setIsTutorialActive] = useState(false);
  const [isTutorialEnabled, setIsTutorialEnabled] = useState(true);
  const { api, user } = useAuth();

  useEffect(() => {
    const checkTutorialStatus = async () => {
      if (user) {
        try {
          const response = await api.get(`/user-tutorial-status`);
          const tutorialCompleted = response.data.tutorialCompleted;
          setIsFirstTimeUser(!tutorialCompleted);
          setIsTutorialActive(!tutorialCompleted);
        } catch (error) {
          console.error("Error fetching tutorial status:", error);
        }
      }
    };

    checkTutorialStatus();

    const checkScreenSize = () => {
      setIsTutorialEnabled(window.innerWidth > 767);
    };

    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);

    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  const handleSaveFilters = async (filters) => {
    setSavedFilters((prevFilters) => ({
      ...prevFilters,
      ...filters,
    }));
  };

  const handleTutorialComplete = async () => {
    setIsFirstTimeUser(false);
    setIsTutorialActive(false);
    if (user) {
      try {
        await api.post(`/complete-tutorial`);
      } catch (error) {
        console.error("Error marking tutorial as complete:", error);
      }
    }
  };

  const handleTutorialNext = () => {
    setTutorialStep((prevStep) => prevStep + 1);
  };

  const handleTutorialPrevious = () => {
    setTutorialStep((prevStep) => Math.max(0, prevStep - 1));
  };

  return (
    <>
      <AppHeader isTutorialActive={isTutorialActive && isTutorialEnabled} />
      <Row
        gutter={16}
        style={{
          padding: "20px",
          placeItems: "flex-start",
        }}
        className="home-pg-container"
      >
        <Col span={12}>
          <FilterForm
            onSave={handleSaveFilters}
            onChange={handleSaveFilters}
            onStepComplete={handleTutorialNext}
            tutorialStep={tutorialStep}
            isTutorialActive={isTutorialActive && isTutorialEnabled}
          />
        </Col>
        <Col span={12}>
          <PromptPanel
            filters={savedFilters}
            onStepComplete={handleTutorialNext}
            tutorialStep={tutorialStep}
            isTutorialActive={isTutorialActive && isTutorialEnabled}
          />
        </Col>
      </Row>
      {isTutorialActive && isTutorialEnabled && (
        <Tutorial
          isFirstTimeUser={isFirstTimeUser}
          onComplete={handleTutorialComplete}
          onNext={handleTutorialNext}
          onPrevious={handleTutorialPrevious}
          currentStep={tutorialStep}
        />
      )}
    </>
  );
};

export default Home;
