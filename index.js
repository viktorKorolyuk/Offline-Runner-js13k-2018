const canvas = document.getElementById("canvas");
const drawCTX = canvas.getContext("2d");

window.DEBUG = false;
var sound_output;
const AUDIO_CTX = new AudioContext();

const ENVIRONMENT = {
	space: -200,
	radius: null,
	xCenter: null,
	yCenter: null,
	speed: 0,
	enemies: 10,
	noise: []
}

const TIME_VISUALIZATION = {
	deg: 60,
	speed: 0.05,
	colour_DAY: "#FFCA3B",
	colour_NIGHT: "#3A3A3A",
	NIGHT_ENTITY_NOISE: []

}

const PLAYER = {
	rect: new Rect(0, 0, 50, 100),
	velocity: 0,
	time_in_air: 0,
	rate: 1,
	color: "white",
	onGround: function () {
		return PLAYER.rect.y + PLAYER.rect.height >= ENVIRONMENT.yCenter - 2 * ENVIRONMENT.radius / 2;
	},

	jump: function () {
		if (PLAYER.onGround()) {
			PLAYER.time_in_air = 0;
			PLAYER.velocity = 15;

			// Hack
			PLAYER.rect.setY(PLAYER.rect.y - .1);
			beep(410);
		}
	}
}

const ENEMY_PROPERTIES = {
	colour: "#ff3333",
	type: "enemy",
	width: 50 / 2,
	height: 100,
	min_enemy_dist: 350
}

const ENEMY_LENGTHS = [1, 2, 3]

function Entity(type = "", colour = "white", deg = 0, width = 50, height = 100) {
	this.rect = new Rect(0, 0, width, height);
	this.current_deg = deg;
	this.offset = 1;
	this.type = type;
	this.colour = colour;
	this.positions = {};
}

CURRENT_ENTITIES = [];

// Create enemies
var AVAILABLE_ENTITY_SPAWN_ROTATION = 0;

function init() {
	canvas.style.marginTop = 0;
	canvas.width = window.innerWidth;
	canvas.height = window.innerHeight;

	let calcRad = (canvas.height - ENVIRONMENT.space * 2) / 2;
	ENVIRONMENT.radius = calcRad / Math.sin(60 * 180 / Math.PI)

	ENVIRONMENT.xCenter = canvas.width / 2 * 1;
	ENVIRONMENT.yCenter = canvas.height + ENVIRONMENT.radius / 2;

	// Set position of collider
	PLAYER.rect.setX(ENVIRONMENT.xCenter - PLAYER.rect.width / 2);
	PLAYER.rect.setY(ENVIRONMENT.yCenter - 2.5 * ENVIRONMENT.radius / 2 - PLAYER.rect.height);

	window.AVAILABLE_ENTITY_SPAWN_ROTATION = 0;
	for (i = 0; i < ENVIRONMENT.enemies; i++) {
		spawnEntity();
	}

	// Create the animation loop
	setInterval(() => requestAnimationFrame(update), 50);
}

function spawnEntity() {
	let choice = ENEMY_LENGTHS[Math.floor(Math.random() * ENEMY_LENGTHS.length)];
	let min_height = 32;
	for (let i = 0; i < choice; i++) {
		let spawnHeight = min_height + Math.floor(Math.random() * (min_height - 12));

		// Create a new enemy entity
		let en = new Entity(ENEMY_PROPERTIES.type, ENEMY_PROPERTIES.colour, AVAILABLE_ENTITY_SPAWN_ROTATION, ENEMY_PROPERTIES.width, spawnHeight);
		CURRENT_ENTITIES.push(en);

		// Adjust the global available degree value to prevent overlap with created enemies 
		AVAILABLE_ENTITY_SPAWN_ROTATION -= cosinelaw_reversed(ENVIRONMENT.radius, ENVIRONMENT.radius, ENEMY_PROPERTIES.width) * 180 / Math.PI;
	}
	AVAILABLE_ENTITY_SPAWN_ROTATION -= cosinelaw_reversed(ENVIRONMENT.radius, ENVIRONMENT.radius, ENEMY_PROPERTIES.min_enemy_dist) * 180 / Math.PI;
}

window.onkeydown = ev => {
	switch (ev.code) {
		case "Space":
			PLAYER.jump();
			break;
		case "ArrowDown":
		case "ShiftLeft":
			PLAYER.rect.height = 50;
			PLAYER.rate = 0;
			break;
	}
}

window.onkeyup = ev => {
	switch (ev.code) {
		case "ArrowDown":
		case "ShiftLeft":
			PLAYER.rect.height = 100;
			PLAYER.rate = 1;
			break;
	}
}

