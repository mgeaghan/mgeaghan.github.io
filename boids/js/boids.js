class Boids {
	constructor(canvas_id, props) {
		this.width = props.hasOwnProperty("width") ? props.width : this.getWindowWidth();
		this.height = props.hasOwnProperty("height") ? props.height : this.getWindowHeight();
		this.canvas = document.getElementById(canvas_id);
		this.canvas.width = this.width;
		this.canvas.height = this.height;
		this.ctx = this.canvas.getContext("2d");
		this.boids = [];
		this.radius = props.hasOwnProperty("radius") ? props.radius : 5;
		this.num = props.hasOwnProperty("num") ? props.num : 250;
		this.deltaV = props.hasOwnProperty("deltaV") ? props.deltaV : 1;
		this.deltaTheta = props.hasOwnProperty("deltaTheta") ? props.deltaTheta : (Math.PI / 40);
		this.frameInterval = props.hasOwnProperty("frameInterval") ? props.frameInterval : 25;
		this.maxTurnSpeed = props.hasOwnProperty("maxTurnSpeed") ? props.maxTurnSpeed : Math.PI/4;
		this.neighbourRadius = props.hasOwnProperty("neighbourRadius") ? props.neighbourRadius : 50;
		this.speed = props.hasOwnProperty("speed") ? props.speed : 10;
		this.optimalSep = props.hasOwnProperty("optimalSep") ? props.optimalSep : 100;
		this.lastUpdate = undefined;
		this.highlightOne = props.hasOwnProperty("highlightOne") ? props.highlightOne : false;
		this.colour = props.hasOwnProperty("colour") ? props.colour : "red";
		this.init();
	}

	createBoid() {
		return new Boid(this.ctx, {
			x: Math.floor(Math.random() * this.canvas.width),
			y: Math.floor(Math.random() * this.canvas.height),
			radius: this.radius,
			colour: "red",
			maxTurnSpeed: this.maxTurnSpeed,
			neighbourRadius: this.neighbourRadius,
			xmax: this.canvas.width,
			ymax: this.canvas.height,
			speed: this.speed,
			optimalSep: this.optimalSep,
		})
	}

	init() {
		this.boids = [];
		for (let i = 0; i < this.num; i++) {
			this.boids.push(this.createBoid());
		}
		for (let b in this.boids) {
			let boid = this.boids[b];
			boid.makeAware(this.boids);
			boid.getNeighbours();
			boid.draw();
		}
	}

	getWindowWidth() {
		return document.getElementsByTagName("html")[0].clientWidth;
	}

	getWindowHeight() {
		return document.getElementsByTagName("html")[0].clientHeight;
	}

	clear() {
		this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
	}

	updateSize(width, height) {
		this.width = width;
		this.height = height;
		this.canvas.width = this.width;
		this.canvas.height = this.height;
		for (let b in this.boids) {
			this.boids[b].updateXYMax(this.width, this.height);
		}
	}

	updateNumber(newNum) {
		if (newNum > this.num) {
			for (let i = 0; i < (newNum - this.num); i++) {
				this.boids.push(this.createBoid());
			}
			for (let b in this.boids) {
				let boid = this.boids[b];
				boid.makeAware(this.boids);
				boid.getNeighbours();
				this.clear();
				boid.draw();
			}
			this.num = newNum;
		} else if (newNum < this.num) {
			this.boids = this.boids.slice(0, newNum);
			this.num = newNum;
		}
	}

	updateMaxTurnSpeed(newSpeed) {
		for (let b in this.boids) {
			this.boids[b].updateMaxTurnSpeed(newSpeed);
		}
	}

	updateRadius(newRadius) {
		for (let b in this.boids) {
			this.boids[b].updateRadius(newRadius);
		}
	}

	updateSpeed(newSpeed) {
		for (let b in this.boids) {
			this.boids[b].updateSpeed(newSpeed);
		}
	}

	updateSeparation(newSeparation) {
		for (let b in this.boids) {
			this.boids[b].updateSeparation(newSeparation);
		}
	}

	setHighlightOne(checked) {
		this.highlightOne = checked;
		if (!this.highlightOne) {
			this.boids[0].colour = this.colour;
		}
	}

	drawBoid(boid) {
		boid.draw();
	}

	stopBoid(boid) {
		let deltaX = 0;
		let deltaY = 0;
		if (boid.x < 0) {
			deltaX = -boid.x;
		} else if (boid.x > this.canvas.width) {
			deltaX = this.canvas.width - boid.x;
		}
		if (boid.y < 0) {
			deltaY = -boid.y;
		} else if (boid.y > this.canvas.height) {
			deltaY = this.canvas.height - boid.y;
		}
		if (deltaX != 0 || deltaY != 0) {
			boid.updatePosition(deltaX, deltaY);
		}
	}

	move(timestamp) {
		if (this.lastUpdate === undefined) {
			this.lastUpdate = timestamp;
		}
		const elapsed = timestamp - this.lastUpdate;
		if (elapsed > this.frameInterval) {
			this.clear();
			for (let b in this.boids){
				let boid = this.boids[b];
				boid.updateVelocity();
				boid.getNeighbours();
				this.stopBoid(boid);
				this.drawBoid(boid);
			}
			this.lastUpdate = timestamp;
			// DEBUG
			if (this.highlightOne) {
				this.boids[0].colour = "yellow";
				this.boids[0].drawHeading(5 * this.speed);
				this.boids[0].drawNeighbourRadius();
			}
			// END DEBUG
		}
		requestAnimationFrame(timestamp => this.move(timestamp));
	}

	animateRandom() {
		requestAnimationFrame(timestamp => this.move(timestamp));
	}
}

// SETUP CONTROLS
// let slider_number = document.getElementById("slider-number");
let field_number = document.getElementById("field-number");
let slider_turn = document.getElementById("slider-turn");
let slider_radius = document.getElementById("slider-radius");
let slider_speed = document.getElementById("slider-speed");
let slider_sep = document.getElementById("slider-sep");
let highlight_one = document.getElementById("highlight-one");
/// END SETUP CONTROLS

// CREATE BOIDS
let boids = new Boids("boids-canvas", {
	num: field_number.value,
	frameInterval: 25,
	maxTurnSpeed: slider_turn.value,
	neighbourRadius: slider_radius.value,
	speed: slider_speed.value,
	optimalSep: slider_sep.value,
	highlightOne: highlight_one.checked,
});
boids.animateRandom();
// END CREATE BOIDS

// CONTROLS
window.addEventListener('resize', () => {
	boids.updateSize(boids.getWindowWidth(), boids.getWindowHeight() * 0.8);
});

field_number.oninput = () => {
	if (field_number.value === "" || field_number.value < 1) {
		field_number.value = 1;
	} else if (field_number.value > 1000) {
		field_number.value = 1000;
	}
	field_number.value = Math.floor(field_number.value);
	boids.updateNumber(field_number.value);
};

slider_turn.oninput = () => {
	boids.updateMaxTurnSpeed(slider_turn.value);
};

slider_radius.oninput = () => {
	boids.updateRadius(slider_radius.value);
};

slider_speed.oninput = () => {
	boids.updateSpeed(slider_speed.value);
};

slider_sep.oninput = () => {
	boids.updateSeparation(slider_sep.value);
};

highlight_one.onclick = () => {
	boids.setHighlightOne(highlight_one.checked);
};
// END CONTROLS