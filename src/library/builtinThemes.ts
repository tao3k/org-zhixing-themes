import { generatedThemes } from "../generated/themeRegistry";
import { createThemeRegistry } from "./themeRegistry";

export const elegantBlogTheme = generatedThemes[0];

export const createDefaultThemeRegistry = () => createThemeRegistry(generatedThemes);