function update() {

	jump: {
		PLAYER.time_in_air++;
		PLAYER.rect.y -= PLAYER.velocity;

		// Deaccelerate
		if (PLAYER.rate === 1)
			PLAYER.velocity = PLAYER.velocity + PLAYER.time_in_air * (-9.81 / 64);
		else PLAYER.velocity = PLAYER.velocity + PLAYER.time_in_air * (-9.81 / (64))
		// PLAYER.velocity -= 0.5;

		if (PLAYER.onGround()) {
			PLAYER.velocity = 0;
			PLAYER.rect.y = ENVIRONMENT.yCenter - 2 * ENVIRONMENT.radius / 2 - PLAYER.rect.height;
		}
	}

	enemycollider: {
		PLAYER.color = "white";
		for (var i = 0; i < CURRENT_ENTITIES.length; i++) {
			updateEnemy(CURRENT_ENTITIES[i]);
			checkForCollision(PLAYER, CURRENT_ENTITIES[i]);
		}
	}

	TIME_VISUALIZATION: {
		TIME_VISUALIZATION.deg += TIME_VISUALIZATION.speed;
		TIME_VISUALIZATION.deg %= 360;
	}

	draw();
}

function checkForCollision(subject, TARGET) {
	let currentEntity = TARGET;

	/*
	 * Check if the enemey intersects with the player
	 */
	function multiInRange(POINTS1, POINTS2) {

	}

	pos1X = Math.min(ENVIRONMENT.xCenter + currentEntity.positions.pos1.x, ENVIRONMENT.xCenter + currentEntity.positions.pos2.x);
	pos2X = Math.max(ENVIRONMENT.xCenter + currentEntity.positions.pos1.x, ENVIRONMENT.xCenter + currentEntity.positions.pos2.x);
}

/**
 * Update the position of the entity around the circular world.
 * @param {Entity} entity Entity to update
 */
function updateEnemy(entity) {
	let length = ENVIRONMENT.radius;
	rad = entity.current_deg * (Math.PI / 180);
	let pos = circleLocation(length, rad);
	let _x = ENVIRONMENT.xCenter + pos.x;
	let _y = ENVIRONMENT.yCenter - pos.y;


	// If it is a flying enemy, increase the radius
	let r = ENVIRONMENT.radius + entity.offset * 60;

	// Sets height for object.
	let displayRect = new Rect(0, 0, entity.offset == 1 ? 100 : entity.rect.width, entity.offset == 1 ? 50 : entity.rect.height * Math.abs(Math.sin(entity.rect.x / 100)) * 2)
	entity.rect = displayRect;
	// Perpendicular line (90deg)
	let xCenter = ENVIRONMENT.xCenter;
	let yCenter = ENVIRONMENT.yCenter;

	// Calculate the positions of all four corners
	let POSITIONS = two_d_circleLocation(r, -displayRect.width, displayRect.height, xCenter, yCenter, rad);
	entity.positions = POSITIONS;
	entity.rect.setX(_x);
	entity.rect.setY(_y);
	entity.current_deg = (entity.current_deg + 1 + ENVIRONMENT.speed) % 360;

}

function draw() {
	setBg("#222222");
	setStroke("#aaaaaa");

	if (window.DEBUG) drawGrid();

	draw_TIME_VISUALIZATION();
	drawBg("#bada55", "#222222", true);

	drawPlayer();
	drawEntities();

	if (window.DEBUG === true) {

		// Draw floor
		drawCTX.beginPath();
		drawCTX.moveTo(0, ENVIRONMENT.yCenter - 2 * ENVIRONMENT.radius / 2);
		drawCTX.lineTo(canvas.width, ENVIRONMENT.yCenter - 2 * ENVIRONMENT.radius / 2);
		drawCTX.closePath();

		setStroke("red");
		drawCTX.stroke();

		//Draw distance line
		drawCTX.beginPath();
		drawCTX.moveTo(ENVIRONMENT.xCenter - PLAYER.rect.width / 2 - 10 + 5, ENVIRONMENT.yCenter - 2 * ENVIRONMENT.radius / 2);
		drawCTX.lineTo(ENVIRONMENT.xCenter - PLAYER.rect.width / 2 - 10, ENVIRONMENT.yCenter - 2 * ENVIRONMENT.radius / 2);
		drawCTX.lineTo(PLAYER.rect.x - 10, PLAYER.rect.y + PLAYER.rect.height);
		drawCTX.lineTo(PLAYER.rect.x - 5, PLAYER.rect.y + PLAYER.rect.height);
		drawCTX.closePath();

		setStroke("white");
		drawCTX.stroke();

		drawCTX.font = "20px Georgia";
		setFill("white");
		drawCTX.fillText(__x + " : " + __y, 15, 55);
	}

}

