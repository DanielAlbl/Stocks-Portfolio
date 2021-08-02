function Board() {
	this.board = new Array(64).fill(-1);
	this.king = 4;
	
	this.pieces = [];

	this.whiteTurn = true;
	// wq, wk, bq, bk //
	this.canCastle = new Array(4).fill(true);
	this.passant = -1;
	this.checkMate = false;

	this.score = 0;

	this.setup = function() {
		for(let i = 0; i < 16; i++)
			this.board[i] = i;
		for(let i = 48; i < 64; i++)
			this.board[i] = i-32;
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
			this.pieces[i].calcMoves();
			scene.add(this.pieces[i].img);
		}
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

	this.castleHelper = function(rk, to) {
		this.pieces[rk].move(to);
	}

	this.handleCastle = function(piece, to, from) {
		if(piece === 4 && from === 4) {
			if(to === 2) 
				return this.pieces[0].move(3);
			if(to === 6) 
				return this.pieces[7].move(5);
		}
		else if(piece === 28 && from === 60) {
			if(to === 58) 
				return this.pieces[24].move(59);
			if(to === 62) 
				return this.pieces[31].move(61);
		}
	}

	this.updatePassant = function(piece, to, from) {
		if(piece > 7 && piece < 16 && to-from === 16)
			this.passant = from + 8;
		else if(piece > 15 && piece < 24 && to-from === -16)
			this.passant = from - 8;
		else
			this.passant = -1;
	}
	
	this.handlePassant = function(piece, to) {
		if(piece > 7 && piece < 24 && to === this.passant) {
			let square = this.whiteTurn ? to-8 : to+8;
			this.pieces[this.board[square]].remove();
			this.board[square] = -1;
		}
	}

	// helper that deletes a given piece's move if you are in check
	this.deleteIfCheck = function(piece, move, st, ed) {
		for(let i = st; i < ed; i++) 
			if(this.pieces[i].isChecking()) {
				piece.moves.delete(move);
				break;
			}
	}

	// delete castling moves if it would move through check
	this.castleThroughCheck = function() {
		let king, sq, st, ed;
		if(this.whiteTurn)
			king = this.pieces[4], sq = 4, st = 16, ed = 32;
		else
			king = this.pieces[28], sq = 60, st = 0, ed = 16;

		if(king.pos === sq) {
			if(king.moves.has(sq+2)) {
				king.movePos(sq+1);
				this.deleteIfCheck(king, sq+2, st, ed);
			}
			if(king.moves.has(sq-2)) {
				king.movePos(sq-1);
				this.deleteIfCheck(king, sq-2, st, ed);
			}
				
			king.movePos(sq);
		}
	}

	this.calcMoves = function() {
		let st1, st2, ed1, ed2;
		if(this.whiteTurn) 
			st1 = 0, st2 = 16, ed1 = 16, ed2 = 32;
		else
			st1 = 16, st2 = 0, ed1 = 32, ed2 = 16;
		
		for(let i = st1; i < ed1; i++) {
			this.pieces[i].calcMoves();
			this.pieces[i].moves.forEach(move => {
				let pos = this.pieces[i].pos;
				let cap = this.board[move] === -1 ? null : this.pieces[this.board[move]];

				if(cap !== null) 
					cap.alive = false;
				this.pieces[i].movePos(move);

				this.deleteIfCheck(this.pieces[i], move, st2, ed2);

				if(cap !== null) {
					cap.alive = true;
					this.pieces[i].movePos(pos, cap.id);
				}
				else
					this.pieces[i].movePos(pos);
			});
		}

		this.castleThroughCheck();
	}

	this.move = function(from, to, saveBoard) {
		let piece = this.board[from];
		if(this.whiteTurn === piece > 15 || piece === -1)
			return false;

		if(this.pieces[piece].canMove(to)) {
			this.handleCastle(piece, to, from);
			this.handlePassant(piece, to);

			if(this.board[to] !== -1) 
				this.pieces[this.board[to]].remove();

			this.pieces[piece].move(to);

			this.whiteTurn = !this.whiteTurn;
			this.king = this.whiteTurn ? 4 : 28;

			this.updateCastling(piece);
			this.updatePassant(piece, to, from);

			this.calcMoves();

  			return true;
		}
		else
			return false;
	}

	this.canSelect = function(i) {
		let piece = this.board[i];
		if(piece === -1) return false;
		return this.whiteTurn === piece < 16;
	}
}
