import React, { useState, useEffect } from "react";
import { Table, Button, message, Space, Typography } from "antd";
import moment from "moment";
import {
  RedditOutlined,
  EditOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import { useAuth } from "../Context/AuthContext";
import AppHeader from "../Header/AppHeader";
import ReviewModal from "./ReviewModal";

const { Text } = Typography;

const ContentPerformance = () => {
  const [content, setContent] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isRedditLinked, setIsRedditLinked] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedContent, setSelectedContent] = useState({});
  const [lastFetchedTime, setLastFetchedTime] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [, forceUpdate] = useState();
  const { api, isLogout } = useAuth();

  const checkRedditLinkStatus = async () => {
    try {
      const response = await api.get("/check-reddit-link");
      setIsRedditLinked(response.data.isLinked);
    } catch (error) {
      console.error("Failed to check Reddit link status:", error);
    }
  };

  useEffect(() => {
    fetchContent();
    checkRedditLinkStatus();
    const fetchIntervalId = setInterval(fetchContent, 120000);
    const updateIntervalId = setInterval(() => forceUpdate({}), 60000);
    return () => {
      clearInterval(fetchIntervalId);
      clearInterval(updateIntervalId);
    };
  }, []);

  const fetchContent = async () => {
    setLoading(true);
    try {
      // Call the API to update Reddit metrics
      await api.get("/update-reddit-metrics");

      // Once metrics are updated, fetch the updated content
      const response = await api.get("/get-history");
      response.data.forEach((content) => {
        content.title = decodeHTMLEntities(content.title);
        content.response = decodeHTMLEntities(content.response);
      });
      setContent(response.data);
      setLastFetchedTime(new Date());
    } catch (error) {
      if (!isLogout) {
        message.error("Failed to fetch content");
      }
    } finally {
      setLoading(false);
    }
  };

  const decodeHTMLEntities = (str) => {
    const parser = new DOMParser();
    const decodedString = parser.parseFromString(str, "text/html")
      .documentElement.textContent;
    return decodedString;
  };

  const handleLinkReddit = async () => {
    try {
      const response = await api.get("/reddit-auth");
      window.location.href = response.data.url;
    } catch (error) {
      if (!isLogout) {
        message.error("Failed to initiate Reddit authentication");
      }
    }
  };

  const showModal = (record) => {
    console.log("Selected Record:", record);
    setSelectedContent({
      _id: record._id,
      title: record.title,
      response: record.response,
    });
    setIsModalVisible(true);
  };

  const handleModalConfirm = async (updatedTitle, updatedResponse) => {
    if (!selectedContent) return;

    const contentId = selectedContent._id;
    setIsModalVisible(false);

    console.log("Selected content:", selectedContent);
    console.log("Updating content with ID:", contentId);

    const isExistingPost = selectedContent.postId;
    console.log("Is existing post:", isExistingPost);

    try {
      let response;
      if (isExistingPost) {
        console.log("Attempting to edit existing Reddit post");
        response = await api.put(`/edit-reddit-post/${contentId}`, {
          title: updatedTitle,
          response: updatedResponse,
        });
        console.log("Edit response:", response.data);
        message.success("Reddit post updated successfully");
      } else {
        console.log("Attempting to create new Reddit post");
        response = await api.post(`/post-to-reddit/${contentId}`, {
          title: updatedTitle,
          response: updatedResponse,
        });
        console.log("Post response:", response.data);
        message.success("Content posted to Reddit successfully");
      }

      await fetchContent();
    } catch (error) {
      console.error(
        "Error updating/posting content:",
        error.response?.data || error.message
      );
      if (error.response?.status === 410) {
        fetchContent();
      }
      if (!isLogout) {
        message.error(
          error.response?.data?.message ??
            "Failed to update or post content to Reddit"
        );
      }
    }
  };

  const handleEditRedditPost = async (contentId) => {
    try {
      const contentToEdit = content.find((item) => item._id === contentId);
      setSelectedContent({
        _id: contentId,
        title: contentToEdit.title,
        response: contentToEdit.response,
        postId: contentToEdit?.redditMetrics?.postId,
      });
      setIsModalVisible(true);
      try {
        const response = await api.get(`/fetch-reddit-post/${contentId}`);
        setSelectedContent((prevContent) => ({
          ...prevContent,
          title: response.data.title,
          response: response.data.response,
        }));
        if (response.data.updatedLocally) {
          console.log("UPDATED");
          message.info(
            "The content has been updated to match the latest version on Reddit."
          );
        }
      } catch (error) {
        if (!isLogout) {
          message.error(
            error.response?.data?.message ??
              "Failed to fetch the latest content from Reddit"
          );
        }
        if (error.response?.status === 410) {
          await fetchContent();
          setIsModalVisible(false);
        }
      } finally {
        setIsLoading(false);
      }
    } catch (error) {
      if (!isLogout) {
        message.error("Failed to edit Reddit post");
      }
    }
  };

  const handleDeleteRedditPost = async (contentId) => {
    try {
      await api.delete(`/delete-reddit-post/${contentId}`);
      message.success("Post deleted from Reddit successfully");
      fetchContent();
    } catch (error) {
      if (error.response?.status === 410) {
        fetchContent();
      }
      if (!isLogout) {
        message.error(error.response?.data?.message);
      }
    }
  };

  const handleModalCancel = () => {
    setIsModalVisible(false);
  };

  const renderValue = (value) => value || "—";
  const renderValueNumber = (value) => value || 0;

  const columns = [
    {
      title: "Title",
      dataIndex: "title",
      key: "title",
      fixed: "left",
      sorter: (a, b) => a.title.localeCompare(b.title),
      render: renderValue,
    },
    {
      title: "Created At",
      dataIndex: "createdAt",
      key: "createdAt",
      sorter: (a, b) => moment(a.createdAt).unix() - moment(b.createdAt).unix(),
      render: (value) =>
        value ? moment(value).format("YYYY-MM-DD HH:mm:ss") : "—",
    },
    {
      title: "Updated on Reddit", // New column for lastUpdated
      dataIndex: ["redditMetrics", "lastUpdated"],
      key: "lastUpdated",
      sorter: (a, b) =>
        moment(a.redditMetrics?.lastUpdated).unix() -
        moment(b.redditMetrics?.lastUpdated).unix(),
      render: (value) =>
        value ? moment(value).format("YYYY-MM-DD HH:mm:ss") : "—",
    },
    {
      title: "Upvotes",
      dataIndex: ["redditMetrics", "upvotes"],
      key: "upvotes",
      sorter: (a, b) =>
        (a.redditMetrics?.upvotes || 0) - (b.redditMetrics?.upvotes || 0),
      render: renderValueNumber,
    },
    {
      title: "Comments",
      dataIndex: ["redditMetrics", "comments"],
      key: "comments",
      sorter: (a, b) =>
        (a.redditMetrics?.comments || 0) - (b.redditMetrics?.comments || 0),
      render: renderValueNumber,
    },
    {
      title: "Content Type",
      dataIndex: ["filters", "contentType"],
      key: "contentType",
      sorter: (a, b) =>
        (a.filters?.contentType || "").localeCompare(
          b.filters?.contentType || ""
        ),
      render: renderValue,
    },
    {
      title: "Industry",
      dataIndex: ["filters", "industry"],
      key: "industry",
      sorter: (a, b) =>
        (a.filters?.industry || "").localeCompare(b.filters?.industry || ""),
      render: renderValue,
    },
    {
      title: "Age Range",
      dataIndex: ["filters", "ageRange"],
      key: "ageRange",
      sorter: (a, b) =>
        (a.filters?.ageRange || "").localeCompare(b.filters?.ageRange || ""),
      render: renderValue,
    },
    {
      title: "Interests",
      dataIndex: ["filters", "interests"],
      key: "interests",
      sorter: (a, b) =>
        (a.filters?.interests || [])
          .join(",")
          .localeCompare((b.filters?.interests || []).join(",")),
      render: (interests) =>
        interests.length > 0 ? interests.join(", ") : "—",
    },
    {
      title: "Gender",
      dataIndex: ["filters", "gender"],
      key: "gender",
      sorter: (a, b) =>
        (a.filters?.gender || "").localeCompare(b.filters?.gender || ""),
      render: renderValue,
    },
    {
      title: "Income Level",
      dataIndex: ["filters", "incomeLevel"],
      key: "incomeLevel",
      sorter: (a, b) =>
        (a.filters?.incomeLevel || "").localeCompare(
          b.filters?.incomeLevel || ""
        ),
      render: renderValue,
    },
    {
      title: "Tone",
      dataIndex: ["filters", "tone"],
      key: "tone",
      sorter: (a, b) =>
        (a.filters?.tone || "").localeCompare(b.filters?.tone || ""),
      render: renderValue,
    },
    {
      title: "Themes",
      dataIndex: ["filters", "themes"],
      key: "themes",
      sorter: (a, b) =>
        (a.filters?.themes || [])
          .join(",")
          .localeCompare((b.filters?.themes || []).join(",")),
      render: (themes) => (themes.length > 0 ? themes.join(", ") : "—"),
    },
    {
      title: "Content Goal",
      dataIndex: ["filters", "contentGoal"],
      key: "contentGoal",
      sorter: (a, b) =>
        (a.filters?.contentGoal || "").localeCompare(
          b.filters?.contentGoal || ""
        ),
      render: renderValue,
    },
    {
      title: "Max Content Length",
      dataIndex: ["filters", "maxContentLength"],
      key: "maxContentLength",
      sorter: (a, b) =>
        (a.filters?.maxContentLength || "").localeCompare(
          b.filters?.maxContentLength || ""
        ),
      render: renderValue,
    },
    {
      title: "Language",
      dataIndex: ["filters", "language"],
      key: "language",
      sorter: (a, b) =>
        (a.filters?.language || "").localeCompare(
          b.filters?.language || "English (en)"
        ),
      render: renderValue,
    },
    {
      title: "Action",
      key: "action",
      fixed: "right",
      render: (_, record) => (
        <Space>
          {record.redditMetrics?.postId ? (
            <>
              <Button
                type="primary"
                icon={<EditOutlined />}
                onClick={() => handleEditRedditPost(record._id)}
                disabled={!isRedditLinked}
              >
                Edit
              </Button>
              <Button
                type="primary"
                icon={<DeleteOutlined />}
                danger
                onClick={() => handleDeleteRedditPost(record._id)}
                disabled={!isRedditLinked}
              >
                Delete
              </Button>
            </>
          ) : (
            <Button
              onClick={() => showModal(record)}
              type="primary"
              disabled={!isRedditLinked}
            >
              Post to Reddit
            </Button>
          )}
        </Space>
      ),
    },
  ];

  const getLastFetchedText = () => {
    if (!lastFetchedTime) return "Never";
    const now = new Date();
    const diffInSeconds = Math.floor((now - lastFetchedTime) / 1000);

    if (diffInSeconds >= 60 && diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes} minute${minutes !== 1 ? "s" : ""} ago`;
    } else {
      return moment(lastFetchedTime).fromNow();
    }
  };

  return (
    <>
      <AppHeader />
      <div style={{ padding: "24px" }}>
        <Space style={{ marginBottom: "20px", flexWrap: "wrap" }}>
          <Button
            type="primary"
            icon={<RedditOutlined />}
            onClick={handleLinkReddit}
            style={{
              backgroundColor: "#FF4500",
              borderColor: "#FF4500",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: "5px",
            }}
            disabled={isRedditLinked}
          >
            Link Reddit Account
          </Button>
          <Text>Last fetched: {getLastFetchedText()}</Text>
        </Space>
        <Table
          columns={columns}
          dataSource={content}
          loading={loading}
          rowKey="_id"
          scroll={{ x: "max-content" }}
        />
      </div>

      <ReviewModal
        visible={isModalVisible}
        title={selectedContent.title}
        response={selectedContent.response}
        onConfirm={handleModalConfirm}
        onCancel={handleModalCancel}
        isExistingPost={!!selectedContent?.postId}
        loading={isLoading}
      />
    </>
  );
};

export default ContentPerformance;
