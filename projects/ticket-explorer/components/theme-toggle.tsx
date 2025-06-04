"use client";

import { Button } from "@/components/ui/button";
import { useAnalytics } from "@/hooks/use-analytics";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

interface ThemeToggleProps {
	isSynthwaveMode?: boolean;
}

export function ThemeToggle({ isSynthwaveMode = false }: ThemeToggleProps) {
	const { theme, setTheme } = useTheme();
	const [mounted, setMounted] = useState(false);
	const analytics = useAnalytics();

	// Avoid hydration mismatch by only rendering after mount
	useEffect(() => {
		setMounted(true);
	}, []);

	if (!mounted) {
		return <Button variant="ghost" size="icon" className="h-8 w-8" />;
	}

	// Force a direct toggle between light and dark
	const toggleTheme = () => {
		const newTheme = theme === "dark" ? "light" : "dark";
		setTheme(newTheme);
		analytics.trackThemeChange({
			theme: newTheme,
			enabled: true,
		});
	};

	return (
		<Button
			variant="ghost"
			size="icon"
			onClick={toggleTheme}
			className={`h-8 w-8 ${isSynthwaveMode ? "cyberpunk-button" : ""}`}
			aria-label="Toggle theme"
		>
			{theme === "dark" ? (
				<Sun
					className={`h-4 w-4 ${isSynthwaveMode ? "text-yellow-300" : ""}`}
				/>
			) : (
				<Moon className={`h-4 w-4 ${isSynthwaveMode ? "text-blue-300" : ""}`} />
			)}
		</Button>
	);
}
