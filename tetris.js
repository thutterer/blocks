//Golbal variables
var ctx;        // Canvas object
var grid;       // Game state grid

var t;          // Tetrimino type
var x, y;       // Tetrimino position
var o;          // Tetrimino orientation

var canvasWidth;    // Calculated canvas width in pixel
var canvasHeight;   // Calculated canvas height in pixel
var blockSize;      // Calculated block size in pixel

var timer;      // Game timer
var timestep;   // Time between calls to gameStep()
var score;      // Player's score
var level;      // Current level
var paused;     // Game pause state
var gameover;   // Gameover state

/************************************************
Initialize the drawing canvas and start the game
************************************************/
function initialize() {
    scaleCanvas();
    addTouchListener();
    ctx = document.getElementById("myCanvas").getContext("2d");
    startGame();
}

/************************************************
Scale the drawing canvas to fit into window
************************************************/
function scaleCanvas() {
  var width = window.innerWidth;
  var height = window.innerHeight;

  if(width < height/2) {  // width is the limiting factor
    canvasWidth = width;
    canvasHeight = width * 2;
  }
  else {                  // height is the limiting factor
    canvasHeight = height;
    canvasWidth = height/2
  }
  blockSize = canvasWidth/10;
  document.getElementById("myCanvas").height = canvasHeight;
  document.getElementById("myCanvas").width = canvasWidth;
  document.getElementById("myCanvas").style.marginTop = (height-canvasHeight)/2+"px";
  document.getElementById("myCanvas").style.marginLeft = (width-canvasWidth)/2+"px";
}

function addTouchListener() {
  detectTouch(document.body, function(gesture) {
    if     (gesture == 'touch_left')  inputMoveLeft();
    else if(gesture == 'touch_right') inputMoveRight();
    else if(gesture == 'swipe_up'   || gesture == 'swipe_left')   inputRotateLeft();
    else if(gesture == 'swipe_down' || gesture == 'swipe_right')  inputRotateRight();
    else if(gesture == 'long_touch')  inputDrop();
    redrawAfterInput();
  });
}

/************************************************
Detects touch gestures
see http://www.javascriptkit.com/javatutors/touchevents2.shtml
************************************************/
function detectTouch(el, callback){
    var touchsurface = el,
    gesture,
    startX,
    startY,
    distX,
    distY,
    threshold = 150, //required min distance traveled to be considered swipe
    restraint = 100, // maximum distance allowed at the same time in perpendicular direction
    allowedTime = 300, // maximum time allowed to travel that distance
    elapsedTime,
    startTime,
    handletouch = callback || function(gesture){}

    touchsurface.addEventListener('touchstart', function(e){
        var touchobj = e.changedTouches[0]
        gesture = 'none'
        dist = 0
        startX = touchobj.pageX
        startY = touchobj.pageY
        startTime = new Date().getTime() // record time when finger first makes contact with surface
        e.preventDefault()
    }, false)

    touchsurface.addEventListener('touchmove', function(e){
        e.preventDefault() // prevent scrolling when inside DIV
    }, false)

    touchsurface.addEventListener('touchend', function(e){
      var touchobj = e.changedTouches[0]
      distX = touchobj.pageX - startX // get horizontal dist traveled by finger while in contact with surface
      distY = touchobj.pageY - startY // get vertical dist traveled by finger while in contact with surface
      elapsedTime = new Date().getTime() - startTime // get time elapsed
      if (elapsedTime <= allowedTime) {
        if (Math.abs(distX) < threshold && Math.abs(distY) < restraint){ // small distance means touch
          gesture = startX < window.innerWidth/2 ? 'touch_left' : 'touch_right'
        }
        else if (Math.abs(distX) >= threshold && Math.abs(distY) <= restraint){ // condition for horizontal swipe met
          gesture = (distX < 0)? 'swipe_left' : 'swipe_right' // if dist traveled is negative, it indicates left swipe
        }
        else if (Math.abs(distY) >= threshold && Math.abs(distX) <= restraint){ // condition for vertical swipe met
          gesture = (distY < 0)? 'swipe_up' : 'swipe_down' // if dist traveled is negative, it indicates up swipe
        }
      }
      else gesture = 'long_touch';
      handletouch(gesture)
      e.preventDefault()
    }, false)
}

