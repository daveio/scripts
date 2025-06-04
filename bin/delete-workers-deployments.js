#!/usr/bin/env bun

// Configuration - Update these values as needed

const CF_API_KEY = ""; // Global API Key
const CF_EMAIL = ""; // Account email
const CF_ACCOUNT_ID = "";
const CF_PAGES_PROJECT_NAME = "";
const CF_DELETE_ALIASED_DEPLOYMENTS = true;

const MAX_RETRIES = 3;
const DELAY_BETWEEN_REQUESTS = 500; // ms

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// API headers
const headers = {
	"X-Auth-Key": CF_API_KEY,
	"X-Auth-Email": CF_EMAIL,
	"Content-Type": "application/json",
};

/**
 * Get the production deployment ID (canonical deployment)
 */
async function getProductionDeploymentId() {
	console.log("🔍 Fetching production deployment info...");

	const response = await fetch(
		`https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/pages/projects/${CF_PAGES_PROJECT_NAME}`,
		{ method: "GET", headers },
	);

	if (!response.ok) {
		throw new Error(`HTTP ${response.status}: ${response.statusText}`);
	}

	const data = await response.json();

	if (!data.success) {
		console.error("❌ API Error:", JSON.stringify(data.errors, null, 2));
		throw new Error(data.errors[0]?.message || "Failed to get project info");
	}

	const prodDeploymentId = data.result?.canonical_deployment?.id;
	if (!prodDeploymentId) {
		throw new Error("No production deployment found");
	}

	console.log(`✅ Production deployment: ${prodDeploymentId}`);
	return prodDeploymentId;
}

/**
 * List all deployments with pagination
 */
async function listAllDeployments() {
	console.log("📋 Fetching all deployments...");

	const deployments = [];
	let page = 1;
	const perPage = 25; // Cloudflare default

	while (true) {
		console.log(`   Fetching page ${page}...`);

		const response = await fetch(
			`https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/pages/projects/${CF_PAGES_PROJECT_NAME}/deployments?per_page=${perPage}&page=${page}`,
			{ method: "GET", headers },
		);

		if (!response.ok) {
			throw new Error(`HTTP ${response.status}: ${response.statusText}`);
		}

		const data = await response.json();

		if (!data.success) {
			console.error("❌ API Error:", JSON.stringify(data.errors, null, 2));
			throw new Error(data.errors[0]?.message || "Failed to list deployments");
		}

		const pageDeployments = data.result || [];
		deployments.push(...pageDeployments);

		// Check if we've reached the end
		if (pageDeployments.length < perPage) {
			break;
		}

		page++;
		await sleep(100); // Be nice to the API
	}

	console.log(`📊 Found ${deployments.length} total deployments`);
	return deployments;
}

/**
 * Delete a specific deployment
 */
async function deleteDeployment(deployment, retryCount = 0) {
	const { id, created_on, environment } = deployment;

	try {
		const url = `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/pages/projects/${CF_PAGES_PROJECT_NAME}/deployments/${id}`;
		const params = CF_DELETE_ALIASED_DEPLOYMENTS ? "?force=true" : "";

		const response = await fetch(`${url}${params}`, {
			method: "DELETE",
			headers,
		});

		if (!response.ok) {
			throw new Error(`HTTP ${response.status}: ${response.statusText}`);
		}

		const data = await response.json();

		if (!data.success) {
			throw new Error(data.errors[0]?.message || "Deletion failed");
		}

		console.log(`🗑️  Deleted: ${id} (${environment}, ${created_on})`);
		return true;
	} catch (error) {
		if (retryCount < MAX_RETRIES) {
			console.log(
				`⚠️  Retry ${retryCount + 1}/${MAX_RETRIES} for ${id}: ${error.message}`,
			);
			await sleep(1000 * (retryCount + 1)); // Exponential backoff
			return deleteDeployment(deployment, retryCount + 1);
		}
		console.error(`❌ Failed to delete ${id}: ${error.message}`);
		return false;
	}
}

/**
 * Main execution
 */
async function main() {
	console.log("🚀 Starting Cloudflare Pages deployment cleanup...\n");

	// Validate configuration
	if (!CF_API_KEY) {
		throw new Error("CF_API_KEY is required");
	}
	if (!CF_EMAIL) {
		throw new Error("CF_EMAIL is required");
	}
	if (!CF_ACCOUNT_ID) {
		throw new Error("CF_ACCOUNT_ID is required");
	}
	if (!CF_PAGES_PROJECT_NAME) {
		throw new Error("CF_PAGES_PROJECT_NAME is required");
	}

	try {
		// Get production deployment to exclude
		const productionDeploymentId = await getProductionDeploymentId();

		// List all deployments
		const deployments = await listAllDeployments();

		if (deployments.length === 0) {
			console.log("ℹ️  No deployments found");
			return;
		}

		// Filter out production deployment
		const deploymentsToDelete = deployments.filter(
			(d) => d.id !== productionDeploymentId,
		);

		console.log(
			`\n🎯 Will delete ${deploymentsToDelete.length} deployments (keeping production: ${productionDeploymentId})\n`,
		);

		if (deploymentsToDelete.length === 0) {
			console.log("ℹ️  No deployments to delete");
			return;
		}

		// Delete deployments
		let deleted = 0;
		let failed = 0;

		for (const deployment of deploymentsToDelete) {
			const success = await deleteDeployment(deployment);
			if (success) {
				deleted++;
			} else {
				failed++;
			}

			// Rate limiting
			await sleep(DELAY_BETWEEN_REQUESTS);
		}

		console.log("\n✅ Cleanup complete!");
		console.log(`   Deleted: ${deleted}`);
		console.log(`   Failed: ${failed}`);
		console.log("   Kept (production): 1");
	} catch (error) {
		console.error(`\n❌ Error: ${error.message}`);
		process.exit(1);
	}
}

// Run the script
if (import.meta.main) {
	main();
}
