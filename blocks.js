// global variables
var grid;       // Game state grid

var t;          // Tetrimino type
var x, y;       // Tetrimino position
var o;          // Tetrimino orientation
var next_t;     // Type of next Tetrimino

var canvasWidth;    // Calculated canvas width in pixel
var canvasHeight;   // Calculated canvas height in pixel

var timer;      // Game timer
var timestep;   // Time between calls to gameStep()
var score;      // Player's score
var level;      // Current level
var paused;     // Game pause state
var gameover;   // Gameover state

var soundRow = new Audio('row.ogg');

/************************************************
Initialize the drawing canvas and start the game
************************************************/
function initialize() {
  createField();
  createPreviewField();
  startGame();
  addTouchListener();
  paused = true;
}

function showGame() {
  document.getElementById("menu").style.display = 'none';
  document.getElementById("game").style.display = 'block';
  document.getElementById("help").style.display = 'none';
}

function showHelp() {
  document.getElementById("menu").style.display = 'none';
  document.getElementById("game").style.display = 'none';
  document.getElementById("help").style.display = 'block';
}

function showMenu() {
  document.getElementById("menu").style.display = 'block';
  document.getElementById("game").style.display = 'none';
  document.getElementById("help").style.display = 'none';
}

function createField() {
  var grid = document.getElementById('grid');
  for (var y = 19; y >= 0; y--) {
    for (var x = 0; x < 10; x++) {
      var div = document.createElement('div');
      grid.appendChild(div)
    }
  }

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

  // TODO make this better :D
  document.getElementById("game").style.height = canvasHeight+"px";
  document.getElementById("game").style.width = canvasWidth+"px";
  document.getElementById("game").style.marginTop = (height-canvasHeight)/2+"px";
  document.getElementById("game").style.marginBottom = (height-canvasHeight)/2+"px";
  document.getElementById("game").style.marginLeft = (width-canvasWidth)/2+"px";
  document.getElementById("game").style.marginRight = (width-canvasWidth)/2+"px";
}

function createPreviewField() {
  var next = document.getElementById('next');
  var preview = document.createElement('div');
  preview.setAttribute("id", "preview");
  preview.style.width = canvasHeight / 20 * 4 +"px";
  for (var y = 1; y >= 0; y--) {
    for (var x = 0; x <= 3; x++) {
      var div = document.createElement('div');
      div.style.height = canvasHeight / 20 +"px";
      div.style.width = canvasWidth / 10 +"px";
      preview.appendChild(div)
    }
  }
  next.appendChild(preview);
}