/************************************************
Reset everything to (re)start the game
************************************************/
function startGame() {
    //Initialize tetrimino variables
    t = 1 + Math.floor((Math.random()*7));
    x = 4;
    y = 18;
    o = 0;
    //Create an empty game state grid
    grid = new Array(20);
    for(i = 0; i < 20; i++) {
        grid[i] = new Array(10);
        for(j = 0; j < 10; j++)
            grid[i][j] = 0;
    }
    //Draw the current tetrimino
    drawTetrimino(x,y,t,o,1);
    //Redraw the grid
    drawGrid();
    score = 0;
    level = 1;
    drawScoreAndLevel();
    //Start the game timer
    timestep = 1000;
    paused = false;
    gameover = false;
    clearInterval(timer);
    timer = setInterval(function(){gameStep()}, timestep);
}

/************************************************
Draws the current game state grid
************************************************/
function drawGrid() {
    //Clear the canvas
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    //Loop over each grid cell
    for(i = 0; i < 20; i++) {
        for(j = 0; j < 10; j++)
            drawBlock(j, i, grid[i][j]);
    }
}

/************************************************
Draws a block at the specified game coordinate
x = [0,9]   x-coordinate
y = [0,19]  y-coordinate
t = [0,7]   block type
************************************************/
function drawBlock(x, y, t) {
    //Check if a block needs to be drawn
    if(t > 0) {
        //Get the block color
        var c;
        if(t == 1)        //I type
            c = 180;    //Cyan
        else if(t == 2)    //J type
            c = 240;    //Blue
        else if(t == 3)    //L type
            c = 40;        //Orange
        else if(t == 4)    //O type
            c = 60;        //Yellow
        else if(t == 5) //S type
            c = 120;    //Green
        else if(t == 6) //T type
            c = 280;    //Purple
        else            //Z type
            c = 0;        //Red
        //Convert game coordinaes to pixel coordinates
        pixelX = x*blockSize;
        pixelY = (19-y)*blockSize;

        /**** Draw the center part of the block ****/
        //Set the fill color using the supplied color
        ctx.fillStyle = "hsl(" + c + ",100%,50%)";
        //Create a filled rectangle
        ctx.fillRect(pixelX+2, pixelY+2, blockSize-2, blockSize-2);

        /**** Draw the top part of the block ****/
        //Set the fill color slightly lighter
        ctx.fillStyle = "hsl(" + c + ",100%,70%)";
        //Create the top polygon and fill it
        ctx.beginPath();
        ctx.moveTo(pixelX, pixelY);
        ctx.lineTo(pixelX+blockSize, pixelY);
        ctx.lineTo(pixelX+blockSize-2,pixelY+2);
        ctx.lineTo(pixelX+2, pixelY+2);
        ctx.fill();

        /**** Draw the sides of the block ****/
        //Set the fill color slightly darker
        ctx.fillStyle = "hsl(" + c + ",100%,40%)";
        //Create the left polygon and fill it
        ctx.beginPath();
        ctx.moveTo(pixelX, pixelY);
        ctx.lineTo(pixelX, pixelY+blockSize);
        ctx.lineTo(pixelX+2,pixelY+blockSize-2);
        ctx.lineTo(pixelX+2,pixelY+2);
        ctx.fill();

        //Create the right polygon and fill it
        ctx.beginPath();
        ctx.moveTo(pixelX+blockSize, pixelY);
        ctx.lineTo(pixelX+blockSize, pixelY+blockSize);
        ctx.lineTo(pixelX+blockSize-2, pixelY+blockSize-2);
        ctx.lineTo(pixelX+blockSize-2, pixelY+2);
        ctx.fill();

        /**** Draw the bottom part of the block ****/
        //Set the fill color much darker
        ctx.fillStyle = "hsl(" + c + ",100%,30%)";
        //Create the bottom polygon and fill it
        ctx.beginPath();
        ctx.moveTo(pixelX, pixelY+blockSize);
        ctx.lineTo(pixelX+blockSize, pixelY+blockSize);
        ctx.lineTo(pixelX+blockSize-2, pixelY+blockSize-2);
        ctx.lineTo(pixelX+2,pixelY+blockSize-2);
        ctx.fill();
    }
}

