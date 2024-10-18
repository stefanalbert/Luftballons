


const EVT_BALLOON_TOUCHED = "event_balloon_touched";
const EVT_BALLOON_EXPIRED = "event_balloon_expired";
const BALLOON_WIDTH = 80;
const BALLOON_HEIGHT = 100;
const MAX_BALLOONS = 5;

// Represents the 'balloons' screen. Balloons are moving from the bottom to the top. When a balloon
// reaches the top it vanishes and a new one is created which again moves from top to bottom.
// Each balloon contains a text. When a balloon is touched it vanishes and and a new one is created
// same behaviour as when the balloon reaches the top.
// When the balloon is touched, an event is sent that contains the balloons text.
// Also, when the balloon reaches the top, a different event is sent also containing the balloon's text.
// Those events can be catched in other parts of the program and are used to implement the actual
// game logic.
//
// The balloon code is separated into a model and a view component. The model component contains the
// data, how many balloons, the position of each balloon and so on.
// The view component is responsible for rendering the balloons contained in the model on a canvas.
//
const balloons_model = {
	// The visible balloons.
	balloons:[], 
	// Helper object that contains the possible texts that can be shown on a newly
	// created balloon. It contains the text and the text's relative position inside
	// of the balloon.
	char_areas:[],
	// Variable that can be used to control the speed of the animation.
	ticks:0,
	// The balloon view. This object is responsible for rendering the balloons on 
	// a canvas.
	balloons_view:{
		canvas:0,
		width:0,
		height: 0,
		self:this,
		// Initialize the view.
		//
		// @param self: The reference to the view's parent, i.e. the model.
		// @param canvas: The canvas where the balloons are rendered.
		init: function(self,canvas) {
			this.canvas = canvas;
			this.width = canvas.width;
			this.height = canvas.height;
			this.self = self;

		},
		// Draw the balloons on the canvas. Firs the canvas is cleared and then
		// the balloons contained in the model are drawn.
		// This method is called after every update of the model.
		//
		draw: function() {
			if( this.canvas.getContext ){
				const ctx = this.canvas.getContext("2d");
				ctx.clearRect(0,0,this.width, this.height);

				this.self.balloons.forEach((cur_balloon) => {
					ctx.drawImage(cur_balloon.image, cur_balloon.pos_x, cur_balloon.pos_y, BALLOON_WIDTH, BALLOON_HEIGHT); 
					const txt = cur_balloon.text;
					ctx.fillStyle="white";
					ctx.font = "48px serif";

					ctx.fillText(txt.text, cur_balloon.pos_x+txt.pos_x, cur_balloon.pos_y +txt.pos_y);
				});
			};
		}
	},
	// Initialize the model. 
	// Among other things this methods starts a timer that calls the update function in regular 
	// intervals.
	//
	// @param canvas: The reference to the HTML canvas element where the balloons should be drawn.
	// @param chars: An array of possible texts that can be drawn on a newly created balloon.
	//
	init: function(canvas, chars) {
		// Create a new area that contains a text and the relative position of the text in the balloon.
		// The text is centered in the balloon, both vertically and horizontally.
		// 
		// @param text	The text that should be rendered.
		// @param canvas: A reference to the canvas object the text should be rendered on. This
		//                is used in this function to create a measuement of the text's width and
		//                height.
		//
		function create_char_area( text, canvas) {
			return {
				text:text,
				pos_x:0,
				pos_y:0,
				init: function(canvas){
					const context = canvas.getContext("2d");
					context.font = "48px serif";
					const area = context.measureText(this.text);
					this.pos_x = Math.floor((BALLOON_WIDTH - Math.floor(area.width))/2);
					const height = area.emHeightDescent; 
					this.pos_y = Math.floor((BALLOON_HEIGHT - Math.floor(height))/2) + 20;
					return this;
						}
				}.init(canvas);
		};

		this.balloons_view.init(this,canvas);
		chars.forEach( (cur_char) => {
			this.char_areas.push( create_char_area(cur_char, canvas));
			});

		canvas.addEventListener("touchstart", ((event)=>{this.on_touch(event)}));
		this.start_timer();
	}, 
	// Called when a touch event occurs on the canvas. It checks if the event happened inside of a balloon
	// and if that's the case the balloon is marked for removal on the next call to the update function.
	//
	on_touch: function(event){
		event.preventDefault();
		const touches = event.changedTouches;
		for( let i = 0; i<touches.length; i++) {
			this.balloons.forEach( (cur_balloon) =>{
				cur_balloon.hit(touches[i].pageX, touches[i].pageY);
			});
		};
	},
	// Update the model. This method is called in regular intervals and is responsible for moving the
	// balloons. It creates new balloons if necessary and also ensures that a balloon vanishes when
	// it reaches the top of the canvas.
	//
	update: function() {
		// Create a new balloon.
		//
		// @param self: A reference to the model object.
		//
		// @return A newly created balloon object. It has a random start x-coordinate and the
		//         balloon also contains a text randomly chosen from the possible texts 
		//         stored in the model.
		//
		function create_balloon(self){
			// Create a random x position that is inside the canvas.
			// @param self: A reference to the model object.
			//
			// @return A random number that represents a  x-coordinate witin the bounds of the canvas
			//
			function random_x_pos(self){
				return randomInt(self.balloons_view.width - BALLOON_WIDTH);
			};

			const balloon = new Image();
			balloon.src = "images/redballoon.svg";
			const index = randomInt(self.char_areas.length - 1 );

			// The balloon object.
			result = {
				image:balloon,
				text:self.char_areas[index],	
				pos_x:random_x_pos(self),
				pos_y:self.balloons_view.height - BALLOON_HEIGHT,
				// Check if the supplied x and y coordinates are within the bounds of the balloon.
				//
				// @param x: The x-coordinate.
				// @param y: The y-coordinate.
				//
				// @return True if the supplied x and y coordinate are inside the balloon
				//         and False if they are outside.
				//
				hit: function(x,y) {
					this.remove = (x>=this.pos_x) &&
				      		      (x<=this.pos_x + BALLOON_WIDTH) &&
				     		      (y>=this.pos_y) &&
				      		      (y<=this.pos_y + BALLOON_HEIGHT);	
				},
							remove:false
			};

			return result;
		};

		// Triggern an event.
		//
		// @param self: A reference to the object.
		// @param event_type: The event type.
		// @param data: The text that is contained in the balloon that triggered the event.
		//
		function trigger_event(self, event_type, data ){
			const evt = new CustomEvent( event_type,{detail:data});
			self.balloons_view.canvas.dispatchEvent( evt );
		};

		if((this.balloons.length<5) && (this.ticks % 50 == 0  ) ){
			this.balloons.push(create_balloon(this));
			this.ticks = 0;
		};

		this.ticks = this.ticks + 1;

		const tmp = [];

		this.balloons.forEach( (cur_balloon) => {
			cur_balloon.pos_y = cur_balloon.pos_y - 2;
			if( cur_balloon.remove ){
				trigger_event(this, EVT_BALLOON_TOUCHED, cur_balloon.text.text);
			} else {
				if( cur_balloon.pos_y >=0 ) {
					tmp.push(cur_balloon);
				}else{
					trigger_event(this, EVT_BALLOON_EXPIRED, cur_balloon.text.text);
				}
			}
		});

		this.balloons = tmp;

		this.start_timer();
		requestAnimationFrame((()=>{this.balloons_view.draw()}));

	},
	// Start a timer that calls the update method in regular intervals.
	//
	start_timer:function() {
		setTimeout(()=>{this.update()}, 30 ); 
	},
	// Add an event listener to the model.
	//
	// @param event_type	The event type for which a listener should
	//                      be added. Supported event types are one
	//                      of the "EVT_XX constants defined above.
	// @oaram handler	The handler that should be registered.
	//
	add_event_handler: function(event_type, handler ) {
		this.balloons_view.canvas.addEventListener(event_type, handler);
	}
};


// Utility function for creating a random integer.
//
// @param max: The random number will be between 0 and max.
//
// @return The random integer.
//
function randomInt(max) {
	return Math.floor(Math.random() * max );

};
