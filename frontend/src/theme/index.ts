import { alpha, createTheme, darken } from "@mui/material/styles";
import type { PaletteOptions, ThemeOptions } from "@mui/material/styles";
import { createTheme as createBaseTheme } from "@mui/material/styles";

export type AppColorMode = "light" | "dark";

const spacingStep = 4; // 4px scale for friendlier, modern rhythm
const radius = 10; // slightly rounded, approachable

const lightPalette: PaletteOptions = {
  mode: "light",
  primary: {
    main: "#5F97CF", // friendly blue chosen by you
    light: "#8CB7E0",
    dark: "#2F6FAA",
    contrastText: "#FFFFFF"
  },
  secondary: {
    main: "#2FBF71", // nature-leaning green accent
    light: "#79D8A6",
    dark: "#1F8A52",
    contrastText: "#FFFFFF"
  },
  background: {
    default: "#F6F8FB", // soft paper
    paper: "#FFFFFF"
  },
  text: {
    primary: "#1F2933",
    secondary: "#616E7C"
  },
  error: { main: "#E53935" },
  warning: { main: "#F6A609" },
  info: { main: "#2E86DE" },
  success: { main: "#2FBF71" },
  divider: "#E5E9F0"
};

// Dark mode with black/white/yellow accent (friendly, not harsh)
const darkPalette: PaletteOptions = {
  mode: "dark",
  primary: {
    main: "#FFE066", // warm yellow accent (readable on dark)
    light: "#FFF2AD",
    dark: "#E6C74D",
    contrastText: "#1A1C1E"
  },
  secondary: {
    main: "#7FB8E8", // subtle blue to keep brand continuity
    light: "#A9D0F1",
    dark: "#4F90C4",
    contrastText: "#0E1113"
  },
  background: {
    default: "#0E1113", // near-black graphite
    paper: "#15191C"
  },
  text: {
    primary: "#F2F4F8",
    secondary: "#A7B0BB"
  },
  error: { main: "#FF6B6B" },
  warning: { main: "#FFC857" },
  info: { main: "#7FB8E8" },
  success: { main: "#66D18F" },
  divider: "#262B30"
};

// Shared typography: modern, approachable
const typography: ThemeOptions["typography"] = {
  fontFamily:
    'Inter, "Helvetica Neue", Helvetica, Arial, system-ui, -apple-system, "Segoe UI", Roboto, "Noto Sans", "Liberation Sans", sans-serif',
  h1: { fontSize: "2.5rem", fontWeight: 700, lineHeight: 1.2, letterSpacing: "-0.01em" },
  h2: { fontSize: "2rem", fontWeight: 700, lineHeight: 1.25, letterSpacing: "-0.008em" },
  h3: { fontSize: "1.5rem", fontWeight: 600, lineHeight: 1.3 },
  h4: { fontSize: "1.25rem", fontWeight: 600, lineHeight: 1.35 },
  h5: { fontSize: "1.125rem", fontWeight: 600, lineHeight: 1.4 },
  h6: { fontSize: "1rem", fontWeight: 600, lineHeight: 1.45 },
  subtitle1: { fontSize: "1rem", fontWeight: 500, lineHeight: 1.5 },
  subtitle2: { fontSize: "0.875rem", fontWeight: 600, lineHeight: 1.45 },
  body1: { fontSize: "1rem", fontWeight: 400, lineHeight: 1.6 },
  body2: { fontSize: "0.9375rem", fontWeight: 400, lineHeight: 1.55 },
  button: {
    fontSize: "0.9375rem",
    fontWeight: 600,
    textTransform: "none",
    letterSpacing: 0.2
  },
  caption: { fontSize: "0.8125rem", lineHeight: 1.4, fontWeight: 500 },
  overline: { fontSize: "0.75rem", letterSpacing: 1, textTransform: "uppercase" }
};