/*************************************************
Draws a tetrimino at the specified game coordinate
with the specified orientation
x = [0,9]   x-coordinate
y = [0,19]  y-coordinate
t = [1,7]   tetrimino type
o = [0,3]   orientation
d = [-1,1]    test, erase, or draw
*************************************************/
function drawTetrimino(x,y,t,o,d) {

    //Determine the value to send to setGrid
    c = -1;
    if(d >= 0) c = t*d;

    //Initialize validity test
    valid = true;

    /**** Pick the appropriate tetrimino type ****/
    if(t == 1) { //I Type

        //Get orientation
        if(o == 0) {
            valid = valid && setGrid(x-1,y,c);
            valid = valid && setGrid(x,y,c);
            valid = valid && setGrid(x+1,y,c);
            valid = valid && setGrid(x+2,y,c);
        }
        else if(o == 1) {
            valid = valid && setGrid(x+1,y+1,c);
            valid = valid && setGrid(x+1,y,c);
            valid = valid && setGrid(x+1,y-1,c);
            valid = valid && setGrid(x+1,y-2,c);
        }
        else if(o == 2) {
            valid = valid && setGrid(x-1,y-1,c);
            valid = valid && setGrid(x,y-1,c);
            valid = valid && setGrid(x+1,y-1,c);
            valid = valid && setGrid(x+2,y-1,c);
        }
        else if(o == 3) {
            valid = valid && setGrid(x,y+1,c);
            valid = valid && setGrid(x,y,c);
            valid = valid && setGrid(x,y-1,c);
            valid = valid && setGrid(x,y-2,c);
        }
    }
    if(t == 2) { //J Type

        //Get orientation
        if(o == 0) {
            valid = valid && setGrid(x-1,y+1,c);
            valid = valid && setGrid(x-1,y,c);
            valid = valid && setGrid(x,y,c);
            valid = valid && setGrid(x+1,y,c);
        }
        else if(o == 1) {
            valid = valid && setGrid(x+1,y+1,c);
            valid = valid && setGrid(x,y+1,c);
            valid = valid && setGrid(x,y,c);
            valid = valid && setGrid(x,y-1,c);
        }
        else if(o == 2) {
            valid = valid && setGrid(x-1,y,c);
            valid = valid && setGrid(x,y,c);
            valid = valid && setGrid(x+1,y,c);
            valid = valid && setGrid(x+1,y-1,c);
        }
        else if(o == 3) {
            valid = valid && setGrid(x,y+1,c);
            valid = valid && setGrid(x,y,c);
            valid = valid && setGrid(x,y-1,c);
            valid = valid && setGrid(x-1,y-1,c);
        }
    }
    if(t == 3) { //L Type

        //Get orientation
        if(o == 0) {
            valid = valid && setGrid(x-1,y,c);
            valid = valid && setGrid(x,y,c);
            valid = valid && setGrid(x+1,y,c);
            valid = valid && setGrid(x+1,y+1,c);
        }
        else if(o == 1) {
            valid = valid && setGrid(x,y+1,c);
            valid = valid && setGrid(x,y,c);
            valid = valid && setGrid(x,y-1,c);
            valid = valid && setGrid(x+1,y-1,c);
        }
        else if(o == 2) {
            valid = valid && setGrid(x-1,y-1,c);
            valid = valid && setGrid(x-1,y,c);
            valid = valid && setGrid(x,y,c);
            valid = valid && setGrid(x+1,y,c);
        }
        else if(o == 3) {
            valid = valid && setGrid(x-1,y+1,c);
            valid = valid && setGrid(x,y+1,c);
            valid = valid && setGrid(x,y,c);
            valid = valid && setGrid(x,y-1,c);
        }
    }
    if(t == 4) { //O Type

        //Orientation doesn’t matter
        valid = valid && setGrid(x,y,c);
        valid = valid && setGrid(x+1,y,c);
        valid = valid && setGrid(x,y+1,c);
        valid = valid && setGrid(x+1,y+1,c);
    }
    if(t == 5) { //S Type

        //Get orientation
        if(o == 0) {
            valid = valid && setGrid(x-1,y,c);
            valid = valid && setGrid(x,y,c);
            valid = valid && setGrid(x,y+1,c);
            valid = valid && setGrid(x+1,y+1,c);
        }
        else if(o == 1) {
            valid = valid && setGrid(x,y+1,c);
            valid = valid && setGrid(x,y,c);
            valid = valid && setGrid(x+1,y,c);
            valid = valid && setGrid(x+1,y-1,c);
        }
        else if(o == 2) {
            valid = valid && setGrid(x-1,y-1,c);
            valid = valid && setGrid(x,y-1,c);
            valid = valid && setGrid(x,y,c);
            valid = valid && setGrid(x+1,y,c);
        }
        else if(o == 3) {
            valid = valid && setGrid(x-1,y+1,c);
            valid = valid && setGrid(x-1,y,c);
            valid = valid && setGrid(x,y,c);
            valid = valid && setGrid(x,y-1,c);
        }
    }
    if(t == 6) { //T Type

        //Get orientation
        if(o == 0) {
            valid = valid && setGrid(x-1,y,c);
            valid = valid && setGrid(x,y,c);
            valid = valid && setGrid(x+1,y,c);
            valid = valid && setGrid(x,y+1,c);
        }
        else if(o == 1) {
            valid = valid && setGrid(x,y+1,c);
            valid = valid && setGrid(x,y,c);
            valid = valid && setGrid(x,y-1,c);
            valid = valid && setGrid(x+1,y,c);
        }
        else if(o == 2) {
            valid = valid && setGrid(x-1,y,c);
            valid = valid && setGrid(x,y,c);
            valid = valid && setGrid(x+1,y,c);
            valid = valid && setGrid(x,y-1,c);
        }
        else if(o == 3) {
            valid = valid && setGrid(x,y+1,c);
            valid = valid && setGrid(x,y,c);
            valid = valid && setGrid(x,y-1,c);
            valid = valid && setGrid(x-1,y,c);
        }
    }
    if(t == 7) { //Z Type

        //Get orientation
        if(o == 0) {
            valid = valid && setGrid(x-1,y+1,c);
            valid = valid && setGrid(x,y+1,c);
            valid = valid && setGrid(x,y,c);
            valid = valid && setGrid(x+1,y,c);
        }
        else if(o == 1) {
            valid = valid && setGrid(x+1,y+1,c);
            valid = valid && setGrid(x+1,y,c);
            valid = valid && setGrid(x,y,c);
            valid = valid && setGrid(x,y-1,c);
        }
        else if(o == 2) {
            valid = valid && setGrid(x-1,y,c);
            valid = valid && setGrid(x,y,c);
            valid = valid && setGrid(x,y-1,c);
            valid = valid && setGrid(x+1,y-1,c);
        }
        else if(o == 3) {
            valid = valid && setGrid(x,y+1,c);
            valid = valid && setGrid(x,y,c);
            valid = valid && setGrid(x-1,y,c);
            valid = valid && setGrid(x-1,y-1,c);
        }
    }

    return valid;
}

