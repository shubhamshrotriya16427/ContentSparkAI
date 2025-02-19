import React, { useEffect, useState, useCallback, useMemo } from "react";
import {
  Card,
  Typography,
  Button,
  Modal,
  Table,
  Space,
  Input,
  Select,
  Tag,
  message,
  Empty,
} from "antd";
import { DeleteOutlined, StarOutlined } from "@ant-design/icons";
import { FixedSizeList as List } from "react-window";
import DynamicResponse from "../DynamicResponse/DynamicResponse";
import { useAuth } from "../Context/AuthContext";
import AppHeader from "../Header/AppHeader";

const { Paragraph, Text, Title } = Typography;
const { Search } = Input;
const { Option } = Select;

const History = () => {
  const [history, setHistory] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOrder, setSortOrder] = useState("newest");
  const { api, isLogout } = useAuth();

  const fetchHistory = useCallback(async () => {
    try {
      const response = await api.get("/get-history");
      setHistory(response.data);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  }, [api]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const handleDelete = async (id) => {
    try {
      const response = await api.delete(`/delete-content/${id}`);
      message.success(response.data.message);
      fetchHistory();
    } catch (error) {
      console.error("Error deleting item:", error);
      if (!isLogout) {
        message.error(error.response?.data?.message ?? "Deletion failed");
      }
    }
  };

  const handleFavorite = async (id) => {
    try {
      const response = await api.post(`/set-favorite/${id}`);
      message.success(response.data.message);
      setHistory((prevHistory) =>
        prevHistory.map((item) =>
          item._id === id ? { ...item, isFavourite: !item.isFavourite } : item
        )
      );
    } catch (error) {
      console.error("Error marking item:", error);
      if (!isLogout) {
        message.error(error.response?.data?.message ?? "Marking failed");
      }
    }
  };

  const showModal = (item) => {
    setSelectedItem(item);
    setIsModalVisible(true);
  };

  const handleModalClose = () => {
    setIsModalVisible(false);
    setSelectedItem(null);
  };

  const columns = [
    {
      title: "Filter Name",
      dataIndex: "key",
      key: "key",
      render: (text) => <Text strong>{text}</Text>,
    },
    {
      title: "Filter Value",
      dataIndex: "value",
      key: "value",
      render: (value) => {
        if (Array.isArray(value)) {
          return (
            <Space wrap>
              {value.map((item, index) => (
                <Tag key={index} color="blue">
                  {item}
                </Tag>
              ))}
            </Space>
          );
        }
        return value;
      },
    },
  ];

  const formatFilterValue = (value) => {
    if (Array.isArray(value)) {
      return value;
    }
    return String(value);
  };

  const sortedHistory = useMemo(() => {
    return [...history].sort((a, b) => {
      if (sortOrder === "newest") {
        return new Date(b.createdAt) - new Date(a.createdAt);
      } else {
        return new Date(a.createdAt) - new Date(b.createdAt);
      }
    });
  }, [history, sortOrder]);

  const filteredAndSortedHistory = useMemo(() => {
    return sortedHistory.filter((item) => {
      const searchLower = searchTerm.toLowerCase();
      return (
        item.title.toLowerCase().includes(searchLower) ||
        item.prompt.toLowerCase().includes(searchLower) ||
        item.response.toLowerCase().includes(searchLower) ||
        Object.values(item.filters).some((value) =>
          String(value).toLowerCase().includes(searchLower)
        )
      );
    });
  }, [sortedHistory, searchTerm]);

  const Row = ({ index, style }) => {
    const item = filteredAndSortedHistory[index];

    // Format the createdAt timestamp using native JavaScript Date
    const formattedTimestamp = new Date(item.createdAt).toLocaleString();

    return (
      <div
        style={{ ...style, borderBottom: "1px solid #303030", padding: "16px" }}
      >
        <Card
          hoverable
          onClick={() => showModal(item)}
          style={{ width: "100%", cursor: "pointer" }}
        >
          <Paragraph ellipsis={{ rows: 1, expandable: false }}>
            <Title level={2}>{decodeHTMLEntities(item.title)}</Title>
          </Paragraph>
          <Paragraph>
            <Text type="secondary">Created at: {formattedTimestamp}</Text>
          </Paragraph>
          <Paragraph ellipsis={{ rows: 2, expandable: false }}>
            <Text strong>Response:</Text> {decodeHTMLEntities(item.response)}
          </Paragraph>
          <Space className="prmptbtn">
            <Button
              type="primary"
              icon={<StarOutlined />}
              onClick={(e) => {
                e.stopPropagation();
                handleFavorite(item._id);
              }}
            >
              {item.isFavourite ? "Remove from Favorite" : "Save to Favorite"}
            </Button>
            <Button
              type="primary"
              danger
              icon={<DeleteOutlined />}
              onClick={(e) => {
                e.stopPropagation();
                handleDelete(item._id);
              }}
            >
              Delete
            </Button>
          </Space>
        </Card>
      </div>
    );
  };

  const decodeHTMLEntities = (str) => {
    const parser = new DOMParser();
    const decodedString = parser.parseFromString(str, "text/html")
      .documentElement.textContent;
    return decodedString;
  };

  return (
    <>
      <AppHeader />
      <div className="hstry-container" style={{ padding: "24px" }}>
        <Space style={{ marginBottom: "16px" }}>
          <Search
            placeholder="Search..."
            onSearch={setSearchTerm}
            style={{ width: 200 }}
          />
          <Select
            defaultValue="newest"
            style={{ width: 120 }}
            onChange={setSortOrder}
          >
            <Option value="newest">Newest</Option>
            <Option value="oldest">Oldest</Option>
          </Select>
        </Space>
        {filteredAndSortedHistory.length > 0 ? (
          <List
            height={window.innerHeight - 200}
            itemCount={filteredAndSortedHistory.length}
            itemSize={311}
            width="100%"
          >
            {Row}
          </List>
        ) : (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              <span>
                No history found. Start generating content to see it here!
              </span>
            }
          />
        )}
        <Modal
          visible={isModalVisible}
          onCancel={handleModalClose}
          footer={
            selectedItem && (
              <div
                className="prmptbtn"
                style={{ display: "flex", justifyContent: "flex-start" }}
              >
                <Button
                  type="primary"
                  icon={<StarOutlined />}
                  onClick={() => handleFavorite(selectedItem._id)}
                  style={{ marginRight: 8 }}
                >
                  {selectedItem.isFavourite
                    ? "Remove from Favorite"
                    : "Save to Favorite"}
                </Button>
                <Button
                  type="primary"
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() => {
                    handleDelete(selectedItem._id);
                    handleModalClose();
                  }}
                >
                  Delete
                </Button>
              </div>
            )
          }
          width={800}
          bodyStyle={{ maxHeight: "calc(60vh - 55px)", overflow: "auto" }}
        >
          {selectedItem && (
            <>
              <Title level={2}>{decodeHTMLEntities(selectedItem.title)}</Title>
              {/* Display the createdAt timestamp in the modal */}
              <Paragraph>
                <Text type="secondary">
                  Created at:{" "}
                  {new Date(selectedItem.createdAt).toLocaleString()}
                </Text>
              </Paragraph>
              <Table
                columns={columns}
                dataSource={Object.entries(selectedItem.filters)
                  .filter(([_, value]) => value && value.length > 0)
                  .map(([key, value]) => ({
                    key,
                    value: formatFilterValue(value),
                  }))}
                pagination={false}
                size="small"
              />
              <Paragraph style={{ marginTop: "24px" }}>
                <Title level={3}>Prompt:</Title>
                <DynamicResponse content={selectedItem.prompt} />
              </Paragraph>
              <Title level={3}>Response:</Title>
              <DynamicResponse content={selectedItem.response} />
            </>
          )}
        </Modal>
      </div>
    </>
  );
};

export default History;
