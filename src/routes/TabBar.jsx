import React from "react";

const TabBar = ({ tabs, activeTab, onTabChange }) => {
  return (
    <div
      style={{
        display: "flex",
        borderBottom: "2px solid #d5baa9",
        marginBottom: "1rem",
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
              cursor: "pointer",
              border: "none",
              borderBottom: isActive ? "3px solid #d5baa9" : "3px solid transparent",
              backgroundColor: "transparent",
              padding: "0.5rem 1rem",
              color: isActive ? "#d5baa9" : "#9e9e9e",
              fontSize: "1rem",
              fontWeight: isActive ? "600" : "400",
              transition: "color 0.2s, border-bottom-color 0.2s",
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