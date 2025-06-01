import React from "react";

const TabBar = ({ tabs, activeTab, onTabChange }) => {
  return (
    <div
      style={{
        display: "flex",
        borderBottom: "2px solid #d3b7a4",
        backgroundColor: "#d3b7a4",
        fontFamily: "serif",
        userSelect: "none",
      }}
      role="tablist"
      aria-label="Fiction tabs"
    >
      {tabs.map(({ id, label }) => {
        const isActive = id === activeTab;

        return (
          <button
            key={id}
            role="tab"
            aria-selected={isActive}
            aria-controls={`panel-${id}`}
            id={`tab-${id}`}
            onClick={() => onTabChange(id)}
            style={{
              flex: 1, // Evenly split width
              cursor: "pointer",
              border: "none",
              backgroundColor: isActive ? "#202d26" : "transparent",
              color: isActive ? "#d3b7a4" : "#202d26",
              padding: "0.75rem 0",
              fontSize: "1rem",
              fontWeight: isActive ? "600" : "400",
              textAlign: "center",
              transition: "background-color 0.3s, color 0.3s",
              minWidth: 0, // Prevent overflow on small screens
            }}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
};

export default TabBar;
