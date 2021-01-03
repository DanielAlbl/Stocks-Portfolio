function Piece(id) {
	this.type;
	this.id = id;
	this.pos;
	this.moves = new Set();
	this.defending = new Set();
	this.img = new THREE.Object3D();
	this.alive = true;
	
	this.atk = ((this.id < 16) ? board.whiteAtk : board.blackAtk);
	this.oppAtk = ((this.id < 16) ? board.blackAtk : board.whiteAtk);

	this.pickImg = function() {
		let file = "static/chess/Pieces/";
		switch(this.type) {
			case 1:  file += "whiteRook";   break;
			case 2:  file += "whiteKnight"; break;
			case 3:  file += "whiteBishop"; break;
			case 4:  file += "whiteQueen";  break;
			case 5:  file += "whiteKing";   break;
			case 6:  file += "whitePawn";   break;
			case 7:  file += "blackRook";   break;
			case 8:  file += "blackKnight"; break;
			case 9:  file += "blackBishop"; break;
			case 10: file += "blackQueen";  break;
			case 11: file += "blackKing";   break;
			case 12: file += "blackPawn";   break;
		}
	
		let x = this.pos % 8;
		let y = Math.floor(this.pos/8);
		
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
		let y = Math.floor(this.pos/8);

		this.img.position.set(x-3.5,y-3.5,0);
	};

	this.set = function(type,pos) {
		this.type = type;
		this.pos = pos;
	}

	this.clearMoves = function() {
		if(this.type === 6 || this.type === 12) 
			this.clearPawnAtk();
		else {
			this.moves.forEach(i => { this.atk[i].delete(this.id) });
			this.defending.forEach(i => { this.atk[i].delete(this.id) });
		}

		this.moves.clear();
		this.defending.clear();
	}

	this.getMoves = function() {
		let kind = this.type < 7 ? this.type : this.type-6;

		switch(kind) {
			case 1: this.rook(); break;
			case 2: this.knight(); break;
			case 3: this.bishop(); break;
			case 4: this.queen(); break;
			case 5: this.king(); break;
			case 6: this.pawn(); break;
		}
	}

	this.clearPawnAtk = function() {
		if(this.type === 6) {
			if(this.pos%8 !== 0)
				board.whiteAtk[this.pos+7].delete(this.id);
			if(this.pos%8 !== 7)
				board.whiteAtk[this.pos+9].delete(this.id);
		}
		else {
			if(this.pos%8 !== 0)
				board.blackAtk[this.pos-9].delete(this.id);
			if(this.pos%8 !== 7)
				board.blackAtk[this.pos-7].delete(this.id);
		}
	}

	this.canMove = function(to) {	
		if(this.oppAtk[board.pieces[board.king].pos].size) {
			return board.checkMoves.has(this.id) && 
				board.checkMoves.get(this.id).has(to) && 
				!board.pinned.has(this.id);
		}
		
		return this.moves.has(to) && !board.pinned.has(this.id);
	}

	this.canPromote = function() {
		return (this.type === 6 && ~~(this.pos / 8) === 7) || 
			(this.type === 12 && ~~(this.pos / 8) === 0);
	}

	this.promote = function() {
		this.type -= 2;
	}

	this.move = function(to) {
		scene.remove(this.img);

		this.atk[this.pos].forEach(i => { board.pieces[i].updateMoves(this,true) });
		this.oppAtk[this.pos].forEach(i => { board.pieces[i].updateMoves(this,true) });
		this.updatePawn(true);

		this.clearMoves();
		
		board.board[this.pos] = -1;
		this.pos = to;
		board.board[this.pos] = this.id;

		if(this.canPromote()) this.promote();

		this.getMoves();

		this.updatePawn(false);
		this.oppAtk[this.pos].forEach(i => { board.pieces[i].updateMoves(this,false) });
		this.atk[this.pos].forEach(i => { board.pieces[i].updateMoves(this,false) });

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
		
		let king = (this.id < 16) ? 28 : 4;
		board.pieces[king].clearMoves();
		board.pieces[king].getMoves();

		score += POINTS[this.type];

		scene.add(this.img);
	}

	this.sameColor = function(idx) {
		if(idx === -1)
			return false;
		if((this.id < 16) === (idx < 16))
			return true;
		return false;
	}

	this.otherColor = function(idx) {
		if(idx === -1)
			return false;
		if((this.id < 16) !== (idx < 16))
			return true;
		return false;
	}

	this.multiHelper = function(inc,cnd) {
		let idx = this.pos+inc;
		
		while(cnd(idx)) {
			if(board.board[idx] === -1) {
				this.moves.add(idx);
				this.atk[idx].add(this.id);
			}
			else {
				if(this.otherColor(board.board[idx]))
					this.moves.add(idx);
				else
					this.defending.add(idx);
				this.atk[idx].add(this.id);
				return;	
			}
			idx += inc;
		}
	}

	this.singleHelper = function(off,cnd) {
		let idx = this.pos+off;
		if(cnd(idx)) {
			if(this.sameColor(board.board[idx])) 
				this.defending.add(idx);
			else
				this.moves.add(idx);

			this.atk[idx].add(this.id);
		}
	}

	this.pawnHelper = function(off) {
		let idx = this.pos + off;

		if(this.otherColor(board.board[idx]))
			this.moves.add(idx);
		if(this.sameColor(board.board[idx]))
			this.defending.add(idx);
		
		this.atk[idx].add(this.id);
	}	

	this.rook = function() {
		this.multiHelper( 1, ROOK_BOUNDS.get( 1));
		this.multiHelper(-1, ROOK_BOUNDS.get(-1));
		this.multiHelper( 8, ROOK_BOUNDS.get( 8));
		this.multiHelper(-8, ROOK_BOUNDS.get(-8));
	}

	this.pawn = function() {
		if(this.type === 6) {
			if(this.pos+8 < 64) {
				if(board.board[this.pos+8] === -1) {
					this.moves.add(this.pos+8);
					if(this.pos > 7 && this.pos < 16) {
						if(board.board[this.pos+16] === -1)
							this.moves.add(this.pos+16);
					}
				}
				if(this.pos%8 !== 7) 
					this.pawnHelper(9);
				if(this.pos%8 !== 0)
					this.pawnHelper(7);	
			}
		}
		else {	
			if(this.pos-8 > -1) {
				if(board.board[this.pos-8] === -1) {
					this.moves.add(this.pos-8);
					if(this.pos > 47 && this.pos < 56) {
						if(board.board[this.pos-16] === -1)
							this.moves.add(this.pos-16);
					}
				}
				if(this.pos%8 !== 0)
					this.pawnHelper(-9);
				if(this.pos%8 !== 7)
					this.pawnHelper(-7);
			}
		}
	}

	this.knight = function() {
		this.singleHelper(-10, KNIGHT_BOUNDS.get(-10));
		this.singleHelper(-17, KNIGHT_BOUNDS.get(-17));
		this.singleHelper(-15, KNIGHT_BOUNDS.get(-15));
		this.singleHelper( -6, KNIGHT_BOUNDS.get( -6));
		this.singleHelper( 10, KNIGHT_BOUNDS.get( 10));
		this.singleHelper( 17, KNIGHT_BOUNDS.get( 17));
		this.singleHelper( 15, KNIGHT_BOUNDS.get( 15));
		this.singleHelper(  6, KNIGHT_BOUNDS.get(  6));
	}

	this.bishop = function() {
		this.multiHelper( 7, BISHOP_BOUNDS.get( 7));
		this.multiHelper(-9, BISHOP_BOUNDS.get(-9));
		this.multiHelper(-7, BISHOP_BOUNDS.get(-7));
		this.multiHelper( 9, BISHOP_BOUNDS.get( 9));
	}

	this.queen = function() {
		this.rook();
		this.bishop();
	}

	this.kingHelper = function(off,cnd) {
		let idx = this.pos+off;

		if(cnd(idx)) {
			if(this.oppAtk[idx].size === 0) {
				if(this.sameColor(board.board[idx])) 
					this.defending.add(idx);
				else
					this.moves.add(idx);
			}
			this.atk[idx].add(this.id);
		}
	}

	this.king = function() {
		this.kingHelper( 7, BISHOP_BOUNDS.get( 7));
		this.kingHelper(-9, BISHOP_BOUNDS.get(-9));
		this.kingHelper(-7, BISHOP_BOUNDS.get(-7));
		this.kingHelper( 9, BISHOP_BOUNDS.get( 9));
		this.kingHelper(-1, ROOK_BOUNDS.get(-1));
		this.kingHelper(-8, ROOK_BOUNDS.get(-8));
		this.kingHelper( 1, ROOK_BOUNDS.get( 1));
		this.kingHelper( 8, ROOK_BOUNDS.get( 8));

		if(this.type === 5) {
			if(board.canCastle[0] && !this.oppAtk[4].size && !this.oppAtk[3].size
				&& !this.oppAtk[2].size && board.board[3] === -1 && 
				board.board[2] === -1 && board.board[1] === -1)
				this.moves.add(2);
			if(board.canCastle[1] && !this.oppAtk[4].size && !this.oppAtk[5].size
				&& !this.oppAtk[6].size && board.board[5] === -1 && board.board[6] === -1) 
				this.moves.add(6);
		}
		else {
			if(board.canCastle[2] && !this.oppAtk[60].size && !this.oppAtk[59].size
				&& !this.oppAtk[58].size && board.board[59] === -1 && 
				board.board[58] === -1 && board.board[57] === -1)
				this.moves.add(58);
			if(board.canCastle[3] && !this.oppAtk[60].size && !this.oppAtk[61].size
				&& !this.oppAtk[62].size && board.board[61] === -1 && board.board[62] === -1)
				this.moves.add(62);
		}
	}

	///////////////////////////// UPDATING //////////////////////////////

	this.updateMoves = function(piece,beforeMove) {
		if(this.type === 5) // king getMoves is called after every move
			return;

		let action1 = beforeMove ? add : remove;
		let action2 = beforeMove ? remove : add;

		if(this.type === 6 || this.type === 12) {
			if(this.id < 16 === piece.id < 16) 
				action2(this.defending,piece.pos);
			else
				action2(this.moves,piece.pos);
		}
		else {
			if(this.id < 16 === piece.id < 16) {
				action1(this.moves,piece.pos);
				action2(this.defending,piece.pos);
			}
		}

		let kind = (this.type > 6 ? this.type-6 : this.type);
		switch(kind) {
			case 1: this.updateRook(piece,action1); break;
			case 3: this.updateBishop(piece,action1); break;
			case 4: this.updateQueen(piece,action1); break;
		}
	}

	this.updateHelper = function(piece,inc,cnd,action) {
		let idx = piece.pos+inc;
		while(cnd(idx)) {
			action(this.atk[idx],this.id);

			if(board.board[idx] !== -1) {
				if(this.id < 16 === board.pieces[board.board[idx]].id < 16)
					action(this.defending,idx);
				else
					action(this.moves,idx);
				return;
			}
		
			action(this.moves,idx);

			idx += inc;
		}
	}

	this.updateRook = function(piece,action) {
		if(piece.pos < this.pos) {
			if((this.pos-piece.pos) % 8 === 0) 
				this.updateHelper(piece, -8, ROOK_BOUNDS.get(-8), action);
			else if((this.pos / 8 | 0) === (piece.pos / 8 | 0)) 
				this.updateHelper(piece, -1, ROOK_BOUNDS.get(-1), action);
		}
		else {
			if((piece.pos-this.pos) % 8 === 0)
				this.updateHelper(piece,  8, ROOK_BOUNDS.get( 8), action);
			else if((this.pos / 8 | 0) === (piece.pos / 8 | 0)) 
				this.updateHelper(piece,  1, ROOK_BOUNDS.get( 1), action);
		}
	}

	this.updateBishop = function(piece,action) {
		if(piece.pos < this.pos) {
			if((this.pos-piece.pos) % 7 === 0) 
				this.updateHelper(piece, -7, BISHOP_BOUNDS.get(-7), action);
			else if((this.pos-piece.pos) % 9 === 0)
				this.updateHelper(piece, -9, BISHOP_BOUNDS.get(-9), action);
		}
		else {
			if((piece.pos-this.pos) % 7 === 0)
				this.updateHelper(piece,  7, BISHOP_BOUNDS.get( 7), action);
			else if((piece.pos-this.pos) % 9 === 0)
				this.updateHelper(piece,  9, BISHOP_BOUNDS.get( 9), action);
		}
	}

	this.updateQueen = function(piece,action) {
		this.updateRook(piece, action);
		this.updateBishop(piece, action);
	}

	this.updatePawn = function(beforeMove) {
		let action = beforeMove ? add : remove;

		let above = this.pos < 56 ? board.board[this.pos+8] : -1;
		let below = this.pos >= 8 ? board.board[this.pos-8] : -1;

		if(above !== -1) {
			if(board.pieces[above].type === 12) {
				action(board.pieces[above].moves,this.pos);
				if(this.pos > 39 && this.pos < 48 && below === -1)
					action(board.pieces[above].moves,this.pos-8);
			}
		}
		if(this.pos > 31 && this.pos < 40) {
			let abv2 = board.board[this.pos+16];
			if(abv2 !== -1 && board.pieces[abv2].type === 12)
				action(board.pieces[abv2].moves,this.pos);	
		}
		
		if(below !== -1) {
			if(board.pieces[below].type === 6) {
				action(board.pieces[below].moves,this.pos);
				if(this.pos > 15 && this.pos < 24 && above === -1)
					action(board.pieces[below].moves,this.pos+8);
			}
		}
		else if(this.pos > 23 && this.pos < 32) {
			let blw2 = board.board[this.pos-16];
			if(blw2 !== -1 && board.pieces[blw2].type === 6)
				action(board.pieces[blw2].moves,this.pos);	
		}
	}
}
