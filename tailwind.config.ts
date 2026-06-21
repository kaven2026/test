import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        crm: [
          "Plus Jakarta Sans",
          "Microsoft YaHei",
          "PingFang SC",
          "Arial",
          "sans-serif",
        ],
      },
      borderRadius: {
        crm: "8px",
      },
      boxShadow: {
        "crm-panel": "0 18px 45px rgba(15, 23, 42, 0.08)",
        "crm-button": "0 12px 26px rgba(37, 99, 235, 0.22)",
      },
      colors: {
        crm: {
          bg: "#f8fafc",
          "bg-soft": "#eef4fb",
          surface: "#ffffff",
          "surface-soft": "#f8fbff",
          text: "#0f172a",
          muted: "#64748b",
          soft: "#94a3b8",
          border: "#e2e8f0",
          "border-strong": "#cbd5e1",
          primary: "#2563eb",
          "primary-hover": "#1d4ed8",
          success: "#059669",
          danger: "#dc2626",
          warning: "#d97706",
          sidebar: "#0f172a",
        },
      },
    },
  },
  plugins: [],
};

export default config;
