import { getIsolatedSelectedTheme } from "virtual:org-zhixing/theme-runtime";
import { createThemeRegistry } from "./themeRegistry";

export const selectedBuiltinTheme = getIsolatedSelectedTheme();
export const elegantBlogTheme = selectedBuiltinTheme;

export const createDefaultThemeRegistry = () => createThemeRegistry([selectedBuiltinTheme]);
