module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        pink: {
          500: "#EB558A",
          600: "#d63f74",
        },
        gray: {
          50: "#F2F2F2",
          100: "#F2F2F2",
          200: "#E9E9E9",
          300: "#CCCCCC",
        },
      },
    },
  },
  plugins: [require("daisyui")],
  daisyui: {
    themes: [
      {
        odtheme: {
          primary: "#EB558A",
          "primary-content": "#ffffff",
          secondary: "#4b5563",
          accent: "#ec4899",
          neutral: "#374151",
          "base-100": "#ffffff",
          "base-200": "#f4f5f7",
          "base-300": "#e5e7eb",
          info: "#3b82f6",
          success: "#10b981",
          warning: "#f59e0b",
          error: "#ef4444",
        },
      },
    ],
  },
};
