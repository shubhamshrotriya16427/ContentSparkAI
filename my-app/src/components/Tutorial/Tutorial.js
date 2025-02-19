import React, { useState, useEffect, useRef } from "react";
import { Button } from "antd";

const Tutorial = ({
  isFirstTimeUser,
  onComplete,
  currentStep,
  onNext,
  onPrevious,
}) => {
  const [visible, setVisible] = useState(isFirstTimeUser);
  const popupRef = useRef(null);

  const steps = [
    {
      target: '[data-tutorial="content-type"]',
      content:
        "Let's get started! First, click on the <b>'Type of Content'</b> dropdown and select the kind of content you want to create. This could be a blog post, ad campaign, social media post, or others.",
      position: "right",
    },
    {
      target: '[data-tutorial="industry"]',
      content:
        "Great! Now, let's specify your target industry. Click on the 'Industry/Category' dropdown and choose the most relevant option for your content. This helps tailor the output to your specific field.",
      position: "right",
    },
    {
      target: '[data-tutorial="prompt"]',
      content:
        "Perfect! Now it's time to add some details. In the text box, type any specific instructions or information you want to include in your content. Be as detailed as you like - the more information you provide, the better the results! Click on <b>'Generate Content'</b> after typing.",
      position: "left",
    },
    {
      target: '[data-tutorial="generate"]',
      content:
        "You're all set! Click the <b>'Generate Content'</b> button to create your AI-powered content based on your selections and input. Get ready to see the magic happen!",
      position: "left",
    },
    {
      target: '[data-tutorial="mark-favourite"]',
      content:
        "Great job! Your content has been generated. Take a look at the result. If you're happy with it, you can click the <b>'Save content to favourite'</b> button to save it for future reference.",
      position: "left",
      additionalHighlight: '[data-tutorial="generated-content"]',
    },
    {
      target: '[data-tutorial="save-filters"]',
      content:
        "If you want to save your current filter settings for future use, click the <b>'Save Filters'</b> button. This will store your preferences, making it easier to generate similar content in the future.",
      position: "right",
    },
    {
      target: '[data-tutorial="history-tab"]',
      content:
        "The <b>History</b> tab keeps track of all the content you've generated. Click on it to view your past creations and potentially reuse or modify them.",
      position: "bottom",
    },
    {
      target: '[data-tutorial="favourites-tab"]',
      content:
        "The <b>Favourites</b> tab is where you can find all the content you've marked as favourite. It's a great way to keep your best creations easily accessible.",
      position: "bottom",
    },
    {
      target: '[data-tutorial="cms-tab"]',
      content:
        "The <b>Content Performance</b> tab is where you can find all the content the you can post on social media. It's a great way to monitor what's working out by measuring likes/comments etc.",
      position: "bottom",
    },
  ];

  useEffect(() => {
    if (visible && currentStep < steps.length) {
      const targetElement = document.querySelector(steps[currentStep].target);
      if (targetElement) {
        targetElement.scrollIntoView({ behavior: "smooth", block: "center" });
        highlightElement(targetElement);
        if (steps[currentStep].additionalHighlight) {
          const additionalElement = document.querySelector(
            steps[currentStep].additionalHighlight
          );
          if (additionalElement) {
            highlightElement(additionalElement);
          }
        }
        positionPopup(targetElement, steps[currentStep].position);
      }
    }
    return () => {
      unhighlightAllElements();
    };
  }, [visible, currentStep]);

  useEffect(() => {
    if (currentStep >= steps.length) {
      setVisible(false);
      onComplete();
    }
  }, [currentStep, onComplete]);

  const highlightElement = (element) => {
    element.style.boxShadow = "0 0 0 5px rgba(24, 144, 255, 0.7)";
    element.style.zIndex = "1001";
    element.style.position = "relative";
    element.style.pointerEvents = "auto";
  };

  const unhighlightElement = (element) => {
    element.style.boxShadow = "";
    element.style.zIndex = "";
    element.style.position = "";
    element.style.pointerEvents = "";
  };

  const unhighlightAllElements = () => {
    steps.forEach((step) => {
      const el = document.querySelector(step.target);
      if (el) unhighlightElement(el);
      if (step.additionalHighlight) {
        const additionalEl = document.querySelector(step.additionalHighlight);
        if (additionalEl) unhighlightElement(additionalEl);
      }
    });
  };

  const positionPopup = (targetElement, position) => {
    if (popupRef.current && targetElement) {
      const rect = targetElement.getBoundingClientRect();
      const popupRect = popupRef.current.getBoundingClientRect();

      switch (position) {
        case "right":
          popupRef.current.style.left = `${rect.right + 20}px`;
          popupRef.current.style.top = `${
            rect.top + rect.height / 2 - popupRect.height / 2
          }px`;
          break;
        case "left":
          popupRef.current.style.left = `${rect.left - popupRect.width - 20}px`;
          popupRef.current.style.top = `${
            rect.top + rect.height / 2 - popupRect.height / 2
          }px`;
          break;
        case "bottom":
          popupRef.current.style.left = `${
            rect.left + rect.width / 2 - popupRect.width / 2
          }px`;
          popupRef.current.style.top = `${rect.bottom + 20}px`;
          break;
        default:
          break;
      }
    }
  };

  const handleSkip = () => {
    setVisible(false);
    unhighlightAllElements();
    onComplete();
  };

  const handleNext = () => {
    const currentElement = document.querySelector(steps[currentStep].target);
    if (currentElement) unhighlightElement(currentElement);
    if (steps[currentStep].additionalHighlight) {
      const additionalElement = document.querySelector(
        steps[currentStep].additionalHighlight
      );
      if (additionalElement) unhighlightElement(additionalElement);
    }

    if (currentStep === steps.length - 1) {
      handleSkip();
    } else {
      onNext();
    }
  };

  const handlePrevious = () => {
    const currentElement = document.querySelector(steps[currentStep].target);
    if (currentElement) unhighlightElement(currentElement);
    if (steps[currentStep].additionalHighlight) {
      const additionalElement = document.querySelector(
        steps[currentStep].additionalHighlight
      );
      if (additionalElement) unhighlightElement(additionalElement);
    }

    onPrevious();
  };

  if (!visible) return null;

  return (
    <div className="tutorial-overlay">
      <div className="main-overlay"></div>
      <div
        ref={popupRef}
        className={`tutorial-content ${steps[currentStep].position}`}
      >
        <h3>
          Step {currentStep + 1} of {steps.length}
        </h3>
        <p
          dangerouslySetInnerHTML={{ __html: steps[currentStep]?.content }}
        ></p>
        <div className="tutorial-buttons">
          {currentStep > 0 && (
            <Button
              type="primary"
              onClick={handlePrevious}
              style={{ marginRight: "10px" }}
            >
              Previous
            </Button>
          )}
          {currentStep < 8 && (
            <Button
              type="primary"
              onClick={handleSkip}
              style={{ marginRight: "10px" }}
            >
              Skip Tutorial
            </Button>
          )}
          {currentStep >= 4 && (
            <Button type="primary" onClick={handleNext}>
              {currentStep === steps.length - 1 ? "Done" : "Next"}
            </Button>
          )}
        </div>
      </div>
      <style jsx>{`
        .tutorial-overlay .main-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: 1000;
          background-color: rgba(0, 0, 0, 0.5);
          pointer-events: auto;
        }
        .tutorial-content {
          background-color: white;
          color: black;
          padding: 20px;
          border-radius: 8px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          max-width: 400px;
          pointer-events: auto;
          z-index: 9999;
          position: fixed;
        }
        .tutorial-content::before {
          content: "";
          position: absolute;
          top: 50%;
          border: solid transparent;
          height: 0;
          width: 0;
          border-width: 10px;
          margin-top: -10px;
        }
        .tutorial-content.right::before {
          right: 100%;
          border-right-color: white;
        }
        .tutorial-content.left::before {
          left: 100%;
          border-left-color: white;
        }
        .tutorial-content.bottom::before {
          bottom: 100%;
          left: 50%;
          margin-left: -10px;
          border-bottom-color: white;
          top: 0;
          margin-top: -20px;
        }
      `}</style>
    </div>
  );
};

export default Tutorial;
