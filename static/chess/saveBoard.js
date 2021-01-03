function SaveBoard(board)  {
	this.captured;
	this.rk;
	this.canCastle = [];

	this.from;
	this.to;

	this.save = function(from,to,captured,rk) {
		this.canCastle = board.canCastle.slice();
		this.rk = rk;
		this.from = from;
		this.to = to;
		this.captured = captured;
	}

	this.reset = function() {
		if(this.rk !== -1)
			this.undoCastle();

		board.canCastle = this.canCastle.slice();
		board.pieces[board.board[this.to]].move(this.from);
	
		board.whiteTurn = !board.whiteTurn;
		board.king = board.whiteTurn ? 4 : 28;

		if(this.captured !== -1) 
			board.pieces[this.captured].revive();

		board.pieces[board.king].clearMoves();
		board.pieces[board.king].getMoves();

		board.setPinned(board.whiteTurn);
		board.setCheckMoves(board.whiteTurn);
	}

	this.undoCastle = function() {
		switch(this.rk) {
			case  0: board.castleHelper( 0, 3, 0); break;
			case  7: board.castleHelper( 7, 5, 7); break;
			case 24: board.castleHelper(24,59,56); break;
			case 31: board.castleHelper(31,61,63); break;
		}
	}
}
