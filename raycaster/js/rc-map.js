class RaycasterMap {
	constructor(canvas_id, props={}) {
		this.width = props.hasOwnProperty("width") ? Math.ceil(props.width) : 96;
		this.height = props.hasOwnProperty("height") ? Math.ceil(props.height) : 54;
		if (this.width < 10) {
			this.width = 10;
		}
		if (this.height < 10) {
			this.height = 10;
		}
		this.scale = props.hasOwnProperty("scale") ? Math.ceil(props.scale) : 1;
		if (this.scale < 1) {
			this.scale = 1;
		}
		this.canvas = document.getElementById(canvas_id);
		this.canvas.width = this.width * this.scale;
		this.canvas.height = this.height * this.scale;
		this.rect = this.canvas.getBoundingClientRect();
		this.ctx = this.canvas.getContext("2d");
		this.map = this.initMap(this.width, this.height);
		this.mapGhost = this.initMapGhost(this.width, this.height);
		this.fillColour = props.hasOwnProperty("fillColour") ? props.fillColour : "#343332";
		this.ghostFillColour = props.hasOwnProperty("ghostFillColour") ? props.ghostFillColour : "#34333231";
		this.brushRadius = props.hasOwnProperty("brushRadius") ? props.brushRadius : 1;
		this.keepBorder = props.hasOwnProperty("keepBorder") ? props.keepBorder : true;
		this.trackMouseDraw = this.trackMouse(this, this.brushRadius, false, false, this.keepBorder);
		this.trackMouseClear = this.trackMouse(this, this.brushRadius, false, true, this.keepBorder);
		this.trackMouseGhost = this.trackMouse(this, this.brushRadius, true, false, this.keepBorder);
		this.trackMouseDrawClear = this.setTrackMouseDrawClear(this);
		this.stopTrackMouseDrawClear = this.unsetTrackMouseDrawClear(this);
		this.noFillColour = props.hasOwnProperty("noFillColour") ? props.noFillColour : "#d8dee1";
		this.strokeColour = props.hasOwnProperty("strokeColour") ? props.strokeColour : "#c8ced1";
		this.lastUpdate = undefined;
		this.frameInterval = props.hasOwnProperty("frameInterval") ? props.frameInterval : 1000;
		this.canvas.oncontextmenu = (event) => {
			event.preventDefault();
		}
		this.player = null;
		this.playerRadius = props.hasOwnProperty("playerRadius") ? props.playerRadius : 2;
		this.drawHeading = props.hasOwnProperty("drawHeading") ? props.drawHeading : true;
		this.drawCollisions = props.hasOwnProperty("drawCollisions") ? props.drawCollisions : false;
		this.drawRays = props.hasOwnProperty("drawRays") ? props.drawRays : false;
	}

	initMap(width, height) {
		let map = [];
		for (let i = 0; i < height; i++) {
			map.push([])
			for (let j = 0; j < width; j++) {
				map[i].push(
					(i == 0 || j == 0 || i == (height - 1) || j == (width - 1)) ? true : false
				);
			}
		}
		return map;
	}

	initMapGhost(width, height) {
		let map = [];
		for (let i = 0; i < height; i++) {
			map.push([])
			for (let j = 0; j < width; j++) {
				map[i].push(false);
			}
		}
		return map;
	}

	clear() {
		this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
	}

	drawMap() {
		for (let i = 0; i < this.height; i++) {
			let rectStartY = i * this.scale;
			for (let j = 0; j < this.width; j++) {
				let rectStartX = j * this.scale
				if (this.map[i][j]) {
					this.ctx.fillStyle = this.fillColour;
					this.ctx.fillRect(rectStartX, rectStartY, this.scale, this.scale);
				} else if (this.mapGhost[i][j]) {
					this.ctx.fillStyle = this.ghostFillColour;
					this.ctx.fillRect(rectStartX, rectStartY, this.scale, this.scale);
				} else {
					this.ctx.fillStyle = this.noFillColour;
				}
				this.ctx.strokeStyle = this.strokeColour;
				this.ctx.lineWidth = 1;
				this.ctx.strokeRect(rectStartX, rectStartY, this.scale, this.scale);
			}
		}
	}

	fillSquare(x, y, playerRadius=1, ghost=false, clear=false, keepBorder=true) {
		let map = ghost ? this.mapGhost : this.map;
		if (clear || this.player === null || Math.sqrt(((this.player.x - x) ** 2) + ((this.player.y - y) ** 2)) > playerRadius) {
			if (y == 0 || x == 0 || y == (this.height - 1) || x == (this.width - 1)) {
				map[y][x] = keepBorder ? true : (clear ? false : true);
			} else {
				map[y][x] = clear ? false : true;
			}
		}
	}

	fillSquares(x, y, radius=0, ghost=false, clear=false, keepBorder=true) {
		// let map = ghost ? this.mapGhost : this.map;
		let r = Math.floor(Math.max(radius, 0));
		if (r === 0) {
			this.fillSquare(x, y, this.playerRadius, ghost, clear, keepBorder);
			// if (y == 0 || x == 0 || y == (this.height - 1) || x == (this.width - 1)) {
			// 	map[y][x] = keepBorder ? true : (clear ? false : true);
			// } else {
			// 	map[y][x] = clear ? false : true;
			// }
		} else {
			let xMin = Math.max(x - r, 0);
			let xMax = Math.min(x + r, this.width - 1);
			let yMin = Math.max(y - r, 0);
			let yMax = Math.min(y + r, this.height - 1);
			for (let i = yMin; yMin <= i && i <= yMax; i++) {
				for (let j = xMin; xMin <= j && j <= xMax; j++) {
					if (Math.sqrt(((i - y) ** 2) + ((j - x) ** 2)) <= r) {
						this.fillSquare(j, i,  this.playerRadius, ghost, clear, keepBorder);
						// if (i == 0 || j == 0 || i == (this.height - 1) || j == (this.width - 1)) {
						// 	map[i][j] = keepBorder ? true : (clear ? false : true);
						// } else {
						// 	map[i][j] = clear ? false : true;
						// }
					}
				}
			}
		}
	}

	clearMapGhost() {
		this.mapGhost = this.initMapGhost(this.width, this.height);
	}

	getXYPos(self, event) {
		let xPos = Math.floor((event.clientX - self.rect.left) / self.scale);
		let yPos = Math.floor((event.clientY - self.rect.top) / self.scale);
		if (xPos < 0) {
			xPos = 0;
		} else if (xPos >= self.width) {
			xPos = self.width - 1;
		}
		if (yPos < 0) {
			yPos = 0;
		} else if (yPos >= self.height) {
			yPos = self.height - 1;
		}
		return [xPos, yPos];
	}

	trackMouse(self, radius=0, ghost=false, clear=false, keepBorder=true) {
		return (event) => {
			let xyPos = self.getXYPos(self, event);
			let xPos = xyPos[0];
			let yPos = xyPos[1];
			self.clearMapGhost();
			self.fillSquares(xPos, yPos, radius, ghost, clear, keepBorder);
		}
	}

	setTrackMouseDrawClear(self) {
		return (event) => {
			let clear = false;
				if (event.button !== 0) {
					clear = true;
				}
				if (clear) {
					self.trackMouseClear(event);
					self.canvas.addEventListener("mousemove", self.trackMouseClear);
				} else {
					self.trackMouseDraw(event);
					self.canvas.addEventListener("mousemove", self.trackMouseDraw);
				}
		};
	}

	unsetTrackMouseDrawClear(self) {
		return (event) => {
			let clear = false;
				if (event.button !== 0) {
					clear = true;
				}
				if (clear) {
					self.canvas.removeEventListener("mousemove", self.trackMouseClear);
				} else {
					self.canvas.removeEventListener("mousemove", self.trackMouseDraw);
				}
		};
	}

	drawLoop(timestamp) {
		if (this.lastUpdate === undefined) {
			this.lastUpdate = timestamp;
		}
		const elapsed = timestamp - this.lastUpdate;
		if (elapsed > this.frameInterval) {
			this.clear();
			this.rect = this.canvas.getBoundingClientRect();
			this.drawMap();
			if (this.player !== null) {
				this.player.raycast();
				this.drawPlayer(this.drawHeading, this.drawCollisions, this.drawRays);
			}
		}
		requestAnimationFrame(timestamp => this.drawLoop(timestamp));
	}

	setDrawMode(enabled=false) {
		if (enabled) {
			this.canvas.addEventListener("mousemove", this.trackMouseGhost);
			this.canvas.addEventListener("mousedown", this.trackMouseDrawClear);
			this.canvas.addEventListener("mouseup", this.stopTrackMouseDrawClear);
		} else {
			this.clearMapGhost();
			this.canvas.removeEventListener("mousedown", this.trackMouseDrawClear);
			this.canvas.removeEventListener("mousemove", this.trackMouseGhost);
			this.canvas.removeEventListener("mousemove", this.trackMouseClear);
			this.canvas.removeEventListener("mousemove", this.trackMouseDraw);
		}
		requestAnimationFrame(timestamp => this.drawLoop(timestamp));
	}

	setPlayer(player) {
		this.player = player;
	}

	drawPlayer(heading=true, collision=false, rays=false) {
		let x = (this.player.x + 0.5) * this.scale;
		let y = (this.player.y + 0.5) * this.scale;
		let r = this.player.radius * this.scale;
		let col = this.player.colour;
		let h = this.player.heading;
		this.ctx.beginPath();
		this.ctx.arc(x, y, r, 0, 2 * Math.PI);
		this.ctx.fillStyle = col;
		this.ctx.fill();
		this.ctx.closePath();
		if (heading) {
			this.ctx.beginPath();
			this.ctx.moveTo(x, y);
			this.ctx.lineTo(
				x + (Math.cos(h) * r * 2.5),
				y + (Math.sin(h) * r * 2.5)
			);
			this.ctx.strokeStyle = col;
			this.ctx.stroke();
			this.ctx.closePath();
		}
		if (collision) {
			let cx = this.player.collisionPoints[0];
			let cy = this.player.collisionPoints[1];
			let cx_s = 0;
			let cy_s = 0;
			this.ctx.beginPath();
			for (let i = 0; i < cx.length; i++) {
				cx_s = (cx[i] + 0.5) * this.scale;
				cy_s = (cy[i] + 0.5) * this.scale;
				if (i === 0) {
					this.ctx.moveTo(cx_s, cy_s);
				} else {
					this.ctx.lineTo(cx_s, cy_s);
				}
			}
			this.ctx.lineTo((cx[0] + 0.5) * this.scale, (cy[0] + 0.5) * this.scale);
			this.ctx.strokeStyle = col;
			this.ctx.stroke();
			this.ctx.closePath();
		}
		if (rays) {
			let ray_list = this.player.rays;
			for (let i = 0; i < ray_list.length; i++) {
				if (ray_list[i][0] !== null) {
					this.ctx.beginPath();
					this.ctx.moveTo(x, y);
					this.ctx.lineTo(ray_list[i][0] * this.scale, ray_list[i][1] * this.scale);
					this.ctx.strokeStyle = col;
					this.ctx.stroke();
					this.ctx.closePath();
				}
			}
		}
	}
}
