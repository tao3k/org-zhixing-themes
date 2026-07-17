import { isolatedSelectedTheme, isolatedThemes } from "virtual:org-zhixing/theme-runtime";
import { createThemeRegistry } from "./themeRegistry";

export const selectedBuiltinTheme = isolatedSelectedTheme;
export const elegantBlogTheme = isolatedSelectedTheme;

export const createDefaultThemeRegistry = () => createThemeRegistry(isolatedThemes);
