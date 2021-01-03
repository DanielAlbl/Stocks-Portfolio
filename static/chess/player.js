function Player(board,white) {
	this.board = board;
	this.white = white;
	this.piece;
	this.square;
	this.MAX_DEPTH = 1;

	this.move = function() {
		this.alphaBeta(0,Number.NEGATIVE_INFINITY,Number.POSITIVE_INFINITY,this.white);	
		this.board.move(this.board.pieces[this.bestPiece].pos,this.bestSquare);
	}

	this.alphaBeta = function(depth,alpha,beta,white) {
		
		if(depth === this.MAX_DEPTH || this.board.checkMate)
			return this.eval();

		let saveBoard = new SaveBoard(this.board);

		let start = white ? 0 : 16;
		let end = white ? 16 : 32;
		let check = white ? this.board.blackAtk[this.board.pieces[4].pos].size !== 0 :
			this.board.whiteAtk[this.board.pieces[28].pos].size !== 0;

		let val = white ? Number.NEGATIVE_INFINITY : Number.POSITIVE_INFINITY;
		let bestPiece, bestSquare;
		let cmp = white ? ((i,j) => i > j) : ((i,j) => i < j);

		let moves, tmp;

		if(!check) {
			for(let i = start; i < end; i++) {
				if(!this.board.pinned.has(i)) {
					moves = Array.from(this.board.pieces[i].moves);
					for(let j = 0; j < moves.length; j++) {
						tmp = this.recurse(saveBoard,i,moves[j],depth,alpha,beta,white);
					
						if(cmp(tmp,val)) {
							val = tmp;
							bestPiece = i;
							bestSquare = moves[j];
						}

						if(white) alpha = Math.max(alpha,val);
						else beta = Math.min(beta,val);
						
						if(alpha >= beta)
							break;
					}
				}
			}
		}
		else { 
			moves = Array.from(this.board.checkMoves);
			for(let i = 0; i < moves.length; i++) {
				val = this.recurse(saveBoard,moves[i][0],moves[i][1],depth,alpha,beta,white);
		
				if(cmp(tmp,val)) {
					val = tmp;
					bestPiece = moves[i][0];
					bestSquare = moves[i][1];
				}

				if(white) alpha = Math.max(alpha,val);
				else beta = Math.min(beta,val);
				
				if(alpha >= beta)
					break;
			}
		}

		if(depth === 0) {
			this.bestPiece = bestPiece;
			this.bestSquare = bestSquare;
		}
		
		return val;
	}

	this.recurse = function(saveBoard,piece,move,depth,alpha,beta,white) {
		this.board.move(this.board.pieces[piece].pos,move,saveBoard);

		let val = this.alphaBeta(depth+1,alpha,beta,!white);
		try {
			saveBoard.reset();
		}
		catch {
			console.log("Piece",piece);
			console.log("Move",move);
		}

		return val;
	}
						
	this.eval = function() {
		let score = 0;

		for(let i = 0; i < 64; i++) {
			score += this.board.whiteAtk[i].size;
			score -= this.board.blackAtk[i].size;
		}

		return 10*this.board.score + score;
	}
}
