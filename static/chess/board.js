function Board() {
	this.board = new Array(64).fill(-1);
	this.king = 4;
	this.whiteAtk = [];
	this.blackAtk = [];
	
	this.pieces = [];

	this.whiteTurn = true;
	// wq, wk, bq, bk //
	this.canCastle = new Array(4).fill(true);
	this.checkMate = false;

	this.pinned = new Set();
	this.checkMoves = new Map();

	this.score = 0;

	this.setup = function() {
		for(let i = 0; i < 16; i++)
			this.board[i] = i;
		for(let i = 48; i < 64; i++)
			this.board[i] = i-32;

		for(let i = 0; i < 64; i++) {
			this.whiteAtk.push(new Set());
			this.blackAtk.push(new Set());
		}
	}

	this.setup();

	this.setPieces = function() {
		for(let i = 0; i < 32; i++)
			this.pieces.push(new Piece(i));

		for(let i = 0; i < 5; i++)
			this.pieces[i].set(i+1,i);
		for(let i = 5; i < 8; i++)
			this.pieces[i].set(8-i,i);
		for(let i = 8; i < 16; i++)
			this.pieces[i].set(6,i);

		for(let i = 16; i < 24; i++)
			this.pieces[i].set(12,i+32);
		for(let i = 24; i < 29; i++)
			this.pieces[i].set(i-17,i+32);
		for(let i = 29; i < 32; i++)
			this.pieces[i].set(38-i,i+32);

		for(let i = 0; i < 32; i++) {
			this.pieces[i].setImg();
			this.pieces[i].getMoves();
			scene.add(this.pieces[i].img);
		}
	}

	this.getDirHelper = function(off) {
		if(off % 9 === 0) return 9;
		if(off % 8 === 0) return 8;
		if(off % 7 === 0) return 7;
		return 1;
	}

	this.getDir = function(king,atk) {
		if(king < atk) 
			return this.getDirHelper(atk-king);
		else 
			return -this.getDirHelper(king-atk);
	}

	this.addToCheckMoves = function(piece,move) {
		if(this.checkMoves.has(piece))
			this.checkMoves.get(piece).add(move);
		else
			this.checkMoves.set(piece, new Set([move]));
	}

	this.setCheckMoves = function(white) {
		if((white ? this.blackAtk : this.whiteAtk)[this.pieces[this.king].pos].size === 0)
			return;

		this.checkMoves.clear();

		let king = this.pieces[this.king].pos;
		let atk = white ? this.whiteAtk : this.blackAtk;
		let oppAtk = white ? this.blackAtk : this.whiteAtk;
		let multiMover = white ? i => i === 7 || i === 9 || i === 10
							   : i => i === 1 || i === 3 || i === 4;
		let blocker = white ? i => i !==  6 && i !==  5
							: i => i !== 12 && i !== 11;

		this.checkMoves.set(this.king,this.pieces[this.king].moves);

		if(oppAtk[king].size === 1) {
			let attacker = this.pieces[oppAtk[king].values().next().value];
			atk[attacker.pos].forEach(i => { 
				if(i !== this.king)
					this.checkMoves.set(i, new Set([attacker.pos])) 
			});

			if(multiMover(attacker.type)) {
				let inc = this.getDir(king,attacker.pos);
				let start = white ? 8 : 16;
				let end = white ? 16 : 24;
				
				let idx = king+inc;
				while(idx !== attacker.pos) {
					atk[idx].forEach(i => {
						if(blocker(this.pieces[i].type))
							this.addToCheckMoves(i,idx); 
					});

					// pawn blockers 
					for(let i = start; i < end; i++) {
						if(this.pieces[i].alive && 
							(this.type === 6 || this.type === 12) && // skip promoted pawns
							this.pieces[i].moves.has(idx))
							this.addToCheckMoves(i,idx);
					}

					idx += inc;
				}
			}
		}
	}

	this.pinnedHelper = function(king,sameColor,inc,canPin,cnd) {
		let idx = king+inc;
		let hitPiece = -1;

		while(cnd(idx)) {
			if(this.board[idx] !== -1) {
				if(sameColor(this.board[idx])) {
					if(hitPiece === -1)
						hitPiece = this.board[idx];
					else
						return;
				}
				else {
					if(hitPiece === -1)
						return;
					else {
						if(canPin(this.pieces[this.board[idx]].type))
							this.pinned.add(hitPiece);
						return;
					}
				}
			}
			idx += inc;
		}
	}

	this.setPinned = function(white) {
		this.pinned.clear();

		let king = (white ? this.pieces[4].pos : this.pieces[28].pos);
		let sameColor = (white ? i => i < 16 : i => i >= 16);
	
		let rook, bish;
		if(white) {
			rook = i => i === 7 || i === 10;
			bish = i => i === 9 || i === 10;
		}
		else {
			rook = i => i === 1 || i === 4;
			bish = i => i === 3 || i === 4;
		}

		this.pinnedHelper(king, sameColor,  7, bish, BISHOP_BOUNDS.get( 7)); 
		this.pinnedHelper(king, sameColor, -9, bish, BISHOP_BOUNDS.get(-9)); 
		this.pinnedHelper(king, sameColor, -7, bish, BISHOP_BOUNDS.get(-7));    
		this.pinnedHelper(king, sameColor,  9, bish, BISHOP_BOUNDS.get( 9));    	
		this.pinnedHelper(king, sameColor, -1, rook, ROOK_BOUNDS.get(-1)); 
		this.pinnedHelper(king, sameColor, -8, rook, ROOK_BOUNDS.get(-8)); 
		this.pinnedHelper(king, sameColor,  1, rook, ROOK_BOUNDS.get( 1)); 
		this.pinnedHelper(king, sameColor,  8, rook, ROOK_BOUNDS.get( 8)); 
	}

	this.updateCastling = function(piece) {
		if(piece === 4) {
			this.canCastle[0] = false;
			this.canCastle[1] = false;
		}
		else if(piece === 28) {
			this.canCastle[2] = false;
			this.canCastle[3] = false;
		}
		else if(piece === 0 ) this.canCastle[0] = false;
		else if(piece === 7 ) this.canCastle[1] = false;
		else if(piece === 24) this.canCastle[2] = false;
		else if(piece === 31) this.canCastle[3] = false;
	}

	this.castleHelper = function(rk,fm,to) {
		this.pieces[rk].move(to);
		return rk;
	}

	this.checkForCastle = function(from,to) {
		if(this.board[from] === 4 && from === 4) {
			if(to === 2) 
				return this.castleHelper(0,0,3);
			if(to === 6) 
				return this.castleHelper(7,7,5);
		}
		else if(this.board[from] === 28 && from === 60) {
			if(to === 58) 
				return this.castleHelper(24,56,59);
			if(to === 62) 
				return this.castleHelper(31,63,61);
		}
		return -1;
	}

	this.handleCapture = function(square) {
		this.pieces[this.board[square]].remove();

		let action1 = this.whiteTurn ? remove : add;
		let action2 = this.whiteTurn ? add : remove;

		this.whiteAtk[square].forEach(i => {
			action1(this.pieces[i].moves,square);
			action2(this.pieces[i].defending,square);
		});

		this.blackAtk[square].forEach(i => {
			action1(this.pieces[i].defending,square);
			action2(this.pieces[i].moves,square);
		});

		this.pieces[this.king].clearMoves();
		this.pieces[this.king].getMoves();
	}	
	
	this.move = function(from,to,saveBoard) {
		let piece = this.board[from];
		if((this.whiteTurn === (piece > 15)) || piece === -1)
			return false;

		if(this.pieces[piece].canMove(to)) {
			let rk = this.checkForCastle(from,to);

			if(saveBoard !== undefined)
				saveBoard.save(from,to,this.board[to],rk);

			this.updateCastling(piece);

			if(this.board[to] !== -1) 
				this.handleCapture(to);

			this.pieces[piece].move(to);
	
			this.pieces[this.king].clearMoves();
			this.pieces[this.king].getMoves();

			this.whiteTurn = !this.whiteTurn;

			this.king = this.whiteTurn ? 4 : 28;
			this.pieces[this.king].clearMoves();
			this.pieces[this.king].getMoves();

			this.setPinned(this.whiteTurn);
			this.setCheckMoves(this.whiteTurn);

  			return true;
		}
		else
			return false;
	}

	this.canSelect = function(i) {
		let piece = this.board[i];
		if(piece === -1)
			return false;
		if(this.whiteTurn === (piece < 16))
			return true;
		return false;
	}
}