function draw_TIME_VISUALIZATION() {
	with(drawCTX) {
		let r = ENVIRONMENT.radius * 1.5;

		let _pos = circleLocation(r, TIME_VISUALIZATION.deg * Math.PI / 180);
		beginPath();
		arc(ENVIRONMENT.xCenter + _pos.x, ENVIRONMENT.yCenter - _pos.y, ENVIRONMENT.radius / 8, 0, Math.PI * 2);
		closePath();
		setFill(TIME_VISUALIZATION.colour_DAY);
		fill();

		// _pos = circleLocation(-r, TIME_VISUALIZATION.deg * Math.PI / 180);
		beginPath();
		// Flip the displacement of the center. This allows skipping double-calculation with trigonometric functions
		arc(ENVIRONMENT.xCenter - _pos.x, ENVIRONMENT.yCenter + _pos.y, ENVIRONMENT.radius / 8, 0, Math.PI * 2);
		closePath();
		setFill(TIME_VISUALIZATION.colour_NIGHT);
		fill();
		drawNoise(TIME_VISUALIZATION.NIGHT_ENTITY_NOISE, 10, ENVIRONMENT.xCenter - _pos.x, ENVIRONMENT.yCenter + _pos.y, ENVIRONMENT.radius / 8, 3, 10, e => { });
	}
}

function drawEntities() {
	with(drawCTX) {

		// Based on the degree (entity.current_deg), set the position
		for (let i = 0; i < CURRENT_ENTITIES.length; i++) {
			let entity = CURRENT_ENTITIES[i];

			with(drawCTX) {
				// Perpendicular line (90deg)
				let xCenter = ENVIRONMENT.xCenter;
				let yCenter = ENVIRONMENT.yCenter;

				// Calculate the positions of all four corners
				let POSITIONS = entity.positions;
				setStroke("white");
				beginPath();

				// Draw the first bottom point
				moveTo(POSITIONS.pos1.x + xCenter, -POSITIONS.pos1.y + yCenter);

				// Draw the other bottom point
				lineTo(POSITIONS.pos2.x + xCenter, -POSITIONS.pos2.y + yCenter);

				// Draw the top-right point
				lineTo(POSITIONS.pos3.x + xCenter, -POSITIONS.pos3.y + yCenter);

				// Draw the top-left point
				lineTo(POSITIONS.pos4.x + xCenter, -POSITIONS.pos4.y + yCenter);

				// Connect back to start (bottom-left point)
				lineTo(POSITIONS.pos1.x + xCenter, -POSITIONS.pos1.y + yCenter);

				setFill(entity.colour);
				fill();
			}
		}
	}
}

function drawPlayer() {
	setFill(PLAYER.color)
	drawCTX.fillRect(PLAYER.rect.x, PLAYER.rect.y, PLAYER.rect.width, PLAYER.rect.height);
}

function drawBg(color1, color2, ENABLE_NOISE = true) {

	with(drawCTX) {
		beginPath()
		arc(ENVIRONMENT.xCenter, ENVIRONMENT.yCenter, ENVIRONMENT.radius, Math.PI * 2, 360);
		closePath();
		setFill(color1)
		fill();

		beginPath();
		setFill(color2);
		arc(ENVIRONMENT.xCenter, ENVIRONMENT.yCenter, ENVIRONMENT.radius / 1.01, Math.PI * 2, 360);
		closePath();
		fill();

		if (ENABLE_NOISE) drawNoise(ENVIRONMENT.noise, 200, ENVIRONMENT.xCenter, ENVIRONMENT.yCenter, ENVIRONMENT.radius, 2, 10, (index, ctx) => {
			ctx[index].deg = (ctx[index].deg + 1 + ENVIRONMENT.speed) % 360;
		});
	}
}

/**
 *
 * @param {[]} ctx Array holding particle positions
 * @param {number} AMOUNT Integer value holding number of particles
 * @param {number} xCenter X-position of circle (center)
 * @param {number} yCenter Y-position of circle (center)
 * @param {function} UPDATE Optional function to run before each draw
 */
function drawNoise(ctx, AMOUNT, xCenter, yCenter, parentRadius, minSize, maxSize, UPDATE = (index, noiseArray) => {}) {
	with(drawCTX) {
		for (let i = 0; i < AMOUNT; i++) {

			// populate
			if (ctx.length < AMOUNT) {
				ctx.push({
					radius: Math.floor(Math.random() * (parentRadius - 12)),
					deg: Math.floor(Math.random() * 360),
					size: minSize + Math.floor(Math.random() * (maxSize - minSize))
				});
			}
			UPDATE(i, ctx);

			let colour = ctx[i].size / maxSize * 51 + 20; // Create an R/G/B value based on the size of the noise.
			pos = circleLocation(ctx[i].radius, ctx[i].deg * Math.PI / 180);
			beginPath();
			setFill(`rgb(${colour},${colour}, ${colour}`);
			arc(xCenter + pos.x, yCenter - pos.y, ctx[i].size, Math.PI * 2, 360);
			closePath();
			fill();
		}
	}
}

