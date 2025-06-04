import KeyCompromiseChecker from "@/components/key-compromise-checker";
import SocialLinks from "@/components/social-links";

export default function Home() {
	return (
		<main className="relative z-10 min-h-screen bg-linear-to-b from-gray-900/90 via-gray-800/90 to-black/90 py-10 px-4">
			<div className="container mx-auto max-w-3xl">
				<h1 className="text-4xl font-bold text-center mb-2 text-transparent bg-clip-text bg-linear-to-r from-cyan-400 to-purple-500">
					Keycheck
				</h1>
				<p className="text-center text-cyan-300 mb-8">
					Check if your private key has been leaked on the dark web
				</p>
				<KeyCompromiseChecker />
				<SocialLinks />
			</div>
		</main>
	);
}
