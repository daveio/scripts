"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

export function SynthwaveBackground() {
	const containerRef = useRef<HTMLDivElement>(null);
	const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
	const animationFrameRef = useRef<number | null>(null);

	useEffect(() => {
		if (!containerRef.current) return;

		// Scene setup
		const scene = new THREE.Scene();

		// Camera setup
		const camera = new THREE.PerspectiveCamera(
			75,
			window.innerWidth / window.innerHeight,
			0.1,
			1000,
		);
		camera.position.z = 5;
		camera.position.y = 1;

		// Renderer setup - optimize for performance
		const renderer = new THREE.WebGLRenderer({
			antialias: true,
			alpha: true,
			powerPreference: "high-performance",
			precision: "mediump", // Use medium precision for better performance
		});
		renderer.setSize(window.innerWidth, window.innerHeight);
		renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Limit pixel ratio for better performance
		containerRef.current.appendChild(renderer.domElement);
		rendererRef.current = renderer;

		// Grid setup - use BufferGeometry for better performance
		const gridSize = 40;
		const gridDivisions = 40;

		// Create horizontal grid
		const horizontalGrid = new THREE.GridHelper(
			gridSize,
			gridDivisions,
			0xff00ff,
			0x00ffff,
		);
		horizontalGrid.position.y = -2;
		scene.add(horizontalGrid);

		// Create sun - use BufferGeometry for better performance
		const sunGeometry = new THREE.CircleGeometry(5, 32);
		const sunMaterial = new THREE.MeshBasicMaterial({
			color: 0xff00ff,
			transparent: true,
			opacity: 0.7,
		});
		const sun = new THREE.Mesh(sunGeometry, sunMaterial);
		sun.position.z = -15;
		sun.position.y = 2;
		scene.add(sun);

		// Create sun glow - use BufferGeometry for better performance
		const glowGeometry = new THREE.CircleGeometry(7, 32);
		const glowMaterial = new THREE.MeshBasicMaterial({
			color: 0xff00ff,
			transparent: true,
			opacity: 0.3,
		});
		const glow = new THREE.Mesh(glowGeometry, glowMaterial);
		glow.position.z = -15.1;
		glow.position.y = 2;
		scene.add(glow);

		// Create mountains - optimize by reducing vertices
		const mountainGeometry = new THREE.BufferGeometry();
		const mountainVertices = [];

		// Generate mountain vertices - reduced number of points for better performance
		for (let i = -20; i < 20; i += 0.8) {
			// Increased step size from 0.5 to 0.8
			const height = Math.abs(Math.sin(i * 0.2) * 3) + Math.random() * 0.5;
			mountainVertices.push(i, height - 2, -10);
			mountainVertices.push(i, -2, -10);
		}

		mountainGeometry.setAttribute(
			"position",
			new THREE.Float32BufferAttribute(mountainVertices, 3),
		);
		const mountainMaterial = new THREE.LineBasicMaterial({ color: 0x00ffff });
		const mountains = new THREE.LineSegments(
			mountainGeometry,
			mountainMaterial,
		);
		scene.add(mountains);

		// Create stars - reduce number for better performance
		const starsGeometry = new THREE.BufferGeometry();
		const starsVertices = [];

		// Reduced number of stars from 1000 to 500
		for (let i = 0; i < 500; i++) {
			const x = THREE.MathUtils.randFloatSpread(100);
			const y = THREE.MathUtils.randFloatSpread(50) + 5;
			const z = THREE.MathUtils.randFloatSpread(50) - 20;
			starsVertices.push(x, y, z);
		}

		starsGeometry.setAttribute(
			"position",
			new THREE.Float32BufferAttribute(starsVertices, 3),
		);
		const starsMaterial = new THREE.PointsMaterial({
			color: 0xffffff,
			size: 0.1,
			transparent: true,
			opacity: 0.8,
		});
		const stars = new THREE.Points(starsGeometry, starsMaterial);
		scene.add(stars);

		// Animation loop with performance optimizations
		const animate = () => {
			animationFrameRef.current = requestAnimationFrame(animate);

			// Rotate grid
			horizontalGrid.rotation.y += 0.002;

			// Pulse sun - optimize by checking if visible
			if (sun.visible) {
				const time = Date.now() * 0.001;
				sun.scale.set(1 + Math.sin(time) * 0.1, 1 + Math.sin(time) * 0.1, 1);
				glow.scale.set(
					1 + Math.sin(time * 0.8) * 0.2,
					1 + Math.sin(time * 0.8) * 0.2,
					1,
				);
			}

			// Animate stars - reduce rotation speed for better performance
			stars.rotation.y += 0.0003;

			renderer.render(scene, camera);
		};

		animate();

		// Handle resize
		const handleResize = () => {
			camera.aspect = window.innerWidth / window.innerHeight;
			camera.updateProjectionMatrix();
			renderer.setSize(window.innerWidth, window.innerHeight);
			renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Limit pixel ratio on resize too
		};

		window.addEventListener("resize", handleResize);

		// Cleanup
		return () => {
			window.removeEventListener("resize", handleResize);
			if (animationFrameRef.current) {
				cancelAnimationFrame(animationFrameRef.current);
			}

			// Store containerRef.current in a variable to avoid the React hooks/exhaustive-deps warning
			const container = containerRef.current;
			const renderer = rendererRef.current;
			if (container && renderer) {
				container.removeChild(renderer.domElement);
			}

			// Dispose of geometries and materials to prevent memory leaks
			sunGeometry.dispose();
			sunMaterial.dispose();
			glowGeometry.dispose();
			glowMaterial.dispose();
			mountainGeometry.dispose();
			mountainMaterial.dispose();
			starsGeometry.dispose();
			starsMaterial.dispose();

			if (renderer) renderer.dispose();
		};
	}, []);

	// Fixed z-index to ensure it's behind UI elements
	return (
		<div
			ref={containerRef}
			className="fixed inset-0 z-[-2] pointer-events-none"
			style={{ opacity: 0.7 }}
		/>
	);
}
