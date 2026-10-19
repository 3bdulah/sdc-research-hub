import type { Config } from "tailwindcss";

const config: Config = { content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"], theme: { extend: { colors: { ink: "#17212b", sand: "#f8f5ef", teal: "#147d78", coral: "#e9755b" }, fontFamily: { arabic: ["IBM Plex Sans Arabic", "sans-serif"] } } }, plugins: [] };
export default config;