/*************************************************
Sets a grid cell in the game state grid
x = [0,9]   x-coordinate
y = [0,19]  y-coordinate
t = [-1,7]  test or block type
*************************************************/
function setGrid(x, y, t) {

    //Check if point is in range
    if(x >= 0 && x < 10 && y >= 0 && y < 20) {

        //Return test result if testing
        if(t < 0) return grid[y][x] == 0;

        //Otherwise assign block type to the grid
        grid[y][x] = t;
        return true;
    }
    return false;
}

/*************************************************
Responds to a key press event
*************************************************/
function keyDown(e) {
  // any key to restart from gameover mode
  if(gameover) {
    startGame();
    return;
  }
  // no controls in pause mode
  if(paused && e.keyCode != 80) return;

  if     (e.keyCode == 37) inputMoveLeft();    // left arrow
  else if(e.keyCode == 38) inputRotateLeft();  // up arrow
  else if(e.keyCode == 39) inputMoveRight();   // right arrow
  else if(e.keyCode == 40) inputRotateRight(); // down arrow
  else if(e.keyCode == 32) inputDrop();        // space-bar
  else if(e.keyCode == 80) paused = !paused;   // p-key
  redrawAfterInput();
}

function inputMoveLeft() {
  drawTetrimino(x,y,t,o,0);  // Erase the current tetrimino
  x2 = x - 1;
  if(drawTetrimino(x2,y,t,o,-1)) // Check if valid
    x = x2;
}

