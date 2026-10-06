import { palette } from "./palette";

export const darkTheme = {
    colors: {
        background: "#14171F",
        surface: "#1C212C",
        primary: palette.mint[300],
        text: palette.cream[50],
        textMuted: "#DBD8D8",
        border: "#485266",
        accent: palette.mint[300],
        success: palette.mint[300],
        warning: palette.yellow[300],
        pink: palette.mint[300],
        danger: "#FFCACA",
    },
};

export const lightTheme = {
    colors: {
        background: "#F6F6F3",
        surface: palette.cream[50],
        primary: palette.mint[800],
        text: "#1D252C",
        textMuted: "#56616A",
        border: "#E6E7E4",
        accent: palette.mint[300],
        success: palette.mint[800],
        warning: palette.yellow[800],
        pink: palette.mint[800],
        danger: "#991B1B",
    },
};
