function Squares() {
	this.squares = new Array();

	this.makeSquare = function(x, y, color) {
		var geometry = new THREE.PlaneGeometry(1, 1);
		geometry.translate(x, y, 0);
		var material = new THREE.MeshBasicMaterial( {color: color, side: THREE.DoubleSide} );
		var square = new THREE.Mesh( geometry, material );
		this.squares.push(square);
		return square;
	}
	
	this.addAll = function(scene) {
		for(let i = 0; i < this.squares.length; i++) 
			scene.add(this.squares[i]);
	}

	let color = 0xcc6600;
	for(let i = -3.5; i < 4.5; i++) 
		for(let j = -3.5; j < 4.5; j++) {
			color = (i+j) % 2 ? 0xcc6600 : 0xffffff;
			this.squares.push(this.makeSquare(j, i, color));
		}
}
