function Tetris(opts){
	opts = opts || {};

	this.width = opts.width || 20;
	this.height = opts.height || 10;
	this.speed = this.initialSpeed = opts.speed || 1;

	this.freq = 1000/this.speed;
	this._onRefresh = this._onRefresh || [];
	
	this.field = this.generate(this.width, this.height);

	this.score = 0;

	this.runGameCicle();
}

Tetris.prototype.shapes = [
	[{x: 0, y: 0},{x: 1, y: 0},{x: 2, y: 0},{x: 2, y: 1}], // L
	[{x: 0, y: 0},{x: 1, y: 0},{x: 2, y: 0},{x: 0, y: 1}], // L2
	[{x: 0, y: 0},{x: 1, y: 0},{x: 0, y: 1},{x: 1, y: 1}], // [+]
	[{x: 1, y: 0},{x: 2, y: 0},{x: 3, y: 0},{x: 2, y: 1}], // T
	[{x: 1, y: 0},{x: 2, y: 0},{x: 1, y: 1},{x: 0, y: 1}], // S
	[{x: 1, y: 0},{x: 0, y: 0},{x: 1, y: 1},{x: 2, y: 1}], // S2
	[{x: 0, y: 0},{x: 1, y: 0},{x: 2, y: 0},{x: 3, y: 0}], // |
	[{x: 0, y: 0},{x: 1, y: 0},{x: 2, y: 0},{x: 3, y: 0}] //  |2
];

Tetris.prototype.onRefresh = function(callback){
	if (typeof callback == 'function'){
		this._onRefresh.push(callback);
		return true;
	} else {
		return false;
	}
}

Tetris.prototype.runGameCicle = function(){
	if (!this.currentShape){
		this.createShape();
	}

	setTimeout(function(){
		this.moveDown();
		this.runGameCicle();
	}.bind(this), this.freq);
}

Tetris.prototype.generate = function(w, h){
	var 
		i,
		fld = []
	;

	for (i=0; i<h; i++) {
		fld.push( this.generateLine(w) );
	}
	
	return fld;
}

Tetris.prototype.generateLine = function(size, filled){
	var i, line;

	size = size || this.width;

	line = [];
	for (i=0; i<size; i++){
		line.push( filled ? 1 : 0 );
	}

	return line;
}

Tetris.prototype.moveDown = function(){
	if ( !this.move(0, 1) ){
		this.currentShape = null;

		this.checkLines();

		this.refresh();
		
		this.createShape();
	}
}

Tetris.prototype.moveLeft = function(){
	this.move(-1, 0);
}

Tetris.prototype.moveRight = function(){
	this.move(1, 0);
}

Tetris.prototype.togglePause = function(){
	this.paused = !this.paused;
}

Tetris.prototype.move = function(deltaX, deltaY){
	var 
		shape = this.currentShape, 
		cloneShape
	;

	if (this.paused){
		return true;
	}

	if (!shape){
		console.warn('Tetris.move. shape is not defined');
		return false;
	}

	cloneShape = this.cloneShapeAt(shape, deltaX, deltaY);

	if ( !this.checkShapeIntercept(cloneShape) ){
		return false;
	}
	
	this.clearShape(shape);
	this.fillShape(cloneShape);
	this.currentShape = cloneShape;

	return true;
}

Tetris.prototype.checkLines = function(){
	var i, j;

	for (i=this.field.length-1; i>0; i--){

		if ( this.isLineFilled(this.field[ i ]) ){

			for (j=i; j>0; j--){
				this.field[j] = this.field[j-1];
			}

			this.field[0] = this.generateLine();
			i++;
			this.addScore(10);
		}
	}
}

Tetris.prototype.addScore = function(delta){
	this.score += delta;
	this.checkSpeed();
}

Tetris.prototype.checkSpeed = function(){
	var 
		i,
		item,
		speedMap = [
			{minScore: 16000, speedMult: 8},
			{minScore: 8000,  speedMult: 7},
			{minScore: 4000,  speedMult: 6},
			{minScore: 2000,  speedMult: 5},
			{minScore: 1000,  speedMult: 4},
			{minScore: 500,   speedMult: 3},
			{minScore: 250,   speedMult: 2},
			{minScore: 100,   speedMult: 1}
		]
	;

	for (i = 0; i< speedMap.length; i++){
		item = speedMap[i];

		if (item.minScore <= this.score){
			this.setSpeed(this.initialSpeed + item.speedMult);
			break;
		}
	}
}

Tetris.prototype.setSpeed = function(speed){
	this.speed = speed;
	this.freq = 1000/this.speed;
}

Tetris.prototype.isLineFilled = function(fieldLine){
	var i;

	for(i=0; i<fieldLine.length; i++){
		if (!fieldLine[i]){
			return false;
		}
	}

	return true;
}

Tetris.prototype.cloneShapeAt = function(shape, deltaX, deltaY){
	var cloneShape = [];

	this.forEachShapeCell(shape, function(i, cell){
		var cloneCell = {
			x: cell.x + deltaX,
			y: cell.y + deltaY
		};

		cloneShape.push(cloneCell);
	});

	return cloneShape;
}

Tetris.prototype.getRandShape = function(){
	var rand = Math.floor(Math.random() * this.shapes.length);

	return this.cloneShapeAt(this.shapes[rand], 0, 0);
}

