/**
 * Sound Effects Manager
 * Handles playing sound effects for different app events
 * With a toggle to enable/disable sounds
 */

class SoundManager {
	constructor() {
		// Initialize with default state (enabled)
		this.soundsEnabled = localStorage.getItem("soundsEnabled") !== "false";
		this.sounds = {};
		this.initSounds();
	}

	/**
	 * Initialize sound library (encoded as base64 strings to avoid external dependencies)
	 */
	initSounds() {
		// Success sound (short pleasant chime)
		this.sounds.success =
			"data:audio/mp3;base64,SUQzBAAAAAABEVRYWFgAAAAtAAADY29tbWVudABCaWdTb3VuZEJhbmsuY29tIC8gTGFTb25vdGhlcXVlLm9yZwBURU5DAAAAHQAAA1N3aXRjaCBQbHVzIMKpIE5DSCBTb2Z0d2FyZQBUSVQyAAAABgAAAzIyMzUAVFNTRQAAAA8AAANMYXZmNTcuODMuMTAwAAAAAAAAAAAAAAD/80DEAAAAA0gAAAAATEFNRTMuMTAwVVVVVVVVVVVVVUxBTUUzLjEwMFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVf/zQsRbAAADSAAAAABVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVf/zQMSkAAADSAAAAABVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV";

		// Warning/alert sound (notification blip)
		this.sounds.alert =
			"data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4LjI5LjEwMAAAAAAAAAAAAAAA//tUwAAAAAAAAAAAAAAAAAAAAAAASW5mbwAAAA8AAAASAAAeMwAUFBQUFBQUFBQkJCQkJCQkJCQ0NDQ0NDQ0NDRERERERERERERUVFRUVFRUVFRkZGRkZGRkZGR0dHR0dHR0dHSEhISEhISEhISUlJSUlJSUlJSkpKSkpKSkpKS0tLS0tLS0tLS0xMTExMTExMTU1NTU1NTU1NTk5OTk5OTk5OT09PT09PT09PT///////////////8AAAAATGF2YzU4LjU0AAAAAAAAAAAAAAAAJAYAAAAAAAAAHjOVrRiy//tUxAAB8AAAf4AAAAwAAAL/AAAAQDQ0NDQ0NDRCQ0VFRUVFRUFCQkJCQkJCRERFRUVFRUVFSEpKSkpKSkpIPj4+Pj4+Pj4+Tk9PT09PT05OTk5OTk5OTk5KSkpKSkpKSkpKSkpKSkpKSn/+xDE0wAL9TlX+YwAAnwpKz8nhDT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PTABAAAA/vAxNMAC/VfZ+YUAIKSKu7/JiQiZb+e/sMQJJEb/8oCIexj/5L54GIMA//5D4WEf/+W5C0D//8gM6in//kPQtH//yJRTAP//4z4Vgv//I0rSn//zVojIGF///qOX7///KdXrCP//+JwgGYR///6jYRnpf//8r0bBGP///sTkAaiH///0JxwMyn/5QqCIE0H/+5JyXun/agAIAAAG3/8AAP/7UsQbg8AAAaQAAAAgAAA0gAAABIAAAAAAAAAAAABERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERE";

		// Duplicate found sound (sci-fi blip)
		this.sounds.duplicate =
			"data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4LjI5LjEwMAAAAAAAAAAAAAAA//tQwAAAAAAAAAAAAAAAAAAAAAAASW5mbwAAAA8AAAA5AABwpgAKCg8PFBQZGRkZHx8kJCkpKSkvLzQ0NDQ5OT4+Q0NDQ0hITU1NTVJSWFhYWF1dYmJiYmdnbGxsbHFxdnZ2dnx8gYGBgYaGi4uLi5CQlZWVlZuboCAgICAlJSsrKysrKzAwMDAwNTU7Ozs7OztAQEBAQEZGS0tLS0tLUFBQUFBVVVtbW1tbW2BgYGBgZmZra2tra2twcHBwcHV1e3t7e3t7gICAjI2ZmZmZpKS6urq6z8/k5OTk+fn///8AAAAATGF2YzU4LjU0AAAAAAAAAAAAAAAAJAQAAAAAAAAAcKZZzSzT//tQxAAAEvFLWfmPACI8JqW/MSAEiqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq//sQxMKDwAABpAAAACAAADSAAAAEqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq";

		// Completion sound (success complete)
		this.sounds.complete =
			"data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4LjI5LjEwMAAAAAAAAAAAAAAA//tQwAAAAAAAAAAAAAAAAAAAAAAASW5mbwAAAA8AAAAlAAAyQAAEBAgICAwMEBAQEBQUGBgYGBwcICAgICQkKCgoKCwsMDAwMDQ0ODg4ODw8QEBAQERETExMTFBQVFRUVFhYXFxcXGBgZGRkZGhobGxsbHBwdHR0dHh4fHx8fICAhISEhIiIjIyMjJCQlJSUlJiYnJycnKCgpKSkpKissLCwsLS0uLi4uLy8wMDAwMTEyMjIyNDQ1NTU1NjY3Nzc3ODg5OTk5Ojo7Ozs7PDw9PT09Pj4///8AAAAATGF2YzU4LjU0AAAAAAAAAAAAAAAAJAAAAAAAAAAAMkDRjMh7//tQxAAABewXIfTxACICPCo/PKAE//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////sQxKYDwAABpAAAACAAADSAAAAE////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////";

		// Click sound (subtle UI click)
		this.sounds.click =
			"data:audio/mp3;base64,SUQzAwAAAAAHS1RJVDIAAAAFAAAAUGFnZUEA/+M4xAACGDJLQVsYAAsIAHic7dM9DoJAFAXgnUx4oqW9R+BIXIBSYi8kt5FiTay0oPEkVBZWJhRmLCj5fvLy5jUzCRAVJCCVUlF9iK3/JNV48Zkbfy6NL1qj1qrB4rZYrD6zxVxlZ+Vz5RKxiFVsYnsOHOMQpzjHwJjt2I29OPCJT1iZrvTMwJyYm5eiLw3MxJyYExNVj3q1p7azPTuzHTuxFetYxiyqz9XtV2vb2kYTTTShfF9LNVlHE0000fbLR9N0NLkVJCQkJP3Jy5OXJ687L09enrw8eXny8uTlyeudJyFJSEiS5CQhSUiSpEhIEpKEJCFJSBKShCQhSUgSkoQkIUlIEpKEJCFJSBKShCQhSUgSkoQkIUlIEpKEJCFJSBKShKQlb01CEpKEpAEuIQl9Abr6wf/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=";
	}

	/**
	 * Toggle sound effects on/off
	 * @returns {boolean} - New sound state
	 */
	toggleSounds() {
		this.soundsEnabled = !this.soundsEnabled;
		localStorage.setItem("soundsEnabled", this.soundsEnabled.toString());
		return this.soundsEnabled;
	}

	/**
	 * Get current sound state
	 * @returns {boolean} - Whether sounds are enabled
	 */
	isSoundEnabled() {
		return this.soundsEnabled;
	}

	/**
	 * Play a sound by its name
	 * @param {string} soundName - Name of the sound to play
	 */
	playSound(soundName) {
		if (!this.soundsEnabled || !this.sounds[soundName]) return;

		try {
			const audio = new Audio();
			audio.src = this.sounds[soundName];
			audio
				.play()
				.catch((e) => console.log("Audio play prevented by browser policy"));
		} catch (error) {
			console.log("Failed to play sound:", error);
		}
	}
}

// Create a global sound manager instance
const soundManager = new SoundManager();
