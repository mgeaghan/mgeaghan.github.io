class Player {
	constructor(x, y, xMax, yMax, props={}) {
		this.x = x;
		this.y = y;
		this.xMax = xMax;
		this.yMax = yMax;
		this.radius = props.hasOwnProperty("radius") ? props.radius : 1;
		this.colour = props.hasOwnProperty("colour") ? props.colour : "#FF0000";
		this.heading = props.hasOwnProperty("startingHeading") ? props.startingHeading : (-(Math.PI / 2));
		this.stepSize = props.hasOwnProperty("stepSize") ? props.stepSize : 1;
		this.turnRate = props.hasOwnProperty("turnRate") ? props.turnRate : (Math.PI/16);
		this.moveListener = this.moveWASD(this, this.stepSize, this.turnRate);
		this.collisions = props.hasOwnProperty("collisions") ? !!props.collisions : false;
		this.collisionRadius = props.hasOwnProperty("collisionRadius") ? props.collisionRadius : this.radius;
		this.collisionNPoints = props.hasOwnProperty("collisionNPoints") ? Math.max(Math.floor(props.collisionNPoints), 3) : 4;
		this.collisionSquare = props.hasOwnProperty("collisionSquare") ? (props.collisionSquare && this.collisionNPoints === 4) : true;
		this.collisionPoints = this.getCollisionPoints();
		this.map = props.hasOwnProperty("map") ? props.map : null;
		this.fov = props.hasOwnProperty("fov") ? props.fov : (Math.PI / 2);
		this.nrays = props.hasOwnProperty("nrays") ? props.nrays : 99;
		this.dov = props.hasOwnProperty("dov") ? props.dov : 20;
		this.rays = [];
		this.raycast(this.fov, this.nrays, this.dov);
	}

	setCollisions(enabled=true, map=this.map, collisionNPoints=this.collisionNPoints) {
		this.collisions = !!enabled;
		if (this.collisions) {
			this.map = map;
			this.collisionNPoints = Math.floor(collisionNPoints) >=3 ? Math.floor(collisionNPoints) : 4;
		} else {
			this.map = null;
		}
	}

	getCollisionPoints(cx=this.x, cy=this.y, square=this.collisionSquare) {
		let x = [];
		let y = [];
		let npoints = this.collisionNPoints;
		npoints = Math.max(Math.floor(npoints), 3);
		let r = this.collisionRadius;
		if (npoints === 4 && square === true) {
			// top-left, clockwise
			x = [
				(cx - r),
				(cx + r),
				(cx + r),
				(cx - r)
			];
			y = [
				(cy - r),
				(cy - r),
				(cy + r),
				(cy + r)
			];
		} else {
			x = [];
			y = [];
			// top, clockwise
			for (let i = 0; i < npoints; i++) {
				let theta = (Math.PI / 2) - ((i * 2 * Math.PI) / npoints);
				let x_i = (cx + (Math.cos(theta) * r));
				let y_i = (cy + (Math.sin(theta) * r));
				x.push(x_i);
				y.push(y_i);
			}
		}
		return [x, y];
	}

	collision(x=this.x, y=this.y) {
		// return true if any collision else false
		let x_r = 0;
		let y_r = 0;
		let collisionPoints = this.getCollisionPoints(x, y);
		let x_arr = collisionPoints[0];
		let y_arr = collisionPoints[1];
		for (let i = 0; i < x_arr.length; i++) {
			if (Math.abs(x_arr[i] - Math.round(x_arr[i])) < 0.1) {
				x_r = Math.round(x_arr[i]);
			} else {
				x_r = Math.floor(x_arr[i]);
			}
			if (Math.abs(y_arr[i] - Math.round(y_arr[i])) < 0.1) {
				y_r = Math.round(y_arr[i]);
			} else {
				y_r = Math.floor(y_arr[i]);
			}
			if (this.map[y_r][x_r] == 1) {
				return true;
			}
		}
		return false;
	}

	move(dx_rel=0, dy_rel=0, dh=0) {
		this.heading += dh;
		let dx = (Math.cos(this.heading - (Math.PI/2)) * dx_rel) + (Math.cos(this.heading) * dy_rel);
		let dy = (Math.sin(this.heading - (Math.PI/2)) * dx_rel) + (Math.sin(this.heading) * dy_rel);
		if (!this.collisions) {
			this.x += dx;
			this.y += dy;
			this.collisionPoints = this.getCollisionPoints();
			// this.raycast(this.fov, this.nrays, this.dov);
		} else {
			let collide = this.collision(this.x + dx, this.y + dy);
			if (!collide) {
				this.x += dx;
				this.y += dy;
				this.collisionPoints = this.getCollisionPoints();
				// this.raycast(this.fov, this.nrays, this.dov);
			}
		}
	}

	moveWASD(self, dxy=1, dh=1) {
		return (event) => {
			if (event.keyCode === 87) {
				// W
				self.move(0, dxy, 0);
			} else if (event.keyCode === 83) {
				// S
				self.move(0, -dxy, 0);
			} else if (event.keyCode === 65) {
				// A
				self.move(dxy, 0, 0);
			} else if (event.keyCode === 68) {
				// D
				self.move(-dxy, 0, 0);
			} else if (event.keyCode === 81) {
				// Q
				self.move(0, 0, -dh);
			} else if (event.keyCode === 69) {
				// E
				self.move(0, 0, dh);
			}
		};
	}

	rayCollision(x, y) {
		// return true if any collision else false
		let x_r = 0;
		let y_r = 0;
		if (Math.abs(x - Math.round(x)) < 0.1) {
			x_r = Math.round(x);
		} else {
			x_r = Math.floor(x);
		}
		if (Math.abs(y - Math.round(y)) < 0.1) {
			y_r = Math.round(y);
		} else {
			y_r = Math.floor(y);
		}
		if (this.map[y_r][x_r] == 1) {
			return true;
		}
		return false;
	}

	raycast(fov=this.fov, nrays=this.nrays, dov=this.dov) {
		nrays = Math.floor(nrays);
		fov = Math.abs(fov);
		let r = 0;
		let r_x = 0;
		let r_y = 0;
		let dTheta = (fov / (nrays - 1));
		let theta = 0;
		let dx = 0;
		let dy = 0;
		theta = this.heading - (fov / 2);
		this.rays = [];
		for (let i = 0; i < nrays; i++) {
			r = 0;
			for (let j = 0; r < dov; j++) {
				dx = (Math.cos(theta)) * j;
				dy = (Math.sin(theta)) * j;
				r_x = this.x + dx;
				r_y = this.y + dy;
				r = j * Math.sqrt(2);
				if (this.rayCollision(r_x, r_y)) {
					this.rays.push([r_x, r_y, r, Math.abs(this.heading - theta)]);
					break;
				}
			}
			if (this.rays.length === i) {
				this.rays.push([null, null, null, null]);
			}
			theta += dTheta;
		}
	}

	enableMovement() {
		window.addEventListener("keydown", this.moveListener);
	}

	disableMovement() {
		window.removeEventListener("keydown", this.moveListener);
	}
}
