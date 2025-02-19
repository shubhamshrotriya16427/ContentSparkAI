import React from "react";
import ReactMarkdown from "react-markdown";

const DynamicResponse = ({ content }) => {
  const styles = {
    container: {
      fontFamily: "Arial, sans-serif",
      lineHeight: 1.6,
      color: "#fff",
      maxWidth: "800px",
      margin: "0 auto",
    },
    h1: {
      color: "#2c3e50",
      borderBottom: "2px solid #3498db",
      paddingBottom: "10px",
    },
    h2: {
      color: "#2980b9",
    },
    highlight: {
      backgroundColor: "#f1c40f",
      padding: "2px 5px",
      borderRadius: "3px",
    },
    ul: {
      listStyleType: "none",
      paddingLeft: 0,
    },
    li: {
      marginBottom: "10px",
      paddingLeft: "25px",
      position: "relative",
    },
    liBefore: {
      content: '"✓"',
      position: "absolute",
      left: 0,
      color: "#27ae60",
    },
    cta: {
      backgroundColor: "#3498db",
      color: "white",
      padding: "10px 20px",
      textDecoration: "none",
      display: "inline-block",
      borderRadius: "5px",
      marginTop: "20px",
    },
  };

  const customRenderers = {
    h1: ({ children }) => <h1 style={styles.h1}>{children}</h1>,
    h2: ({ children }) => <h2 style={styles.h2}>{children}</h2>,
    strong: ({ children }) => (
      <strong style={styles.highlight}>{children}</strong>
    ),
    ul: ({ children }) => <ul style={styles.ul}>{children}</ul>,
    li: ({ children }) => (
      <li style={styles.li}>
        <span style={styles.liBefore}></span>
        {children}
      </li>
    ),
    a: ({ href, children }) => (
      <a href={href} style={styles.cta}>
        {children}
      </a>
    ),
  };

  return (
    <div style={styles.container}>
      <ReactMarkdown components={customRenderers}>{content}</ReactMarkdown>
    </div>
  );
};

export default DynamicResponse;
