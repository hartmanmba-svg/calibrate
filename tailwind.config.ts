import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        navy:   "var(--navy)",
        dark:   "var(--dark)",
        orange: "var(--orange)",
        teal:   "var(--teal)",
        muted:  "var(--muted)",
        gold:   "var(--gold)",
        red:    "var(--red)",
        green:  "var(--green)",
      },
      fontFamily: {
        heading: ["var(--font-oswald)", "sans-serif"],
        body:    ["var(--font-open-sans)", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
