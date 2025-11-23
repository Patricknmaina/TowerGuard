export default {
  content: [
    "./index.html",
    "./src/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        // Soft greens (replacing emerald)
        "soft-green": {
          50: "#f0f9f4",
          100: "#dcf2e3",
          200: "#bce5cc",
          300: "#8fd0a8",
          400: "#5bb37d",
          500: "#3a9660",
          600: "#2d7a4f",
          700: "#266241",
          800: "#224e36",
          900: "#1e412e",
        },
        // Warm neutrals
        "warm": {
          50: "#faf9f7",
          100: "#f5f3f0",
          200: "#eae6e0",
          300: "#ddd6cc",
          400: "#c9bfb0",
          500: "#b5a894",
          600: "#9d8f78",
          700: "#827562",
          800: "#6b5f50",
          900: "#584e42",
        },
        // Charcoal for text
        "charcoal": {
          50: "#f6f6f6",
          100: "#e7e7e7",
          200: "#d1d1d1",
          300: "#b0b0b0",
          400: "#888888",
          500: "#6d6d6d",
          600: "#5d5d5d",
          700: "#4f4f4f",
          800: "#454545",
          900: "#3d3d3d",
          950: "#1a1a1a",
        },
      },
    },
  },
  plugins: [],
};
