$(window).ready(function(){
	var CWIDTH = 100;
	var CHEIGHT = 150;
	var NUM_COLS = 7;
	var COLS_SIZE = 5;
	var TRANSITION_DURATION = 400; //in milliseconds

	var busyTable = false; //during deal and restart

	//used by columns
	var y_abs = -350;
	var x_abs = 0;
	var y_offset = CHEIGHT * 0.2;
	var x_offset = CWIDTH * 1.2;

	var discardPos = {
		'left': x_offset * (NUM_COLS-1),
		'top': 0
	};

	var suits = ['s','c','h','d'];
	var faces = ['a','2','3','4','5','6','7','8','9','10','j','q','k'];

	var deck = [];
	var cols = [];
	var drawPile = [];
	var discardPile = [];

	$('#table').on('touchstart click','.card',function(e){
		e.stopPropagation();
		e.preventDefault();
		var el = $(this);
		var card = el.data('card');

		if( card.busy || busyTable )
			return;

		busy( card );


		if( card.location == 'drawPile' ){
			draw( card );
		}else if( card.location == 'column' ){
			var col = cols[card.col];
			var topCard = col[col.length-1];
			if( card.num == topCard.num ){
				play( card );
			}
		}else if( card.location == 'discardPile' ){
			undo();
		}
	});

	function undo(){
		var card = discardPile.pop();
		if( card.col != -1 ){
			sendToCol( card );
		}else{
			sendToDrawPile( card );
		}
		cardsLeft();
	}

	function cardsLeft(){
		$('#cardsLeft').text( drawPile.length );
	}

	//disable overscroll in ios
	// $(document).bind('touchmove', function(e) {
	// 	e.preventDefault();
	// });

	function sendToDrawPile( card ){
		var el = getHtml( card );
		el.find('.back').removeClass('shadow');
		card.location = 'drawPile';
		card.col = -1;
		zindex(el, card.num);
		drawPile.push( card );
		flipDown( card );
		el.css("transform","translate(0px, 0px)");
	}

	function play( card ){
		if( discardPile.length ){
			var lastDiscard = discardPile[discardPile.length-1];	
			if(	(card.val == lastDiscard.val-1) || (card.val == lastDiscard.val+1) )
				discard( card );

			//allow ace <-> king
			if( $('#loopCards').hasClass('selected') ){
				if( ((card.val == 1) && (lastDiscard.val == faces.length)) ||
					((card.val == faces.length) && (lastDiscard.val == 1)) )
					discard( card );
			}
		}	
	}

	function discard( card ){
		var el = getHtml( card );
		var card = (card.location == 'drawPile') ? drawPile.pop() : cols[card.col].pop();
		
		discardPile.push( card );
		card.location = 'discardPile';
		zindex( el, discardPile.length );
		if( discardPile.length > 3 )
			el.find('.back').removeClass('shadow');
		else
			el.find('.back').addClass('shadow');

		cardsLeft();

		el.css("transform","translate("+discardPos.left+"px, "+discardPos.top+"px)");
	}


	function draw( card ){
		flipUp( card );
		setTimeout(function(){
			discard( card );
		},200);
	}

	function getHtml( card ){
		return $('#'+card.face+card.suit);
	}

	function sendToCol( card ){
		var col = cols[card.col];
		var left = x_abs + (x_offset * card.col);
		var top = y_abs + (y_offset * col.length);
		var el = getHtml(card);
		card.location = 'column';
		col.push( card );
		el.find('.back').addClass('shadow');

		zindex( el, col.length + ((COLS_SIZE+1-card.col)*COLS_SIZE) );
			
		el.css("transform","translate("+left+"px, "+top+"px)");
		cardsLeft();
	}

	function dealColumn(i, j){
		if(j < COLS_SIZE){
			setTimeout(function(){
				var card = drawPile.pop();
				card.col = i;
				flipUp( card );
				sendToCol( card );
				dealColumn(i, ++j);
			},75);
		}else{
			deal(--i);
		}
	}

	

	function deal(i){
		busyTable = true;
		if( i >= 0 ){
			dealColumn(i,0);
		}else{
			busyTable = false;
		}
	}

	

	function flipUp( card ){
		getHtml( card ).addClass('flip');
	}

	function flipDown( card ){
		getHtml( card ).removeClass('flip');
	}

	function zindex( card, index ){
		card.css('z-index', index+100);
		setTimeout(function(){
			card.css('z-index', index);
		}, TRANSITION_DURATION);
	}

	function busy( card ){
		card.busy = true;
		setTimeout(function(){
			card.busy = false;
		}, TRANSITION_DURATION);
	}

	

	//fisher yates shuffle 
	function fisherYates ( myArray ) {
	  var i = myArray.length;
	  if ( i == 0 ) return false;
	  while ( --i ) {
	     var j = Math.floor( Math.random() * ( i + 1 ) );
	     var tempi = myArray[i];
	     var tempj = myArray[j];
	     myArray[i] = tempj;
	     myArray[j] = tempi;
	   }
	}

	function Card( suit, face, val ){
		this.suit = suit;
		this.face = face;
		this.val = val;
		this.location = 'drawPile';
		this.num;
		this.col = -1;
	}

	function init(){
		for(var i = 0, suit; suit = suits[i++];){
			for(var j = 0, face; face = faces[j++];){
				var card = new Card(suit,face,j);
				// printCard( card );
				deck.push( card );
				getHtml(card).data('card', card);
			}
		}	

		resetStacks();
		shuffle();
		deal(NUM_COLS-1);
	}

	function reDeal(){
		busyTable = true;
		if(drawPile.length < deck.length){
			var card = deck[drawPile.length];
			sendToDrawPile( card );
			
			setTimeout(reDeal,0);
		}else{
			busyTable = false;
			setTimeout(function(){
				shuffle();
				deal(NUM_COLS-1);
			},TRANSITION_DURATION);
		}
	}
	

	function shuffle(){
		fisherYates( deck ); //shuffle

		drawPile = [];
		
		for(var i = 0, card; card = deck[i++];){
			card.num = i; //number the cards
			card.col = -1;
			getHtml(card).css('z-index', card.num);
			
			//push cards into draw pile
			drawPile.push( card );
		}
	}

	function resetStacks(){
		cols = [];
		discardPile = [];
		drawPile = [];

		for(var i = 0; i < NUM_COLS; i++){
			cols.push([]);
		}
	}

	function newGame(){
		resetStacks();
		reDeal();
	}

	function restart(){
		if( discardPile.length ){
			undo();
			setTimeout(restart,75);
		}
	}



	$('#newGame').on('touchstart click',function(e){
		e.stopPropagation();
		e.preventDefault();
		if(!busyTable &&  confirm('Start new game?')){
			newGame();
		}
	});

	$('#loopCards').on('touchstart click',function(e){
		e.stopPropagation();
		e.preventDefault();
		$(this).toggleClass('selected');
	});

	$('#restart').on('touchstart click',function(e){
		e.stopPropagation();
		e.preventDefault();
		if( !busyTable && confirm('Restart game?'))
			restart();
	});

	setTimeout(function(){
		$('#fountainTextG').fadeOut(1000);
		$('#table').addClass('show');
		setTimeout(init,1000);
	}, 3000);

	
});


