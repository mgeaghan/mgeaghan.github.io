class Raycaster {

}

// CONTROLS
let draw_mode = document.getElementById("draw-mode");
let slider_fov = document.getElementById("slider-fov");
let slider_dov = document.getElementById("slider-dov");
let slider_nrays = document.getElementById("slider-nrays");
let draw_collision = document.getElementById("draw-collision");
let draw_rays = document.getElementById("draw-rays");
// END CONTROLS

// FPS
let rc_fps = new RaycasterFPS("raycaster-fps-canvas", {
	scale: 8,
	roofColour: [150, 150, 150],
	floorColour: [52, 51, 50],
});
// END FPS

// MAP
let rc_map = new RaycasterMap("raycaster-map-canvas", {
	scale: 8,
	drawCollisions: draw_collision.checked,
	drawRays: draw_rays.checked,
});
rc_map.drawMap();
rc_map.setDrawMode(draw_mode.checked);
draw_mode.onclick = () => {
	rc_map.setDrawMode(draw_mode.checked);
}
draw_collision.onclick = () => {
	rc_map.drawCollisions = draw_collision.checked;
};
draw_rays.onclick = () => {
	rc_map.drawRays = draw_rays.checked;
};
// END MAP

// PLAYER
let player = new Player(8, 8, rc_map.width, rc_map.height, {
	collisionNPoints: 4,
	collisionRadius: 2,
	map: rc_map.map,
	fov: slider_fov.value,
	nrays: slider_nrays.value,
	dov: slider_dov.value,
});
player.enableMovement();
player.setCollisions(true);
slider_fov.oninput = () => {
	player.fov = slider_fov.value;
};
slider_dov.oninput = () => {
	player.dov = slider_dov.value;
};
slider_nrays.oninput = () => {
	player.nrays = slider_nrays.value;
};
// END PLAYER

rc_map.setPlayer(player);
rc_fps.setPlayer(player);
rc_fps.startDrawLoop();
