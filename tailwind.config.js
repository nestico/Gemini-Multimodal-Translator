/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    darkMode: 'class',
    theme: {
        extend: {
            colors: {
                primary: "hsl(var(--primary))",
                "primary-glow": "hsl(var(--primary-glow))",
                background: "hsl(var(--background))",
                "background-light": "#f8fafc", // slate-50
                "background-dark": "hsl(var(--background))",
                surface: "hsl(var(--surface))",
                "surface-glass": "hsl(var(--surface-glass))",
                "card-dark": "hsl(var(--surface))",
                "border-dark": "rgba(255, 255, 255, 0.1)",
                text: "hsl(var(--text))",
                "text-muted": "hsl(var(--text-muted))",
            },
            borderRadius: {
                DEFAULT: "var(--radius)",
            },
        },
    },
    plugins: [],
};
