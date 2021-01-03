function Squares() {
	this.squares = new Array();

	this.makeSquare = function(x,y,color) {
		var geometry = new THREE.PlaneGeometry(1,1);
		geometry.translate(x,y,0);
		var material = new THREE.MeshBasicMaterial( {color: color, side: THREE.DoubleSide} );
		var square = new THREE.Mesh( geometry, material );
		this.squares.push(square);
		return square;
	}
	
	this.addAll = function(scene) {
		for(let i = 0; i < this.squares.length; i++) {
			scene.add(this.squares[i]);
		}
	}


	let color = 0xcc6600;
	for(let i = -3.5; i < 4.5; i++) {
		for(let j = -3.5; j < 4.5; j++) {
			if((i+j) % 2)
				color = 0xcc6600;
			else
				color = 0xffffff;
			this.squares.push(this.makeSquare(j,i,color));
		}
	}
}	

function initTHREE() {
	Width = WINDOW_FRACT * Math.min(window.innerWidth,window.innerHeight);

	z = 6;
	angle = 75;

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
	renderer.domElement.addEventListener('click',mouseDown);
	$("#test").click(testUndo);
	$("#undo").click(undo);
}

function copyMoves(moves) {
	for(let i = 0; i < 32; i++) {
		let arr = Array.from(board.pieces[i].moves);
		moves[i] = new Set();
		for(let j = 0; j < arr.length; j++)
			moves[i].add(arr[j]);
	}
}

function sameMoves(moves) {
	let rt = true;
	for(let i = 0; i < 32; i++) {
		let arr = Array.from(board.pieces[i].moves);
		for(let j = 0 ; j < arr.length; j++) {
			if(!moves[i].has(arr[j])) {
				console.log("Piece",i,"Move",arr[j]);
				rt = false;
			}
		}

		arr = Array.from(moves[i]);
		for(let j = 0; j < arr.length; j++) {
			if(!(board.pieces[i].moves.has(arr[j]))) {
				console.log("Piece",i,"Move",arr[j]);
				rt = false;
			}
		}
	}
	return rt;
}

function testUndo() {
	let start = board.whiteTurn ?  0 : 16;
	let end   = board.whiteTurn ? 16 : 32;

	for(let i = start; i < end; i++) {
		let arr = Array.from(board.pieces[i].moves);
		for(let j = 0; j < arr.length; j++) {
			let moves = Array(32);
			copyMoves(moves);

			let testSave = new SaveBoard(board);
			try {
				board.move(board.pieces[i].pos,arr[j],testSave);
				testSave.reset();
			}
			catch { 
				console.log(i,arr[j]);
				return;
			}

			if(!sameMoves(moves)) {
				console.log(i,arr[j]);
				console.log(board);
				break;
			}
		}
	}
}

function undo(e) {
	//var player = new Player(board,board.whiteTurn);
	//player.move();
	saveBoard.reset();
}

function makeBoard() {
	squares = new Squares();
	squares.addAll(scene);
	board = new Board();
	board.setPieces();

	saveBoard = new SaveBoard(board);
}

function resize() {
	Width = WINDOW_FRACT * Math.min(window.innerWidth,window.innerHeight);
    renderer.setSize(Width,Width);
}

function mouseDown(e) {
	let field = 2*6*Math.tan((Math.PI/180)*angle/2);
	let off = renderer.domElement.getBoundingClientRect().x;
	let border = (field - 8) / 2;

	let x = e.clientX - off;
	let y = Width - (e.clientY - off);

	x *= field/Width;
	y *= field/Width;

	x -= border;
	y -= border;

	x = Math.floor(x);
	y = Math.floor(y);

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
			board.move(selected,i,saveBoard);
			selected = -1;
			box.remove();
		}
	}
}

function loop() {
	renderer.render(scene,camera);
	requestAnimationFrame(loop);
}

////////////////////////////////////////////////////////////////////////////

var z, angle;
var Width, scene, camera, renerer, light, squares, board, selected = -1, score = 0;
var box = new SelectBox(), saveBoard;
const WINDOW_FRACT = 0.75;

$(function () {
	initTHREE();
	setCallbacks();
	makeBoard();

	loop();
});
