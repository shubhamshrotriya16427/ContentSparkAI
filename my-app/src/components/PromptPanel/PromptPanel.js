import React, { useState, useEffect } from "react";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { Button, Input, Card, Space, message, Select } from "antd";
import { useAuth } from "../Context/AuthContext";
import DynamicResponse from "../DynamicResponse/DynamicResponse";

const { TextArea } = Input;
const { Option } = Select;

const genAI = new GoogleGenerativeAI(process.env.REACT_APP_GOOGLE_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

const PromptPanel = ({
  filters,
  onStepComplete,
  tutorialStep,
  isTutorialActive,
}) => {
  const [prompt, setPrompt] = useState("");
  const [response, setResponse] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [previousContent, setPreviousContent] = useState([]);
  const [selectedContentIds, setSelectedContentIds] = useState([]);
  const [lastGeneratedContentId, setLastGeneratedContentId] = useState(null);
  const { api, isLogout } = useAuth();

  useEffect(() => {
    fetchPreviousContent();
  }, []);

  const fetchPreviousContent = async () => {
    try {
      const response = await api.get("/get-history");
      setPreviousContent(response.data);
    } catch (error) {
      if (!isLogout) {
        message.error("Failed to fetch previous content");
      }
    }
  };

  const generateTitle = async (prompt, response) => {
    const titlePrompt = `
      Given the following content, generate a concise and relevant title (max 5 words):
      
      Prompt: ${prompt}
      
      Response: ${response}
      
      Please focus solely on generating the requested content without any additional explanations or meta-commentary.
    `;

    try {
      const result = await model.generateContent(titlePrompt);
      const title = result.response.text().trim();
      return title.length > 200 ? title.substring(0, 200) : title;
    } catch (error) {
      console.error("Error generating title:", error);
      return "Untitled Content";
    }
  };

  const constructPrompt = (
    userPrompt,
    selectedFilters,
    selectedPreviousContent
  ) => {
    if (!(selectedFilters.contentType && selectedFilters.industry)) {
      if (!isLogout) {
        message.error("Select both content Type and Industry from filters");
      }
      return;
    }
    let fullPrompt = `
      You are an expert content creator specializing in ${
        selectedFilters.contentType || "various types of content"
      }.
      Task: Create content based on the following prompt: "${
        userPrompt || "check below description"
      }"
      Context: The content is for the ${
        selectedFilters.industry || "general"
      } industry, 
               targeting ${
                 selectedFilters.ageRange
                   ? `${selectedFilters.ageRange} years old`
                   : "all age groups"
               }
               with interests in ${
                 selectedFilters.interests
                   ? selectedFilters.interests.join(", ")
                   : "various topics"
               }.
      Additional details: We are targeting ${
        selectedFilters.contentType || "content"
      } for ${selectedFilters.gender || "all"} gender, ${
      selectedFilters.incomeLevel || "all"
    } income levels. Tone of the post should be ${
      selectedFilters.tone || "relevant to our requirement"
    }. Theme of our post should resemble ${
      selectedFilters.themes
        ? selectedFilters.themes.join(", ")
        : selectedFilters.industry
    }. Goal of this ${selectedFilters.contentType || ""} content will be ${
      selectedFilters.contentGoal || "as per our requirement"
    }. You response should be of ${
      selectedFilters.maxContentLength || "any"
    } length and of ${selectedFilters.language || "English"} language.
    `;

    if (selectedPreviousContent.length > 0) {
      fullPrompt += `
      Previous content to build upon:
      ${selectedPreviousContent
        .map(
          (content, index) => `
      ${index + 1}. Previous prompt: ${content.prompt}
         Previous response: ${content.response}
      `
        )
        .join("\n")}
      
      Please create new content that builds upon and evolves from these previous pieces while incorporating the new prompt and context. Ensure that the new content is cohesive and doesn't simply repeat the previous content.
      `;
    }

    fullPrompt += `
      Format: Provide the content in a clear, structured manner suitable for ${
        selectedFilters.contentType || "general use"
      }.
      
      Please focus solely on generating the requested content without any additional explanations or meta-commentary.
    `;
    console.log(fullPrompt);
    return fullPrompt;
  };

  const handleSubmit = async () => {
    setIsGenerating(true);
    try {
      const selectedFilters = Object.fromEntries(
        Object.entries(filters).filter(
          ([_, value]) => value !== undefined && value !== ""
        )
      );

      const selectedPreviousContent = previousContent.filter((content) =>
        selectedContentIds.includes(content._id)
      );

      const fullPrompt = constructPrompt(
        prompt,
        selectedFilters,
        selectedPreviousContent
      );
      if (fullPrompt) {
        const start = performance.now();
        const result = await model.generateContent(fullPrompt);
        console.log("API time: " + (performance.now() - start) / 1000);
        const generatedText = result.response.text();
        setResponse(generatedText);
        const title = await generateTitle(prompt, generatedText);
        const savedContent = await api.post("/save-content", {
          filters: selectedFilters,
          prompt,
          response: generatedText,
          title,
        });

        setLastGeneratedContentId(savedContent.data._id);
        fetchPreviousContent(); // Refresh the content list
        if (isTutorialActive) {
          onStepComplete();
        }
      }
    } catch (error) {
      if (!isLogout) {
        message.error(error.response?.data?.message ?? "An error occurred");
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveAsFavourite = async () => {
    setIsSaving(true);
    try {
      const result = await api.post(`/set-favorite/${lastGeneratedContentId}`);
      message.success(result.data.message);
      fetchPreviousContent();
    } catch (error) {
      if (!isLogout) {
        message.error(
          error.response?.data?.message ?? "Failed to save as favourite"
        );
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handlePromptChange = (e) => {
    setPrompt(e.target.value);
  };

  const handlePromptBlur = () => {
    if (isTutorialActive && tutorialStep === 2 && prompt.trim() !== "") {
      onStepComplete();
    }
  };

  const handleContentSelect = (value) => {
    setSelectedContentIds(value);
  };

  return (
    <Card title="Content Generator">
      <Select
        mode="multiple"
        style={{ width: "100%", marginBottom: "16px" }}
        placeholder="Select previous content to build upon"
        onChange={handleContentSelect}
        optionFilterProp="children"
        data-tutorial="previous-content"
      >
        {previousContent.map((content) => (
          <Option key={content?.title} value={content?._id}>
            {content?.title?.substring(0, 200)}
          </Option>
        ))}
      </Select>
      <TextArea
        rows={4}
        value={prompt}
        onChange={handlePromptChange}
        onBlur={handlePromptBlur}
        placeholder="Additional details you would like to add..."
        style={{
          resize: "none",
          border: "1px solid #424242",
          background: "#141414",
          color: "rgba(255, 255, 255, 0.85)",
          borderRadius: "6px",
        }}
        data-tutorial="prompt"
        disabled={isTutorialActive && tutorialStep !== 2}
      />
      <Space style={{ marginTop: "16px" }} className="prmptbtn">
        <Button
          type="primary"
          onClick={handleSubmit}
          loading={isGenerating}
          data-tutorial="generate"
          disabled={(isTutorialActive && tutorialStep !== 3) || !prompt}
        >
          Generate Content
        </Button>
        <Button
          type="primary"
          onClick={handleSaveAsFavourite}
          loading={isSaving}
          disabled={!(response && !isGenerating) || !prompt}
          data-tutorial="mark-favourite"
        >
          Save Content to Favourites
        </Button>
      </Space>
      {response && (
        <div
          style={{
            maxHeight: "calc(100vh - 104px - 270px)",
            overflow: "auto",
            marginTop: "16px",
          }}
          data-tutorial="generated-content"
        >
          <h3>Generated Content:</h3>
          <DynamicResponse content={response} />
        </div>
      )}
    </Card>
  );
};

export default PromptPanel;
