class InstructionsScreen {
	#testStarted = false
	constructor(smallScreenElementId, instructions, onStartCallback) {
		this.smallScreenElement = document.getElementById(smallScreenElementId);
		this.instructions = instructions;
		this.onStartCallback = onStartCallback;

		this.renderInstructions(); // Render instructions inside #small_screen

		// Add a click event to start the test when instructions are clicked
		this.smallScreenElement.addEventListener("click", () => this.startTest());
	}

	renderInstructions() {
		const instructionsContainer = document.createElement("div");
		document.getElementById("color_buttons").style.display = "none";
		instructionsContainer.className = "instructions-content";

		this.instructions.forEach((text) => {
			const paragraph = document.createElement("p");
			paragraph.textContent = text;
			instructionsContainer.appendChild(paragraph);
		});

		this.smallScreenElement.appendChild(instructionsContainer);
		this.instructionsContainer = instructionsContainer;
	}

	showInstructions() {
		this.smallScreenElement.style.display = "flex"; // Show small screen with instructions
	}

	hideInstructions() {
		if (this.instructionsContainer) {
			this.smallScreenElement.removeChild(this.instructionsContainer) // Remove instructions from the DOM
		}
		document.getElementById("color_buttons").style.display = "block";
		this.smallScreenElement.style.display = "block";
	}

	startTest() {
		if (this.#testStarted) return;
		this.#testStarted = true;
		this.hideInstructions(); // Clear instructions
		if (typeof this.onStartCallback === "function") {
			this.onStartCallback(); // Notify StroopTest to start the test
		}
	}
}

class StroopTest
{
	#word_display;
	#small_screen;
	#correct_avg_display;
	#incorrect_avg_display;
	#words = ["Siva", "Oranžna", "Modra", "Rdeča"];
	#colors = ["gray", "orange", "blue", "red"];
	#correct_times = [];
	#incorrect_times = [];
	#current_color;
	#timer;
	#startTime;
	#attemptCounter = 0;
	#maxAttempts = 20;
	#hasStarted = false;
	#word_shown = false;
	#hasEnded = false;
	#combinations = [];
	constructor() {
		// Set up the DOM elements
		this.#word_display = document.getElementById("word_display");
		this.#small_screen = document.getElementById("small_screen");
		this.#correct_avg_display = document.getElementById("correct_avg");
		this.#incorrect_avg_display = document.getElementById("incorrect_avg");
		let instructions = [
			"Welcome to the Stroop Test.",
			"Your task is to quickly identify the color of the word displayed, not the word itself.",
			"Click the color button that matches the color of the text as fast as possible.",
			"Click anywhere on the screen to start the test."
		];
		window.addEventListener("beforeunload", (event) => this.#preventReload(event));
		this.#createCombinations();
		this.instructionsScreen = new InstructionsScreen("small_screen", instructions, () => this.#startCountdown());
		this.instructionsScreen.showInstructions();
		// Add event listeners
		// this.#small_screen.addEventListener("click", () => this.#startCountdown());
		// Prevent page reload
	}

	#createCombinations() {
		// Generate all combinations of colors and words
		for (let i = 0; i < this.#colors.length; i++) {
			for (let j = 0; j < this.#words.length; j++) {
				this.#combinations.push({ color: this.#colors[i], word: this.#words[j] });
			}
		}
		console.log(this.#combinations.length);
		// Shuffle the combinations using Fisher-Yates shuffle
		for (let i = this.#combinations.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[this.#combinations[i], this.#combinations[j]] = [this.#combinations[j], this.#combinations[i]];
		}
	}

	#preventReload(event) {
		if (this.#hasStarted && this.#attemptCounter < this.#maxAttempts) {
			event.preventDefault();
			event.returnValue = 'Kdo mislis, da je bolj vstrajen?';
		}
	}

	#startCountdown() {
		if (this.#hasStarted || this.#hasEnded) return;
		this.#hasStarted = true;
		let countdown = 3;
		this.#word_display.innerText = countdown;

		const countdownInterval = setInterval(() => {
			countdown -= 1;
			if (countdown > 0) {
				this.#word_display.innerText = countdown;
			} else if (countdown === 0) {
				this.#word_display.innerText = "Go!";
			} else {
				clearInterval(countdownInterval);
				this.#startTest();
			}
		}, 1000);
	}

	#startTest() {
		this.#nextWord();
	}

	#nextWord() {
		if (this.#attemptCounter >= this.#maxAttempts) {
			this.#endTest();
			return;
		}
		this.#attemptCounter++;
		this.#word_shown = true;

		// Generate a random word and color
		console.log(this.#combinations.length);
		let ix = this.#attemptCounter-1;
		ix = ix%this.#combinations.length;
		const { word, color } = this.#combinations[ix];
		this.#word_display.innerText = word;
		this.#word_display.style.color = color;
		this.#current_color = color;

		// Start the timer for user response
		this.#startTime = new Date().getTime();
		this.#timer = setTimeout(() => {
			if (this.#word_shown) {
				this.#word_shown = false;
				this.#recordResponse(false); // Mark as incorrect if no response within 2 seconds
				this.#displayFeedback(false); // Show "Incorrect!" if timed out
			}
		}, 2000);
	}

	check_response(selectedColor) {
		if (this.#word_shown) {
			clearTimeout(this.#timer); // Clear the timeout to avoid "Incorrect!" on time out
			const reactionTime = new Date().getTime() - this.#startTime;

			const isCorrect = (selectedColor === this.#current_color);
			this.#recordResponse(isCorrect, reactionTime);
			this.#displayFeedback(isCorrect);
			this.#word_shown = false;
		}
	}

	#displayFeedback(isCorrect) {
		this.#word_display.style.color = "white";
		this.#word_display.innerText = isCorrect ? "Pravilno!" : "Narobe!";

		// Wait briefly before showing the next word
		setTimeout(() => {
			if (this.#attemptCounter < this.#maxAttempts) {
				this.#nextWord();
			} else {
				this.#endTest();
			}
		}, 1000); // 1-second delay before the next word
	}

	#recordResponse(isCorrect, reactionTime = 2000) {
		if (isCorrect) {
			this.#correct_times.push(reactionTime);
		} else {
			this.#incorrect_times.push(reactionTime);
		}
		this.#updateAverages();
	}

	#updateAverages() {
		const correct_avg = this.#correct_times.length
			? Math.round(this.#correct_times.reduce((a, b) => a + b) / this.#correct_times.length)
			: 0;
		const incorrect_avg = this.#incorrect_times.length
			? Math.round(this.#incorrect_times.reduce((a, b) => a + b) / this.#incorrect_times.length)
			: 0;

		this.#correct_avg_display.innerText = correct_avg;
		this.#incorrect_avg_display.innerText = incorrect_avg;
	}

	#endTest() {
		this.#hasStarted = false;
		this.#word_shown = false;
		this.#hasEnded = true;

		// Display final averages
		this.#updateAverages();

		// Display "Test complete!" message
		this.#word_display.innerText = "Test complete!";
		this.#word_display.style.color = "white";

		// Hide color buttons and prevent further interaction
		document.getElementById("color_buttons").style.display = "none"; // Hide button
	}
}

// Instantiate the StroopTest class
const stroopTest = new StroopTest();
