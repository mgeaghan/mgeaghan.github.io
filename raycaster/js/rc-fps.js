class RaycasterFPS {
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
		this.player = null;
		this.lastUpdate = undefined;
		this.frameInterval = props.hasOwnProperty("frameInterval") ? props.frameInterval : 250;
		this.bgColour = props.hasOwnProperty("bgColor") ? props.bgColour : [52, 51, 50];
		this.wallColour = props.hasOwnProperty("wallColour") ? props.wallColour : [216, 222, 225];
		this.floorColour = props.hasOwnProperty("floorColour") ? props.floorColour : this.bgColour;
		this.roofColour = props.hasOwnProperty("roofColour") ? props.roofColour : this.bgColour;
	}

	setPlayer(player) {
		this.player = player;
	}

	getYProjection(dist, height=this.height, max_theta=(Math.PI), max_dist=this.dov) {
		let theta = 0;
		if (dist > max_dist) {
			theta = Math.atan((height / 2) / max_dist);
		} else {
			theta = Math.atan((height / 2) / dist);
		}
		let propTheta = (2 * theta) / max_theta;
		if (propTheta > 1) {
			return height;
		} else {
			return height * propTheta;
		}
	}

	rgbToString(r, g, b) {
		return "rgb(" + r.toString() + ", " + g.toString() + ", " + b.toString() + ")";
	}

	shadeByDistance(dist, max_dist, wallColour=this.wallColour, bgColour = this.bgColour) {
		let propDist = dist/max_dist;
		let scale = 1 - propDist;
		if (propDist > 1) {
			return this.rgbToString(...bgColour);
		} else if (propDist < 0) {
			return this.rgbToString(...wallColour);
		} else {
			let shadeColour = [];
			for (let i = 0; i < 3; i++) {
				shadeColour.push(bgColour[i] + scale * (wallColour[i] - bgColour[i]));
			}
			return this.rgbToString(...shadeColour);
		}
	}

	drawFov() {
		this.ctx.fillStyle = this.rgbToString(...this.roofColour);
		this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height / 2);
		this.ctx.fillStyle = this.rgbToString(...this.floorColour);
		this.ctx.fillRect(0, this.canvas.height / 2, this.canvas.width, this.canvas.height / 2);
		let ray_list = this.player.rays;
		let d = 0;
		let w = this.canvas.width / ray_list.length;
		let hmax = this.canvas.height;
		let h = 0;
		let cy = hmax / 2;
		for (let i = 0; i < ray_list.length; i++) {
			// d = ray_list[i][2];
			if (ray_list[i][0] === null) {
				d = this.player.dov;
			} else {
				d = ray_list[i][2] * Math.cos(ray_list[i][3]);
			}
			// h = hmax / d;
			h = this.getYProjection(d) * this.scale;
			this.ctx.fillStyle = this.shadeByDistance(d, this.player.dov);
			this.ctx.fillRect((i * w), (cy - h / 2), w, h);
		}
	}

	clear() {
		this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
	}

	drawLoop(timestamp) {
		if (this.lastUpdate === undefined) {
			this.lastUpdate = timestamp;
		}
		const elapsed = timestamp - this.lastUpdate;
		if (elapsed > this.frameInterval) {
			this.clear();
			this.drawFov();
		}
		requestAnimationFrame(timestamp => this.drawLoop(timestamp));
	}

	startDrawLoop() {
		requestAnimationFrame(timestamp => this.drawLoop(timestamp));
	}
}
