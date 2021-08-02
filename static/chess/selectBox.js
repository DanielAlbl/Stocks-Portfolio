function SelectBox() {
	this.lines = [];
	this.pos = 0;

	this.addLine = function(x1, y1, x2, y2) {
		let material = new THREE.LineBasicMaterial({
			color: 0x808080, linewidth: 4
		});

		let points = [];
		points.push(new THREE.Vector3(x1, y1, 0));
		points.push(new THREE.Vector3(x2, y2, 0));

		let geometry = new THREE.BufferGeometry().setFromPoints(points);
		this.lines.push(new THREE.Line(geometry, material));
	}

	this.addLine(-4, -4, -3, -4);
	this.addLine(-3, -4, -3, -3);
	this.addLine(-3, -3, -4, -3);
	this.addLine(-4, -3, -4, -4);

	this.setPos = function(idx) {
		let yi = ~~(idx/8), xi = idx % 8;

		let yp = ~~(this.pos/8), xp = this.pos % 8;

		for(let i = 0; i < 4; i++) {
			this.lines[i].translateX(xi-xp);
			this.lines[i].translateY(yi-yp);
		}

		this.pos = idx;
	}

	this.add = function() {
		for(let i = 0; i < 4; i++)
			scene.add(this.lines[i]);
	}

	this.remove = function() {
		for(let i = 0; i < 4; i++)
			scene.remove(this.lines[i]);
	}
}
