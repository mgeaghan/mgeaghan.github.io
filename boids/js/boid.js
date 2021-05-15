class Boid {
	constructor(context, props) {
		this.ctx = context;
		this.x = props.hasOwnProperty("x") ? props.x : 0;
		this.y = props.hasOwnProperty("y") ? props.y : 0;
		this.radius = props.hasOwnProperty("radius") ? props.radius : 5;
		this.colour = props.hasOwnProperty("colour") ? props.colour : "red";
		this.maxTurnSpeed = props.hasOwnProperty("maxTurnSpeed") ? props.maxTurnSpeed : Math.PI / 2;
		this.neighbourRadius = props.hasOwnProperty("neighbourRadius") ? props.neighbourRadius : 150;
		this.xmax = props.xmax;
		this.ymax = props.ymax;
		this.vx = 0;
		this.vy = 0;
		this.heading = props.hasOwnProperty("heading") ? Math.min(Math.max(0, props.heading), 2 * Math.PI) : Math.random() * 2 * Math.PI;
		this.speed = props.hasOwnProperty("speed") ? Math.abs(props.speed) : 20;
		this.optimalSep = props.hasOwnProperty("optimalSep") ? props.optimalSep : 100;
		this.boids = [];
		this.neighbours = [];
	}

	draw() {
		this.ctx.beginPath();
		this.ctx.arc(this.x, this.y, this.radius, 0, 2 * Math.PI);
		this.ctx.fillStyle = this.colour;
		this.ctx.fill();
		this.ctx.closePath();
	}

	updatePosition(deltaX, deltaY) {
		this.x += deltaX;
		this.y += deltaY;
	}

	updateXYMax(xmax, ymax) {
		this.xmax = xmax;
		this.ymax = ymax;
	}
	
	updateMaxTurnSpeed(newSpeed) {
		this.maxTurnSpeed = newSpeed;
	}
	
	updateRadius(newRadius) {
		this.neighbourRadius = newRadius;
	}

	updateSpeed(newSpeed) {
		this.speed = newSpeed;
	}

	updateSeparation(newSeparation) {
		this.optimalSep = newSeparation;
	}

	modulo(a, n) {
		return ((a % n) + n) % n;
	}

	updateVelocity(cohesion = true, separation = true, avoidWalls = true, alignment = true) {
		if (cohesion) {
			this.heading += this.seekCentreNeighbours();
		}
		if (separation) {
			this.heading += this.avoidNeighbours();
		}
		if (alignment) {
			this.heading += this.alignWithNeighbours();
		}
		if (avoidWalls) {
			this.heading += this.avoidWalls();
		}
		// this.heading = ((this.heading % (2 * Math.PI)) + (2 * Math.PI)) % (2 * Math.PI);
		this.heading = this.modulo(this.heading, 2 * Math.PI);
		this.vx = Math.cos(this.heading) * this.speed;
		this.vy = Math.sin(this.heading) * this.speed;
		let deltaX = Math.round(this.vx);
		let deltaY = Math.round(this.vy);
		this.updatePosition(deltaX, deltaY);
	}

	makeAware(boids) {
		if (Array.isArray(boids)) {
			this.boids = boids;
		};
	}

	getDistance(x, y) {
		return Math.sqrt(((this.x - x) ** 2) + ((this.y - y) ** 2))
	}

	getNeighbours() {
		this.neighbours = this.boids.filter(boid => this.getDistance(boid.x, boid.y) < this.neighbourRadius);
	}

	getHeading(x, y) {
		let dx = x - this.x;
		let dy = y - this.y;
		if (dx == 0) {
			if (dy > 0) {
				return -Math.PI;
			} else {
				return Math.PI;
			}
		}
		let tmpHeading = Math.atan(dy / dx);
		if (dx > 0) {
			return tmpHeading;
		} else {
			return tmpHeading + Math.PI;
		}
	}

	seek(heading, scale = 1.0) {
		let deltaHeading = heading - this.heading;
		if (deltaHeading < -Math.PI) {
			deltaHeading += (2 * Math.PI);
		} else if (deltaHeading > Math.PI) {
			deltaHeading -= (2 * Math.PI);
		}
		return this.maxTurnSpeed * scale * deltaHeading / Math.PI;
	}

	getCentreHeading() {
		return this.getHeading(this.xmax / 2, this.ymax / 2);
	}

	seekCentreNeighbours() {
		let xNeighbours = this.neighbours.map(b => b.x);
		let yNeighbours = this.neighbours.map(b => b.y);
		let xCentre = xNeighbours.reduce((acc, x) => acc + x, 0) / xNeighbours.length;
		let yCentre = yNeighbours.reduce((acc, y) => acc + y, 0) / yNeighbours.length;
		let distCentreNeighbours = this.getDistance(xCentre, yCentre);
		let turnStrength = distCentreNeighbours / this.neighbourRadius;
		let headingCentreNeighbours = this.getHeading(xCentre, yCentre);
		let diffHeading = Math.abs(headingCentreNeighbours - this.heading);
		if (diffHeading > Math.PI) {
			diffHeading -= Math.PI;
		}
		turnStrength *= (diffHeading / Math.PI);
		let turnSpeed = this.seek(headingCentreNeighbours, turnStrength);
		return turnSpeed;
	}

	avoidNeighbours() {
		let xyNeighbours = this.neighbours.map(b => [b.x, b.y]);
		let distNeighbours = xyNeighbours.map(xy => this.getDistance(xy[0], xy[1]));
		let tooCloseNeighbours = distNeighbours.map(d => d < this.optimalSep && d != 0);
		xyNeighbours = xyNeighbours.filter((xy, i) => tooCloseNeighbours[i]);
		if (xyNeighbours.length == 0) {
			return 0;
		}
		let xCentre = xyNeighbours.reduce((acc, xy) => acc + xy[0], 0) / xyNeighbours.length;
		let yCentre = xyNeighbours.reduce((acc, xy) => acc + xy[1], 0) / xyNeighbours.length;
		let distCentreNeighbours = this.getDistance(xCentre, yCentre);
		let turnStrength = (this.optimalSep - distCentreNeighbours) / this.optimalSep;
		let headingCentreNeighbours = this.getHeading(xCentre, yCentre);
		let diffHeading = Math.abs(headingCentreNeighbours - this.heading);
		if (diffHeading > Math.PI) {
			diffHeading -= Math.PI;
		}
		turnStrength *= (diffHeading / Math.PI);
		let turnSpeed = -this.seek(headingCentreNeighbours, turnStrength);
		return turnSpeed;
	}

	alignWithNeighbours() {
		let headings = this.neighbours.map(n => n.heading);
		let averageHeading = headings.reduce((acc, h) => acc + h) / headings.length;
		let diffHeading = Math.abs(averageHeading - this.heading);
		if (diffHeading > Math.PI) {
			diffHeading -= Math.PI;
		}
		let turnSpeed = this.seek(averageHeading, diffHeading / Math.PI);
		return turnSpeed;
	}

	avoidWalls() {
		let turnSpeed = 0;
		if (
			this.x < this.neighbourRadius ||
			this.y < this.neighbourRadius ||
			(this.xmax - this.x) < this.neighbourRadius ||
			(this.ymax - this.y) < this.neighbourRadius
		) {
			let distToEdge = Math.min(this.x, this.y, (this.xmax - this.x), (this.ymax - this.y));
			let turnStrength = (this.neighbourRadius - distToEdge) / this.neighbourRadius;
			let centreHeading = this.getCentreHeading();
			turnSpeed = this.seek(centreHeading, turnStrength);
			if (distToEdge == 0) {
				let newHeading = this.heading + turnSpeed;
				let diffCentreHeading = Math.abs(centreHeading - newHeading);
				if (diffCentreHeading > (Math.PI / 2)) {
					let correctHeading = diffCentreHeading - (Math.PI / 2);
					if (turnSpeed >= 0) {
						turnSpeed += correctHeading;
					} else {
						turnSpeed -= correctHeading;
					}
				}
			}
		}
		return turnSpeed;
	}

	// DEBUG FUNCTIONS
	drawNeighbourRadius() {
		this.ctx.beginPath();
		this.ctx.arc(this.x, this.y, this.neighbourRadius, 0, 2 * Math.PI);
		this.ctx.strokeStyle = this.colour;
		this.ctx.stroke();
		this.ctx.closePath();
	}

	drawHeading(scale = 1) {
		this.ctx.beginPath();
		this.ctx.moveTo(this.x, this.y);
		this.ctx.lineTo(this.x + this.vx * scale, this.y + this.vy * scale);
		this.ctx.strokeStyle = this.colour;
		this.ctx.stroke();
		this.ctx.closePath();
	}
}