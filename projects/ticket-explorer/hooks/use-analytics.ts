import { track as vercelTrack } from "@vercel/analytics";

type TicketEvent = {
	ticketId: string;
	title?: string;
	status?: string;
	priority?: string;
};

type ThemeEvent = {
	theme: "synthwave" | "light" | "dark";
	enabled: boolean;
};

export const useAnalytics = () => {
	const trackTicketView = (ticket: TicketEvent) => {
		const eventData: Record<string, string> = {
			ticketId: ticket.ticketId,
		};

		if (ticket.title) eventData.title = ticket.title;
		if (ticket.status) eventData.status = ticket.status;
		if (ticket.priority) eventData.priority = ticket.priority;

		vercelTrack("ticket_view", eventData);
	};

	const trackThemeChange = (themeEvent: ThemeEvent) => {
		vercelTrack("theme_change", {
			theme: themeEvent.theme,
			enabled: themeEvent.enabled,
			timestamp: new Date().toISOString(),
		});
	};

	const trackSearch = (query: string, resultCount: number) => {
		vercelTrack("ticket_search", {
			query,
			resultCount,
			timestamp: new Date().toISOString(),
		});
	};

	const trackFilterChange = (filters: Record<string, unknown>) => {
		vercelTrack("filter_change", {
			...filters,
			timestamp: new Date().toISOString(),
		});
	};

	const trackError = (error: Error, componentName: string) => {
		vercelTrack("error_occurred", {
			error: error.message,
			component: componentName,
			timestamp: new Date().toISOString(),
		});
	};

	const track = (
		eventName: string,
		properties: Record<string, string | number | boolean>,
	) => {
		const propertiesWithTimestamp = {
			...properties,
			timestamp: (properties.timestamp as string) || new Date().toISOString(),
		};
		vercelTrack(eventName, propertiesWithTimestamp);
	};

	return {
		trackTicketView,
		trackThemeChange,
		trackSearch,
		trackFilterChange,
		trackError,
		track,
	};
};
