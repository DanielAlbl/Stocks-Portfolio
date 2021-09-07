"use strict";

function initTHREE() {
	Width = WINDOW_FRACT * Math.min(window.innerWidth, window.innerHeight);

	z = 6, angle = 75;

    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(angle, 1, 0.1, 1000);
    renderer = new THREE.WebGLRenderer({ antialias: true });
    
	camera.position.z = z;
    camera.lookAt(new THREE.Vector3(0, 0, 0));
    renderer.setSize(Width, Width);
    
	let div = document.getElementById('board');
    div.appendChild(renderer.domElement);

	light = new THREE.PointLight( 0xffffff, 1, 0 );
	light.position.set(1, 1, 100 );
	scene.add(light)
}

function setCallbacks() {
	window.addEventListener( 'resize', resize, false );
	renderer.domElement.addEventListener('click', mouseDown);
}

function makeBoard() {
	squares = new Squares();
	squares.addAll(scene);
	board = new Board();
	board.setPieces();
}

function resize() {
	Width = WINDOW_FRACT * Math.min(window.innerWidth, window.innerHeight);
    renderer.setSize(Width, Width);
}

function mouseDown(e) {
	let field = 2*6*Math.tan((Math.PI/180)*angle/2);
	let off = renderer.domElement.getBoundingClientRect().x;
	let border = (field - 8) / 2;

	let x = e.clientX - off;
	let y = Width - (e.clientY - off);

	x *= field/Width, y *= field/Width;
	x -= border, y -= border;
	x = ~~x, y = ~~y;

	let i = 8*y + x;
	let canSelect = board.canSelect(i);

	if(canSelect) {
		if(selected !== -1) 
			box.remove();
		selected = i;
		box.setPos(i);
		box.add();
	}
	else {
		if(selected !== -1) {
			board.move(selected, i, saveBoard);
			selected = -1;
			box.remove();
		}
	}
}

function loop() {
	renderer.render(scene, camera);
	requestAnimationFrame(loop);
}

////////////////////////////////////////////////////////////////////////////

var z, angle;
var Width, scene, camera, renderer, light, squares, board, selected = -1, score = 0;
var box = new SelectBox(), saveBoard;
const WINDOW_FRACT = 0.75;

$(function () {
	initTHREE();
	setCallbacks();
	makeBoard();

	loop();
});
