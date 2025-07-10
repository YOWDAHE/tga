import { type MantineColorsTuple, createTheme } from "@mantine/core"

// Custom color palette based on hsl(174, 21%, 56%)
const primaryColor: MantineColorsTuple = [
  "#f0f7f6", // 50 - very light
  "#e1f0ee", // 100 - light
  "#c8e3e0", // 200 - lighter
  "#a8d1cd", // 300 - light
  "#7db8b3", // 400 - medium light
  "#6ba8a3", // 500 - base color (hsl(174, 21%, 56%))
  "#5a9792", // 600 - medium dark
  "#4a8580", // 700 - dark
  "#3d7370", // 800 - darker
  "#2f615e", // 900 - very dark
]

const secondaryColor: MantineColorsTuple = [
  "#f3e5f5",
  "#e1bee7",
  "#ce93d8",
  "#ba68c8",
  "#ab47bc",
  "#9c27b0",
  "#8e24aa",
  "#7b1fa2",
  "#6a1b9a",
  "#4a148c",
]

const successColor: MantineColorsTuple = [
  "#e8f5e8",
  "#c8e6c8",
  "#a5d6a5",
  "#81c784",
  "#66bb6a",
  "#4caf50",
  "#43a047",
  "#388e3c",
  "#2e7d32",
  "#1b5e20",
]

const warningColor: MantineColorsTuple = [
  "#fff8e1",
  "#ffecb3",
  "#ffe082",
  "#ffd54f",
  "#ffca28",
  "#ffc107",
  "#ffb300",
  "#ffa000",
  "#ff8f00",
  "#ff6f00",
]

const errorColor: MantineColorsTuple = [
  "#ffebee",
  "#ffcdd2",
  "#ef9a9a",
  "#e57373",
  "#ef5350",
  "#f44336",
  "#e53935",
  "#d32f2f",
  "#c62828",
  "#b71c1c",
]

export const theme = createTheme({
  colors: {
    primary: primaryColor,
    secondary: secondaryColor,
    success: successColor,
    warning: warningColor,
    error: errorColor,
  },
  primaryColor: "primary",
  primaryShade: 6,
  fontFamily: "Inter, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif",
  headings: {
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif",
    fontWeight: "600",
  },
  radius: {
    xs: "4px",
    sm: "6px",
    md: "8px",
    lg: "12px",
    xl: "16px",
  },
  shadows: {
    xs: "0 1px 3px rgba(0, 0, 0, 0.05), 0 1px 2px rgba(0, 0, 0, 0.1)",
    sm: "0 1px 3px rgba(0, 0, 0, 0.05), 0 4px 6px rgba(0, 0, 0, 0.1)",
    md: "0 4px 6px rgba(0, 0, 0, 0.05), 0 10px 15px rgba(0, 0, 0, 0.1)",
    lg: "0 10px 15px rgba(0, 0, 0, 0.05), 0 20px 25px rgba(0, 0, 0, 0.1)",
    xl: "0 25px 50px rgba(0, 0, 0, 0.15)",
  },
})

// Color utilities for consistent usage across the app
export const colors = {
  primary: {
    50: "#f0f7f6",
    100: "#e1f0ee",
    200: "#c8e3e0",
    300: "#a8d1cd",
    400: "#7db8b3",
    500: "#6ba8a3", // hsl(174, 21%, 56%)
    600: "#5a9792",
    700: "#4a8580",
    800: "#3d7370",
    900: "#2f615e",
  },
  secondary: {
    50: "#f3e5f5",
    100: "#e1bee7",
    200: "#ce93d8",
    300: "#ba68c8",
    400: "#ab47bc",
    500: "#9c27b0",
    600: "#8e24aa",
    700: "#7b1fa2",
    800: "#6a1b9a",
    900: "#4a148c",
  },
  success: {
    50: "#e8f5e8",
    500: "#4caf50",
    600: "#43a047",
  },
  warning: {
    50: "#fff8e1",
    500: "#ffc107",
    600: "#ffb300",
  },
  error: {
    50: "#ffebee",
    500: "#f44336",
    600: "#e53935",
  },
  gray: {
    50: "#fafafa",
    100: "#f5f5f5",
    200: "#eeeeee",
    300: "#e0e0e0",
    400: "#bdbdbd",
    500: "#9e9e9e",
    600: "#757575",
    700: "#616161",
    800: "#424242",
    900: "#212121",
  },
}
