import React, { useState, useEffect } from "react";
import { Modal, Button, Input, Typography, Spin } from "antd";

const { Text } = Typography;

const ReviewModal = ({
  visible,
  title,
  response,
  onConfirm,
  onCancel,
  isExistingPost,
  loading,
}) => {
  const [updatedTitle, setUpdatedTitle] = useState(title);
  const [updatedResponse, setUpdatedResponse] = useState(response);

  useEffect(() => {
    setUpdatedTitle(title);
    setUpdatedResponse(response);
  }, [title, response]);

  return (
    <Modal
      className="rdt-mdl"
      title={isExistingPost ? "Edit Reddit Post" : "Review Before Posting"}
      visible={visible}
      onCancel={onCancel}
      footer={[
        <Button
          key="cancel"
          type="primary"
          danger
          onClick={onCancel}
          disabled={loading}
        >
          Cancel
        </Button>,
        <Button
          key="submit"
          type="primary"
          onClick={() => onConfirm(updatedTitle, updatedResponse)}
          disabled={loading}
        >
          {isExistingPost ? "Update" : "Post"}
        </Button>,
      ]}
    >
      {loading ? (
        <div style={{ textAlign: "center", padding: "20px" }}>
          <Spin size="large" />
          <p>Fetching latest content from Reddit...</p>
        </div>
      ) : (
        <>
          {isExistingPost && (
            <Text
              type="warning"
              style={{ marginBottom: "10px", display: "block" }}
            >
              Note: Reddit doesn't allow editing post titles. Title changes will
              only be reflected in our database.
            </Text>
          )}
          <Input
            value={updatedTitle}
            onChange={(e) => setUpdatedTitle(e.target.value)}
            placeholder="Title"
            style={{ marginBottom: "10px" }}
            disabled={isExistingPost}
          />
          <Input.TextArea
            value={updatedResponse}
            onChange={(e) => setUpdatedResponse(e.target.value)}
            rows={6}
            placeholder="Response"
          />
        </>
      )}
    </Modal>
  );
};

export default ReviewModal;