base: {

	function drawGrid() {

		const squareSize = 20;

		// Vertical Lines
		for (i = 0; i <= canvas.width; i += squareSize) {
			drawCTX.beginPath();
			drawCTX.moveTo(i, 0);
			drawCTX.lineTo(i, canvas.height);
			drawCTX.stroke();
		}

		// Horizontal Lines
		for (i = 0; i <= canvas.height; i += squareSize) {
			drawCTX.beginPath();
			drawCTX.moveTo(0, i);
			drawCTX.lineTo(canvas.width, i);
			drawCTX.stroke();
		}
	}

	function setFill(color) {
		drawCTX.fillStyle = color;
	}

	function setStroke(color) {
		drawCTX.strokeStyle = color;
	}

	function setColor(color) {
		setFill(color);
		setStroke(color);
	}

	function setBg(color) {
		this.temp = drawCTX.fillStyle;
		drawCTX.fillStyle = color;
		drawCTX.clearRect(0, 0, canvas.width, canvas.height);
		drawCTX.fillRect(0, 0, canvas.width, canvas.height - 1);
		drawCTX.fillStyle = this.temp;
	}

	/**
	 * Return if a value is within a range of two other values.
	 * `doEq` determines if the range is inclusive or exclusive.
	 * @param {*} min Minumum value to test
	 * @param {*} max Maxmimum value to test
	 * @param {*} test Value to test
	 * @param {*} doEq Allow value to equal min or max
	 */
	function inRange(min, max, test, doEq = false) {
		return doEq == true ? min <= test && test <= max : min < test && test < max;
	}

	/**
	 * Checks for range of points in two dimensions.
	 * @param {[2]} MIN_POINT Two Dimensional Point (Array)
	 * @param {[2]} MAX_POINT Two Dimensional Point (Array)
	 * @param {[2]} TEST_POINT Two Dimensional Point (Array)
	 * @param {Boolean} doEq Allow value to equal min or max
	 */
	function inRange2D(MIN_POINT, MAX_POINT, TEST_POINT, doEq) {
		return (inRange(MIN_POINT[0], MAX_POINT[0], TEST_POINT[0], doEq) && inRange(MIN_POINT[1], MAX_POINT[1], TEST_POINT[1], doEq));
	}

	/**
	 * Map a radius and an angle to x and y points on a circle.
	 * @param {*} radius Radius of circle
	 * @param {*} radAngle Angle to map to circle (in radians: 180 deg = PI rad)
	 */
	function circleLocation(radius, radAngle) {
		return {
			x: Math.cos(radAngle) * radius,
			y: Math.sin(radAngle) * radius
		};
	}

	/**
	 * Maps a rectangle to a rotation around a circle.
	 * @param {*} r
	 * @param {*} width 
	 * @param {*} height 
	 * @param {*} xCenter 
	 * @param {*} yCenter 
	 * @param {*} rad Angle in radians
	 * @returns Object with four positions
	 */
	function two_d_circleLocation(r, width, height, xCenter, yCenter, rad) {
		width /= 2;
		let l = Math.sqrt(width * width + r * r);

		// Bottom-right point
		let rad2 = Math.atan(width / r);

		// Bottom-left point
		let pos1 = circleLocation(l, rad2 + rad);
		rad2 = -rad2;
		let pos2 = circleLocation(l, rad2 + rad);

		// Top-right point
		l = Math.sqrt(width * width + Math.pow(r + height, 2));
		rad2 = -Math.atan(width / (r + height));

		let pos3 = circleLocation(l, rad2 + rad);

		// Top-left point
		rad2 = -rad2;
		let pos4 = circleLocation(l, rad2 + rad);

		return {
			pos1,
			pos2,
			pos3,
			pos4
		};
	}

	/**
	 * Play a sound from the browser.
	 * @param {number} freq An integer frequency
	 */
	function beep(freq = 410) {
		if (sound_output) sound_output.stop();

		sound_output = AUDIO_CTX.createOscillator();
		let audioGain = AUDIO_CTX.createGain();
		sound_output.frequency.value = freq;
		sound_output.type = "sine";
		audioGain.gain.exponentialRampToValueAtTime(0.00001, AUDIO_CTX.currentTime + 0.08);

		sound_output.connect(audioGain);
		audioGain.connect(AUDIO_CTX.destination);
		sound_output.start(0);
	}

	// Cosine law: c^2 = a^2 + b^2 - 2ab * cos(C)
	function cosinelaw_reversed(a, b, c) {
		return Math.acos((c * c - a * a - b * b) / (-2 * a * b));
	}
}

// DEBUG TOOLS
window.onmousemove = e => {
	window.__x = e.x;
	window.__y = e.y;
}

init();