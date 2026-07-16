"use client";

import { LucideIcon } from "lucide-react";
import { ReactNode } from "react";

interface FormFieldProps {
  label: ReactNode;
  icon: LucideIcon;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
  required?: boolean;
  helperText?: string;
  multiline?: boolean;
  error?: string;
}

export function FormField({
  label,
  icon: Icon,
  value,
  onChange,
  type = "text",
  placeholder,
  required,
  helperText,
  multiline,
  error,
}: FormFieldProps) {
  const baseInput: React.CSSProperties = {
    width: "100%",
    borderRadius: "8px",
    background: "rgba(255,255,255,0.04)",
    paddingLeft: "44px",
    paddingRight: "14px",
    color: "#e2e8f0",
    fontSize: "14px",
    outline: "none",
    transition: "border-color 0.15s, box-shadow 0.15s",
    fontFamily: "inherit",
  };
  const normalBorder: React.CSSProperties = {
    border: "1px solid rgba(255,255,255,0.1)",
  };
  const errorBorder: React.CSSProperties = {
    border: "1px solid rgba(239,68,68,0.5)",
  };

  const inputStyle: React.CSSProperties = {
    ...baseInput,
    ...(error ? errorBorder : normalBorder),
    height: "40px",
  };

  const textareaStyle: React.CSSProperties = {
    ...baseInput,
    ...(error ? errorBorder : normalBorder),
    minHeight: "72px",
    paddingTop: "8px",
    paddingBottom: "8px",
    resize: "none",
  };

  return (
    <div className="onboarding-field" style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
      <label style={{ fontSize: "13px", fontWeight: 500, color: "#94a3b8" }}>{label}</label>
      <div style={{ position: "relative" }}>
        <Icon
          style={{
            position: "absolute",
            left: "14px",
            top: multiline ? "10px" : "50%",
            transform: multiline ? "none" : "translateY(-50%)",
            width: "16px",
            height: "16px",
            color: "#475569",
          }}
        />
        {multiline ? (
          <textarea
            required={required}
            style={textareaStyle}
            placeholder={placeholder}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = error ? "rgba(239,68,68,0.7)" : "rgba(16,185,129,0.5)";
              e.currentTarget.style.boxShadow = error
                ? "0 0 0 3px rgba(239,68,68,0.1)"
                : "0 0 0 3px rgba(16,185,129,0.1)";
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = error ? "rgba(239,68,68,0.5)" : "rgba(255,255,255,0.1)";
              e.currentTarget.style.boxShadow = "none";
            }}
          />
        ) : (
          <input
            type={type}
            required={required}
            style={inputStyle}
            placeholder={placeholder}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = error ? "rgba(239,68,68,0.7)" : "rgba(16,185,129,0.5)";
              e.currentTarget.style.boxShadow = error
                ? "0 0 0 3px rgba(239,68,68,0.1)"
                : "0 0 0 3px rgba(16,185,129,0.1)";
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = error ? "rgba(239,68,68,0.5)" : "rgba(255,255,255,0.1)";
              e.currentTarget.style.boxShadow = "none";
            }}
          />
        )}
      </div>
      {helperText && !error && (
        <p style={{ fontSize: "11px", color: "#475569" }}>{helperText}</p>
      )}
      {error && (
        <p style={{ fontSize: "11px", color: "#f87171" }}>{error}</p>
      )}
    </div>
  );
}
