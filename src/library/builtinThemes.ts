import { generatedSelectedTheme, generatedThemes } from "../generated/themeRegistry";
import { createThemeRegistry } from "./themeRegistry";

export const selectedBuiltinTheme = generatedSelectedTheme;
export const elegantBlogTheme = generatedSelectedTheme;

export const createDefaultThemeRegistry = () => createThemeRegistry(generatedThemes);
