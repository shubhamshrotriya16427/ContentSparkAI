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
import { StarFilled, CopyOutlined } from "@ant-design/icons";
import { FixedSizeList as List } from "react-window";
import DynamicResponse from "../DynamicResponse/DynamicResponse";
import { useAuth } from "../Context/AuthContext";
import AppHeader from "../Header/AppHeader";
import { useFilter } from "../Context/FilterContext";

const { Paragraph, Text, Title } = Typography;
const { Search } = Input;
const { Option } = Select;

const Favourites = () => {
  const [favourites, setFavourites] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOrder, setSortOrder] = useState("newest");
  const { api, isLogout } = useAuth();
  const { updateCurrentFilter } = useFilter();

  const fetchFavourites = useCallback(async () => {
    try {
      const response = await api.get("/get-favorites");
      setFavourites([...response.data.filters, ...response.data.favorites]);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  }, [api]);

  useEffect(() => {
    fetchFavourites();
  }, [fetchFavourites]);

  const handleRemoveFavorite = async (id, isFilter) => {
    try {
      let response;
      if (isFilter) {
        response = await api.delete(`/delete-filter/${id}`);
      } else {
        response = await api.post(`/set-favorite/${id}`);
      }
      message.success(response.data.message);
      fetchFavourites();
    } catch (error) {
      console.error("Error unfavoriting item:", error);
      if (!isLogout) {
        message.error(error.response?.data?.message ?? "Unfavorite failed");
      }
    }
  };

  const handleCopyConfiguration = (filterConfig) => {
    updateCurrentFilter(filterConfig);
    message.success("Configuration copied to homepage");
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
      title: "Field",
      dataIndex: "key",
      key: "key",
      render: (text) => <Text strong>{text}</Text>,
    },
    {
      title: "Value",
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

  const sortedFavourites = useMemo(() => {
    return [...favourites].sort((a, b) => {
      if (sortOrder === "newest") {
        return new Date(b.createdAt) - new Date(a.createdAt);
      } else {
        return new Date(a.createdAt) - new Date(b.createdAt);
      }
    });
  }, [favourites, sortOrder]);

  const filteredAndSortedFavourites = useMemo(() => {
    return sortedFavourites.filter((item) => {
      const searchLower = searchTerm.toLowerCase();
      return (
        item.title?.toLowerCase().includes(searchLower) ||
        item.contentType?.toLowerCase().includes(searchLower) ||
        item.industry?.toLowerCase().includes(searchLower) ||
        (item.prompt && item.prompt.toLowerCase().includes(searchLower)) ||
        (item.response && item.response.toLowerCase().includes(searchLower))
      );
    });
  }, [sortedFavourites, searchTerm]);

  const decodeHTMLEntities = (str) => {
    const parser = new DOMParser();
    const decodedString = parser.parseFromString(str, "text/html")
      .documentElement.textContent;
    return decodedString;
  };

  const Row = ({ index, style }) => {
    const item = filteredAndSortedFavourites[index];
    const isFilter = !item.prompt;

    // Format the updatedAt timestamp using native JavaScript Date
    const formattedUpdatedAt = new Date(item.updatedAt).toLocaleString();

    return (
      <div
        style={{ ...style, borderBottom: "1px solid #303030", padding: "16px" }}
      >
        <Card
          hoverable
          onClick={() => showModal(item)}
          style={{ width: "100%", cursor: "pointer" }}
        >
          {isFilter ? (
            <>
              <Title level={2}>{decodeHTMLEntities(item.title)}</Title>
              <Paragraph ellipsis={{ rows: 1, expandable: false }}>
                <Text>ContentType: {item.contentType}</Text>
              </Paragraph>
              <Paragraph ellipsis={{ rows: 1, expandable: false }}>
                <Text>Industry: {item.industry}</Text>
              </Paragraph>
              <Paragraph ellipsis={{ rows: 1, expandable: false }}>
                <Text type="secondary">Saved at: {formattedUpdatedAt}</Text>
              </Paragraph>
            </>
          ) : (
            <>
              <Paragraph ellipsis={{ rows: 1, expandable: false }}>
                <Title level={2}>{decodeHTMLEntities(item.title)}</Title>
              </Paragraph>
              <Paragraph ellipsis={{ rows: 2, expandable: false }}>
                <Text strong>Response:</Text>{" "}
                {decodeHTMLEntities(item.response)}
              </Paragraph>
              <Paragraph ellipsis={{ rows: 1, expandable: false }}>
                <Text type="secondary">Saved at: {formattedUpdatedAt}</Text>
              </Paragraph>
            </>
          )}
          <Space className="prmptbtn">
            <Button
              type="primary"
              danger
              icon={<StarFilled />}
              onClick={(e) => {
                e.stopPropagation();
                handleRemoveFavorite(item._id, isFilter);
              }}
            >
              Remove from Favorite
            </Button>
            {isFilter && (
              <Button
                type="primary"
                icon={<CopyOutlined />}
                onClick={(e) => {
                  e.stopPropagation();
                  handleCopyConfiguration(item);
                }}
              >
                Copy Configuration to Homepage
              </Button>
            )}
          </Space>
        </Card>
      </div>
    );
  };

  return (
    <>
      <AppHeader />
      <div className="fav-container" style={{ padding: "24px" }}>
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
        {filteredAndSortedFavourites.length > 0 ? (
          <List
            height={window.innerHeight - 200}
            itemCount={filteredAndSortedFavourites.length}
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
                No favourites found. Start saving content to see it here!
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
                  danger
                  icon={<StarFilled />}
                  onClick={() => {
                    handleRemoveFavorite(
                      selectedItem._id,
                      !selectedItem.prompt
                    );
                    handleModalClose();
                  }}
                  style={{ marginRight: 8 }}
                >
                  Remove from Favorite
                </Button>
                {!selectedItem.prompt && (
                  <Button
                    type="primary"
                    icon={<CopyOutlined />}
                    onClick={() => handleCopyConfiguration(selectedItem)}
                  >
                    Copy Configuration to Homepage
                  </Button>
                )}
              </div>
            )
          }
          width={800}
          bodyStyle={{ maxHeight: "calc(60vh - 55px)", overflow: "auto" }}
        >
          {selectedItem && (
            <>
              <Title level={2}>
                {decodeHTMLEntities(selectedItem.title) ||
                  selectedItem.contentType}
              </Title>
              <Paragraph>
                <Text type="secondary">
                  Saved at: {new Date(selectedItem.updatedAt).toLocaleString()}
                </Text>
              </Paragraph>
              <Table
                columns={columns}
                dataSource={Object.entries(selectedItem.filters || selectedItem)
                  .filter(
                    ([key, value]) =>
                      value &&
                      value.length > 0 &&
                      key !== "prompt" &&
                      key !== "response" &&
                      key !== "_id" &&
                      key !== "userId"
                  )
                  .map(([key, value]) => ({
                    key,
                    value: formatFilterValue(value),
                  }))}
                pagination={false}
                size="small"
              />
              {selectedItem.prompt && (
                <Paragraph style={{ marginTop: "24px" }}>
                  <Title level={3}>Prompt:</Title>
                  <DynamicResponse content={selectedItem.prompt} />
                </Paragraph>
              )}
              {selectedItem.response && (
                <>
                  <Title level={3}>Response:</Title>
                  <DynamicResponse content={selectedItem.response} />
                </>
              )}
            </>
          )}
        </Modal>
      </div>
    </>
  );
};

export default Favourites;
