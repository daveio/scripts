/** @type {import('tailwindcss').Config} */
module.exports = {
	content: [
		"./app/views/**/*.html.erb",
		"./app/helpers/**/*.rb",
		"./app/javascript/**/*.js",
		"./app/assets/stylesheets/**/*.css",
	],
	theme: {
		extend: {},
	},
	plugins: [
		require("daisyui"),
		require("@catppuccin/tailwindcss")({
			defaultFlavour: "frappe",
		}),
	],
	daisyui: {
		themes: [
			"light",
			"dark",
			{
				catppuccin: require("@catppuccin/daisyui").frappe,
			},
			{
				synthwave84: {
					primary: "#f92aad",
					"primary-focus": "#fa1a9e",
					"primary-content": "#ffffff",

					secondary: "#03edf9",
					"secondary-focus": "#00d6e7",
					"secondary-content": "#2a2139",

					accent: "#72f1b8",
					"accent-focus": "#5ce0a7",
					"accent-content": "#2a2139",

					"base-100": "#2a2139",
					"base-200": "#241b2f",
					"base-300": "#1e1726",
					"base-content": "#f4eee4",

					neutral: "#34294f",
					"neutral-focus": "#3a2d59",
					"neutral-content": "#f4eee4",

					info: "#03edf9",
					"info-content": "#2a2139",

					success: "#72f1b8",
					"success-content": "#2a2139",

					warning: "#fff951",
					"warning-content": "#2a2139",

					error: "#f97e72",
					"error-content": "#ffffff",
				},
			},
		],
		darkTheme: "dark",
		base: true,
		styled: true,
		utils: true,
	},
};
