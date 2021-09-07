"use strict";

function Piece(id) {
	this.type;
	this.id = id;
	this.pos;
	this.moves = new Set();
	this.img = new THREE.Object3D();
	this.alive = true;
	
	this.pickImg = function() {
		let file = "/static/chess/Pieces/";
		switch(this.type) {
			case 1 : file += "whiteRook";   break;
			case 2 : file += "whiteKnight"; break;
			case 3 : file += "whiteBishop"; break;
			case 4 : file += "whiteQueen";  break;
			case 5 : file += "whiteKing";   break;
			case 6 : file += "whitePawn";   break;
			case 7 : file += "blackRook";   break;
			case 8 : file += "blackKnight"; break;
			case 9 : file += "blackBishop"; break;
			case 10: file += "blackQueen";  break;
			case 11: file += "blackKing";   break;
			case 12: file += "blackPawn";   break;
		}
	
		let x = this.pos % 8;
		let y = ~~(this.pos/8);
		
		if((x+y) % 2 === 0)
			file += "Brown"

		return file + ".png";
	}

	this.setImg = function() {
		let loader = new THREE.TextureLoader();
		let material = new THREE.MeshLambertMaterial({
		  map: loader.load(this.pickImg())
		});
		let geometry = new THREE.PlaneGeometry(1, 1);
		this.img = new THREE.Mesh(geometry, material);
	
		let x = this.pos % 8;
		let y = ~~(this.pos/8);

		// subtract 3.5 for border
		this.img.position.set(x-3.5, y-3.5, 0);
	};

	this.set = function(type, pos) {
		this.type = type, this.pos = pos;
	}

	this.clearMoves = function() {
		this.moves.clear();
	}

	this.calcMoves = function() {
		if(!this.alive) return;

		// "type" differentiates color, "kind" does not
		let kind = this.type < 7 ? this.type : this.type-6;
		this.clearMoves();

		switch(kind) {
			case 1: this.rook();   break;
			case 2: this.knight(); break;
			case 3: this.bishop(); break;
			case 4: this.queen();  break;
			case 5: this.king();   break;
			case 6: this.pawn();   break;
		}
	}

	this.canMove = function(to) {	
		return this.moves.has(to);
	}

	this.canPromote = function() {
		return this.type ===  6 && ~~(this.pos / 8) === 7 || 
			   this.type === 12 && ~~(this.pos / 8) === 0;
	}

	this.promote = function() {
		this.type -= 2;
	}

	this.movePos = function(to, replace = -1) {
		board.board[this.pos] = replace;
		this.pos = to;
		board.board[this.pos] = this.id;
	}

	this.move = function(to) {
		scene.remove(this.img);

		this.movePos(to);

		if(this.canPromote()) 
			this.promote();
		 
		this.setImg();
		scene.add(this.img);
	}

	this.remove = function() {
		scene.remove(this.img);
		
		board.score -= POINTS[this.type];
		
		this.clearMoves();
		this.alive = false;
	}

	this.revive = function() {
		this.alive = true;
		this.move(this.pos);
		
		let king = this.id < 16 ? 28 : 4;
		board.pieces[king].clearMoves();
		board.pieces[king].calcMoves();

		score += POINTS[this.type];

		scene.add(this.img);
	}

	this.sameColor = function(idx) {
		if(idx === -1) return false;
		return this.id < 16 === idx < 16;
	}

	this.otherColor = function(idx) {
		if(idx === -1) return false;
		return this.id < 16 !== idx < 16;
	}

 	this.multiHelper = function(inc, cnd) {
		let idx = this.pos+inc;
		while(cnd(idx)) {
			if(board.board[idx] === -1) 
				this.moves.add(idx);
			else {
				if(this.otherColor(board.board[idx]))
					this.moves.add(idx);
				return;	
			}
			idx += inc;
		}
	}

	this.singleHelper = function(off, cnd) {
		let idx = this.pos+off;
		if(cnd(idx) && !this.sameColor(board.board[idx])) 
			this.moves.add(idx);
	}

	this.pawnHelper = function(off, cnd) {
		let idx = this.pos+off;
		if(cnd(idx) && (this.otherColor(board.board[idx]) || board.passant === idx))
			this.moves.add(idx);
	}

	this.pawn = function() {
		if(this.type === 6) {
			if(this.pos+8 < 64) {
				if(board.board[this.pos+8] === -1) {
					this.moves.add(this.pos+8);
					if(this.pos > 7 && this.pos < 16) 
						if(board.board[this.pos+16] === -1)
							this.moves.add(this.pos+16);
				}
				this.pawnHelper(9, PAWN_BOUNDS.get(9));
				this.pawnHelper(7, PAWN_BOUNDS.get(7));	
			}
		}
		else {	
			if(this.pos-8 > -1) {
				if(board.board[this.pos-8] === -1) {
					this.moves.add(this.pos-8);
					if(this.pos > 47 && this.pos < 56) 
						if(board.board[this.pos-16] === -1)
							this.moves.add(this.pos-16);
				}
				this.pawnHelper(-9, PAWN_BOUNDS.get(-9));
				this.pawnHelper(-7, PAWN_BOUNDS.get(-7));	
			}
		}
	}

	this.knight = function() {
		KNIGHT_BOUNDS.forEach((cnd, inc) => this.singleHelper(inc, cnd));
	}

	this.rook = function() {
		ROOK_BOUNDS.forEach((cnd, inc) => this.multiHelper(inc, cnd));
	}

	this.bishop = function() {
		BISHOP_BOUNDS.forEach((cnd, inc) => this.multiHelper(inc, cnd));
	}

	this.queen = function() {
		this.rook(); this.bishop();
	}

	this.king = function() {
		BISHOP_BOUNDS.forEach((cnd, inc) => this.singleHelper(inc, cnd));
		ROOK_BOUNDS.forEach((cnd, inc) => this.singleHelper(inc, cnd));

		// Add castling moves
		if(this.type === 5) {
			if(board.canCastle[0] && board.board[3] === -1 && 
				board.board[2] === -1 && board.board[1] === -1)
				this.moves.add(2);
			if(board.canCastle[1] && board.board[5] === -1 && board.board[6] === -1) 
				this.moves.add(6);
		}
		else {
			if(board.canCastle[2] && board.board[59] === -1 && 
				board.board[58] === -1 && board.board[57] === -1)
				this.moves.add(58);
			if(board.canCastle[3] && board.board[61] === -1 && board.board[62] === -1)
				this.moves.add(62);
		}
	}


	///////////////////////////// CHECKING //////////////////////////////
	
	// move helper for moving multiple squares
	this.checkMultiHelper = function(inc, cnd, king) {
		let idx = this.pos+inc;
		while(cnd(idx)) {
			if(board.board[idx] !== -1) 
				return board.board[idx] === king;
			idx += inc;
		}
		return false;
	}

	// move helper for moving single squares
	this.checkSingleHelper = function(off, cnd, king) {
		let idx = this.pos+off;
		return cnd(idx) && board.board[idx] === king;
	}

	this.checkPawn = function(king) {
		if(this.type === 6) 
			return this.checkSingleHelper( 9, PAWN_BOUNDS.get( 9), king) ||
			       this.checkSingleHelper( 7, PAWN_BOUNDS.get( 7), king);
		else	
			return this.checkSingleHelper(-9, PAWN_BOUNDS.get(-9), king) ||
			       this.checkSingleHelper(-7, PAWN_BOUNDS.get(-7), king);
	}

	this.checkKnight = function(king) {
		let check = false;
		KNIGHT_BOUNDS.forEach((cnd, inc) => check ||= this.checkSingleHelper(inc, cnd, king));
		return check;
	}

	this.checkRook = function(king) {
		let check = false;
		ROOK_BOUNDS.forEach((cnd, inc) => check ||= this.checkMultiHelper(inc, cnd, king));
		return check;
	}

	this.checkBishop = function(king) {
		let check = false;
		BISHOP_BOUNDS.forEach((cnd, inc) => check ||= this.checkMultiHelper(inc, cnd, king));
		return check;
	}

	this.checkKing = function(king) { 
		let check = false;
		BISHOP_BOUNDS.forEach((cnd, inc) => check ||= this.checkSingleHelper(inc, cnd, king));
		ROOK_BOUNDS  .forEach((cnd, inc) => check ||= this.checkSingleHelper(inc, cnd, king));
		return check;
	}

	this.checkQueen = function(king) {
		return this.checkRook(king) || this.checkBishop(king);
	}

	this.isChecking = function() {
		if(!this.alive) return false;

		let kind = this.type < 7 ? this.type : this.type-6;
		let king = this.id < 16 ? 28 : 4;

        switch(kind) {
			case 1: return this.checkRook(king);   
			case 2: return this.checkKnight(king); 
			case 3: return this.checkBishop(king); 
			case 4: return this.checkQueen(king);  
			case 5: return this.checkKing(king);   
			case 6: return this.checkPawn(king);   
		}
	}
}