function inputRotateLeft() {
  drawTetrimino(x,y,t,o,0);  // Erase the current tetrimino
  o2 = (o + 1) % 4;
  if(drawTetrimino(x,y,t,o2,-1)) // Check if valid
    o = o2;
}

function inputMoveRight() {
  drawTetrimino(x,y,t,o,0);  // Erase the current tetrimino
  x2 = x + 1;
  if(drawTetrimino(x2,y,t,o,-1)) // Check if valid
    x = x2;
}

function inputRotateRight() {
  drawTetrimino(x,y,t,o,0);  //Erase the current tetrimino
  o2 = (o + 3) % 4;
  if(drawTetrimino(x,y,t,o2,-1)) //Check if valid
    o = o2;
}

function inputDrop() {
  drawTetrimino(x,y,t,o,0);  //Erase the current tetrimino
  //Move down until invalid
  while(drawTetrimino(x,y-1,t,o,-1))
    y -= 1;
    gameStep();
}

function redrawAfterInput() {
  drawTetrimino(x,y,t,o,1);
  drawGrid();
  drawScoreAndLevel();
  if(paused) drawPaused();
}
/*************************************************
Updates the game state at regular intervals
*************************************************/
function gameStep() {
    //Do nothing while in pause or gameover mode
    if(paused || gameover) return;
    //Erase the current tetrimino
    drawTetrimino(x,y,t,o,0);
    //Check if the tetrimino can be dropped 1 block
    y2 = y - 1;
    if(drawTetrimino(x,y2,t,o,-1))
        y = y2;
    else {
        //Redraw last tetrimino
        drawTetrimino(x,y,t,o,1);
        //Check if any lines are complete
        checkLines();
        //Create a new tetrimino
        t2 = 1 + Math.floor((Math.random()*7));
        x2 = 4;
        y2 = 18;
        o2 = 0;
        //Check if valid
        if(drawTetrimino(x2,y2,t2,o2,-1)) {
            t = t2;
            x = x2;
            y = y2;
            o = o2;
        }
        else {
            setAndDrawGameover();
            return;
        }
    }
    //Draw the current tetrimino
    drawTetrimino(x,y,t,o,1);
    //Redraw the grid
    drawGrid();
    drawScoreAndLevel();
}

/*************************************************
Removes completed lines from the grid
*************************************************/
function checkLines() {
     //Loop over each line in the grid
    for(i = 0; i < 20; i++) {
        //Check if the line is full
        full = true;
        for(j = 0; j < 10; j++)
            full = full && (grid[i][j] > 0);
        if(full) {
            //Increase score
            score++;
            //Check if ready for the next level
            if(score >= level*10) {
                level++;
                //Update the timer with a shorter timestep
                timestep *= 0.8;
                clearInterval(timer);
                timer = setInterval(function(){gameStep()}, timestep);
            }
            //Loop over the remaining lines
            for(ii = i; ii < 19; ii++) {
                //Copy each line from the line above
                for(j = 0; j < 10; j++)
                    grid[ii][j] = grid[ii+1][j];
            }
            //Make sure the top line is clear
            for(j = 0; j < 10; j++)
                grid[19][j] = 0;
            //Repeat the check for this line
            i--;
        }
    }
}

/*************************************************
Draws the current score and level
*************************************************/
function drawScoreAndLevel() {
  var fontSize = Math.floor(canvasHeight/50);
  ctx.font = fontSize + "px Courier";
  ctx.fillStyle = "white";
  ctx.fillText("Score: " + score, 5, fontSize*1.25);
  ctx.fillText("Level: " + level, 5, fontSize*2.5);
}

/*************************************************
Draws text for paused mode
*************************************************/
function drawPaused() {
  var fontSize = Math.floor(canvasHeight/20);
  ctx.font = fontSize + "px Courier";
  ctx.fillStyle = "white";
  ctx.fillText("PAUSED", canvasWidth/4, canvasHeight/2-fontSize/2);
}

/*************************************************
Sets gameover state and draws its text
*************************************************/
function setAndDrawGameover() {
  var fontSize = Math.floor(canvasHeight/20);
  gameover = true;
  ctx.font = fontSize + "px Courier";
  ctx.fillStyle = "white";
  ctx.fillText("GAME OVER", canvasWidth/5, canvasHeight/2-fontSize/2);
}