Tetris.prototype.getRotatedShape = function(shape, side){
	var 
		j,
		dim = {
			x: {min: null, max: null, center: null},
			y: {min: null, max: null, center: null}
		},
		targCoord
	;

	side = side || '+90deg';
	shape = shape || this.currentShape;

	for(j in dim){
		this.forEachShapeCell(shape, function(i, cell){
			if (dim[j].max === null && dim[j].min === null){
				dim[j].max = cell[j];
				dim[j].min = cell[j];
			} else {
				dim[j].max = Math.max(dim[j].max, cell[j]);
				dim[j].min = Math.min(dim[j].min, cell[j]);
			}

		});

		dim[j].center = Math.floor( (dim[j].max + dim[j].min) / 2 );
	}

	targCoord = (side == '+90deg') ? 'x' : 'y';

	this.forEachShapeCell(shape, function(i, cell){
		var bufY = cell.x - dim.x.center + dim.y.center;

		cell.x = cell.y - dim.y.center + dim.x.center;
		cell.y = bufY;
	});

	this.forEachShapeCell(shape, function(i, cell){
		cell[targCoord] = 2*dim[targCoord].center - cell[targCoord];
	});

	return shape;
}

Tetris.prototype.logField = function(msg){
	var 
		i, j, 
		str = (msg || 'field: ')+'\n'
	;

	for (i=0; i<this.field.length; i++){

		for (j=0; j<this.field[i].length; j++){
			str += this.field[i][j] ? '■ ' : '□ ';
		}

		str += '\n';
	}
}

Tetris.prototype.log = function(shape, msg){
	var i, j, tmpField = [], row, str = (msg || '')+'\n';

	for (i=0; i<=6; i++){
		row = [];
		for (j=0; j<=6; j++){
			row.push("□");
		}
		tmpField.push(row);
	}

	for (i=0; i<shape.length; i++){
		if ( tmpField[ shape[i].y ] && tmpField[ shape[i].y ][ shape[i].x ] ){
			tmpField[ shape[i].y ][ shape[i].x ] = "■";
		}
	}

	for (i=0; i<=6; i++){
		str += tmpField[i].join(' ')+'\n';
	}
}

Tetris.prototype.rotate = function(){
	var shape, cloneShape;

	shape = this.currentShape;

	if (this.paused){
		return shape;
	}

	cloneShape = this.cloneShapeAt(shape, 0, 0);

	cloneShape = this.getRotatedShape(cloneShape, '+90deg');

	if ( !this.checkShapeIntercept(cloneShape) ){
		return false;
	}

	this.clearShape();
	this.currentShape = cloneShape;
	this.fillShape();
	
	return cloneShape;
}

Tetris.prototype.centerShapeHoriz = function(shape){
	var 
		w = 0,
		left
	;

	shape = shape || this.currentShape;

	this.forEachShapeCell(shape, function(i, cell){
		w = Math.max(w, cell.x);
	});

	left = Math.floor( (this.width - w)/2 );

	this.forEachShapeCell(shape, function(i, cell){
		cell.x += left;
	});

	return shape;
}

Tetris.prototype.createShape = function(){
	this.currentShape = this.getRandShape();

	this.centerShapeHoriz();

	this.fillShape();
}

Tetris.prototype.forEachShapeCell = function(shape, callback){
	var i, res;

	for(i=0; i<shape.length; i++){
		res = callback.call(this, i, shape[i]);

		if (res !== undefined){
			return res;
		}
	}

	return;
}

Tetris.prototype.fillShape = function(shape){
	shape = shape || this.currentShape;

	this.forEachShapeCell(shape, function(i, cell){
		this.setCell(cell, 1);
	});
}

Tetris.prototype.clearShape = function(shape){
	shape = shape || this.currentShape;

	this.forEachShapeCell(shape, function(i, cell){
		this.setCell(cell, 0);
	});
}

Tetris.prototype.checkShapeIntercept = function(shape){
	var res = this.forEachShapeCell(shape, function(i, cell){

		var 
			cellInCurrentShape
		;

		cellInCurrentShape = this.forEachShapeCell(this.currentShape, function(j, currentShapeCell){
			if ( this.equals(cell, currentShapeCell) ){
				return true;
			}
		});

		if ( !cellInCurrentShape && (!this.isCellExists(cell) || this.field[cell.y][cell.x] == 1) ){
			return false;
		}
	}.bind(this));

	if (res === false){
		return false;
	} else {
		return true;
	}
}

Tetris.prototype.equals = function(cell1, cell2){
	return (cell1.x == cell2.x && cell1.y == cell2.y);
}

Tetris.prototype.isCellExists = function(cell){
	return (this.field[cell.y] && this.field[cell.y][cell.x] !== undefined);
}

Tetris.prototype.setCell = function(cell, val){
	if( this.isCellExists(cell) ){
		this.field[cell.y][cell.x] = val;
		this.refresh();
	}
}

Tetris.prototype.refresh = function(){
	clearTimeout(this.refreshTimeout);

	this.refreshTimeout = setTimeout(function(){
		var i;

		for (i = 0; i < this._onRefresh.length; i++) {
			this._onRefresh[i](this.score, this.speed);
		}

	}.bind(this), 0);
}