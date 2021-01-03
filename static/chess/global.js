const POINTS = [0,5,3,3,9,2147483647,1,-5,-3,-3,-9,-2147483647,-1];

const KNIGHT_BOUNDS = new Map( [[ -10, i => i > -1 && (i+8)%8 < 6   ],
                                [ -17, i => i > -1 && (i+8)%8 !== 7 ],
                                [ -15, i => i > -1 && i%8 !== 0     ],
                                [  -6, i => i > -1 && i%8 > 1       ],
                                [  10, i => i < 64 && i%8 > 1       ],
                                [  17, i => i < 64 && i%8 !== 0     ],
                                [  15, i => i < 64 && (i+8)%8 !== 7 ],
                                [   6, i => i < 64 && (i+8)%8 < 6   ]] );

const BISHOP_BOUNDS = new Map( [[  7, i => i < 64 && (i+8)%8 !== 7 ],
                                [ -9, i => i > -1 && (i+8)%8 !== 7 ],
                                [ -7, i => i > -1 && i%8 !== 0     ],
                                [  9, i => i < 64 && i%8 !== 0     ]] );

const ROOK_BOUNDS = new Map( [[  1, i => i % 8 !== 0   ], 
                              [ -1, i => (i+8)%8 !== 7 ],
                              [  8, i => i < 64        ],
                              [ -8, i => i > -1        ]] );

function add(set,item) { set.add(item); }

function remove(set,item) { set.delete(item); }