// Shadows tuned for friendliness (soft, not too stark)
const base = createBaseTheme();
const shadows = [...base.shadows];
shadows[1] = "0px 4px 8px 0px rgba(0,0,0,0.06)";
shadows[2] = "0px 6px 16px 0px rgba(0,0,0,0.08)";
shadows[3] = "0px 10px 24px 0px rgba(0,0,0,0.10)";

export function createAppTheme(mode: AppColorMode = "light") {
  const palette = mode === "light" ? lightPalette : darkPalette;

  const theme = createTheme({
    spacing: spacingStep,
    shape: { borderRadius: radius },
    palette,
    typography,
    shadows: shadows as unknown as typeof base.shadows,
    components: {
      MuiCssBaseline: {
        styleOverrides: (comp) => ({
          body: {
            backgroundColor: comp.palette.background.default
          }
        })
      },
      MuiAppBar: {
        styleOverrides: {
          root: ({ theme }) => ({
            boxShadow: theme.shadows[2],
            backgroundColor:
              theme.palette.mode === "light"
                ? theme.palette.primary.main
                : theme.palette.background.paper
          })
        }
      },
      MuiCard: {
        styleOverrides: {
          root: ({ theme }) => ({
            borderRadius: theme.shape.borderRadius,
            boxShadow: theme.shadows[2],
            border:
              theme.palette.mode === "light"
                ? "1px solid #E5E9F0"
                : `1px solid ${theme.palette.divider}`
          })
        }
      },
      MuiButton: {
        styleOverrides: {
          root: ({ theme }) => ({
            borderRadius: theme.shape.borderRadius * 0.8,
            paddingInline: theme.spacing(2),
            paddingBlock: theme.spacing(1),
            boxShadow: "none",
            "&:hover": {
              boxShadow: "none",
              backgroundColor: darken(theme.palette.primary.main, 0.06)
            }
          }),
          containedSecondary: ({ theme }) => ({
            color:
              theme.palette.mode === "light"
                ? theme.palette.common.white
                : theme.palette.background.default
          })
        }
      },
      MuiTextField: {
        defaultProps: {
          variant: "outlined",
          fullWidth: true
        },
        styleOverrides: {
          root: ({ theme }) => ({
            "& .MuiOutlinedInput-root": {
              "& fieldset": {
                borderColor:
                  theme.palette.mode === "light" ? "#D7DFE7" : theme.palette.divider
              },
              "&:hover fieldset": {
                borderColor: darken(theme.palette.primary.main, 0.12)
              },
              "&.Mui-focused fieldset": {
                borderColor: theme.palette.primary.main
              }
            }
          })
        }
      },
      MuiLink: {
        styleOverrides: {
          root: ({ theme }) => ({
            color: theme.palette.primary.dark,
            textDecoration: "none",
            "&:hover": { textDecoration: "underline" }
          })
        }
      },
      MuiChip: {
        styleOverrides: {
          root: ({ theme }) => ({
            borderRadius: theme.shape.borderRadius,
            "&.MuiChip-colorPrimary": {
              backgroundColor: alpha(theme.palette.primary.main, 0.12),
              color:
                theme.palette.mode === "light"
                  ? theme.palette.primary.dark
                  : theme.palette.primary.light
            }
          })
        }
      },
      MuiTooltip: {
        styleOverrides: {
          tooltip: ({ theme }) => ({
            backgroundColor:
              theme.palette.mode === "light"
                ? theme.palette.text.primary
                : theme.palette.background.paper,
            color:
              theme.palette.mode === "light"
                ? theme.palette.common.white
                : theme.palette.text.primary,
            fontSize: "0.8125rem"
          })
        }
      },
      MuiDivider: {
        styleOverrides: {
          root: ({ theme }) => ({
            borderColor:
              theme.palette.mode === "light" ? "#E5E9F0" : theme.palette.divider
          })
        }
      }
    }
  });

  return theme;
}