function addTouchListener() {
  detectTouch(document.body, function(gesture) {
    if(gameover) { startGame(); return; }
    if(paused && gesture != 'long_touch_top') return;
    if     (gesture == 'touch_left')  inputMoveLeft();
    else if(gesture == 'touch_right') inputMoveRight();
    else if(gesture == 'swipe_up'   || gesture == 'swipe_left')   inputRotateLeft();
    else if(gesture == 'swipe_down' || gesture == 'swipe_right')  inputRotateRight();
    else if(gesture == 'touch_bottom')  inputDrop();
    else if(gesture == 'long_touch')  togglePause();
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
    if(paused) return; // default click behaviour for game menu
    var touchobj = e.changedTouches[0];
    gesture = 'none';
    dist = 0;
    startX = touchobj.pageX;
    startY = touchobj.pageY;
    startTime = new Date().getTime(); // record time when finger first makes contact with surface
    e.preventDefault();
  }, false)

  touchsurface.addEventListener('touchmove', function(e){
    if(paused) return; // default click behaviour for game menu
    e.preventDefault();
  }, false)

  touchsurface.addEventListener('touchend', function(e){
    if(paused) return; // default click behaviour for game menu

    var touchobj = e.changedTouches[0]
    distX = touchobj.pageX - startX // get horizontal dist traveled by finger while in contact with surface
    distY = touchobj.pageY - startY // get vertical dist traveled by finger while in contact with surface
    elapsedTime = new Date().getTime() - startTime // get time elapsed
    if (elapsedTime <= allowedTime) {
      if (Math.abs(distX) < threshold && Math.abs(distY) < restraint){ // small distance means touch
        if(startY > window.innerHeight*3/4) gesture = 'touch_bottom';
        else gesture = startX < window.innerWidth/2 ? 'touch_left' : 'touch_right';
      }
      else if (Math.abs(distX) >= threshold && Math.abs(distY) <= restraint){ // condition for horizontal swipe met
        gesture = (distX < 0)? 'swipe_left' : 'swipe_right' // if dist traveled is negative, it indicates left swipe
      }
      else if (Math.abs(distY) >= threshold && Math.abs(distX) <= restraint){ // condition for vertical swipe met
        gesture = (distY < 0)? 'swipe_up' : 'swipe_down' // if dist traveled is negative, it indicates up swipe
      }
    }
    else gesture = 'long_touch';  //startY < window.innerHeight/2 ? 'long_touch_top' : 'long_touch_bottom';
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
  next_t = 1 + Math.floor((Math.random()*7));
  x = 4;
  y = 18;
  o = 0;
  //Create an empty game state grid
  // TODO I think this loop is duplicated and could go to a method
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
  drawNextTetrimino();
  document.getElementById("flash").style.opacity = 0;
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
  // clear the field
  var blocks = document.getElementById("grid").children;
  var l = blocks.length
  for (var i = 0; i < l; i++) {
    blocks[i].className = "";
  }
  // loop over each grid cell
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
  var c;
  if(t > 0) {
    if(t == 1)         //I type
      c = 'cyan';
    else if(t == 2)    //J type
      c = 'blue';
    else if(t == 3)    //L type
      c = 'orange';
    else if(t == 4)    //O type
      c = 'yellow';
    else if(t == 5)    //S type
      c = 'green';
    else if(t == 6)    //T type
      c = 'purple';
    else               //Z type
      c = 'red';
    document.getElementById("grid").children[(19-y)*10+x].className = c + " block";
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
  e.preventDefault();
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
  else if(e.keyCode == 80) togglePause();      // p-key
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

function togglePause() {
  paused = !paused;
  if(paused) showMenu();
  else showGame();
}

function redrawAfterInput() {
  drawTetrimino(x,y,t,o,1);
  drawGrid();
  drawScoreAndLevel();
  //if(paused) drawPaused();
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
    t2 = next_t;
    x2 = 4;
    y2 = 18;
    o2 = 0;
    next_t = 1 + Math.floor((Math.random()*7));
    drawNextTetrimino();
    //Check if valid
    if(drawTetrimino(x2,y2,t2,o2,-1)) {
      t = t2;
      x = x2;
      y = y2;
      o = o2;
      //document.getElementById("grid").style.boxShadow = "inset 0px 0px 100px 50px "+ blockColor(t);
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

function blockColor(t) {
  return ['cyan', 'blue', 'orange', 'yellow', 'green', 'purple', 'red'][t-1];
}

function drawNextTetrimino() {
  preview = document.getElementById("preview").children;
  for(i = 0; i < preview.length; i++) {
    preview[i].className = "";
  }
  if(next_t == 1) {         //I type
    preview[4].className = "cyan block";
    preview[5].className = "cyan block";
    preview[6].className = "cyan block";
    preview[7].className = "cyan block";
  }
  else if(next_t == 2) {    //J type
    preview[0].className = "blue block";
    preview[4].className = "blue block";
    preview[5].className = "blue block";
    preview[6].className = "blue block";
  }
  else if(next_t == 3) {    //L type
    preview[2].className = "orange block";
    preview[4].className = "orange block";
    preview[5].className = "orange block";
    preview[6].className = "orange block";
  }
  else if(next_t == 4) {    //O type
    preview[1].className = "yellow block";
    preview[2].className = "yellow block";
    preview[5].className = "yellow block";
    preview[6].className = "yellow block";
  }
  else if(next_t == 5) {    //S type
    preview[1].className = "green block";
    preview[2].className = "green block";
    preview[4].className = "green block";
    preview[5].className = "green block";
  }
  else if(next_t == 6) {    //T type
    preview[1].className = "purple block";
    preview[4].className = "purple block";
    preview[5].className = "purple block";
    preview[6].className = "purple block";
  }
  else {                    //Z type
    preview[0].className = "red block";
    preview[1].className = "red block";
    preview[5].className = "red block";
    preview[6].className = "red block";
  }
}

/*************************************************
Removes completed lines from the grid
*************************************************/
function checkLines() {
  document.getElementById("level").className = "";
  var cleared_at_least_one_line = false;

   //Loop over each line in the grid
  for(i = 0; i < 20; i++) {
    //Check if the line is full
    full = true;
    for(j = 0; j < 10; j++)
      full = full && (grid[i][j] > 0);
    if(full) {
      cleared_at_least_one_line = true;
      //Increase score
      score = score + level;
      //Check if ready for the next level
      if(score >= level*10) {
        level++;
        document.getElementById("level").className = "up";
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
  if(cleared_at_least_one_line) soundRow.play();
}

/*************************************************
Draws the current score and level
*************************************************/
function drawScoreAndLevel() {
  document.getElementById("score").innerHTML = score;
  document.getElementById("level").innerHTML = "Level " + level;
}

/*************************************************
Sets gameover state and draws its text
*************************************************/
function setAndDrawGameover() {
  gameover = true;
  flash = document.getElementById("flash");
  flash.innerHTML = "Game Over";
  flash.style.opacity = "1";
}
