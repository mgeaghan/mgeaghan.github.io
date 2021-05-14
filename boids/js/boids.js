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
		this.num = props.hasOwnProperty("num") ? props.num : 10;
		this.deltaV = props.hasOwnProperty("deltaV") ? props.deltaV : 1;
		this.deltaTheta = props.hasOwnProperty("deltaTheta") ? props.deltaTheta : (Math.PI / 40);
		this.frameInterval = props.hasOwnProperty("frameInterval") ? props.frameInterval : 100;
		this.lastUpdate = undefined;
		this.init();
	}

	init() {
		this.boids = [];
		for (let i = 0; i < this.num; i++) {
			this.boids.push(new Boid(this.ctx, {
				x: Math.floor(Math.random() * this.canvas.width),
				y: Math.floor(Math.random() * this.canvas.height),
				radius: this.radius,
				colour: "red",
				xmax: this.canvas.width,
				ymax: this.canvas.height,
				optimalSep: 400,
				speed: 25,
				vmax: 15,
			}));
		}
		for (let b in this.boids) {
			let boid = this.boids[b];
			boid.makeAware(this.boids, this.canvas.width, this.canvas.height);
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

	moveRandom(timestamp) {
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
			// this.boids[0].colour = "yellow";
			// this.boids[0].drawHeading(5);
			// this.boids[0].drawNeighbourRadius();
			// END DEBUG
		}
		requestAnimationFrame(timestamp => this.moveRandom(timestamp));
	}

	animateRandom() {
		requestAnimationFrame(timestamp => this.moveRandom(timestamp));
	}
}

let boids = new Boids("boids-canvas", {
	num: 500,
	frameInterval: 25,
});
boids.animateRandom();

window.addEventListener('resize', () => {
	boids.clear();
	boids.updateSize(boids.getWindowWidth(), boids.getWindowHeight());
	boids.init();
	boids.animateRandom();
});