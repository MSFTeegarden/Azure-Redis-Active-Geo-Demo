/*
* This file contains the following routes:
* 1. /            renders index.ejs
* 2. /incrcount   increments the count and sends a message
* 3. /getcount    gets the latest value of the counter
*/

module.exports = function(app, redisClient) {

		app.post('/decrcount', function(req, res){
			console.log("POST ID:"+req.body.id);
			var counter_id = req.body.id;
			redisClient.decr(counter_id, function(err, value){
					if(err){
						throw err;
					}else{
						redisClient.publish("countchannel",counter_id); 
					}
				}
			);
			res.setHeader('content-type', 'text/plain');
			res.sendStatus(200);
		});

		app.get('/getcount', function(req, res){
			console.log("GET ID:"+req.query.id);
			var counter_id = req.query.id;
			redisClient.get(counter_id, function(err, value){
					if(err){
						throw err;
					}else{
						console.log(value);
						res.setHeader('content-type', 'text/plain');
						res.status(200).send(value);
					}
				}
			);
		});

		app.get('/reset', function(req, res){
			console.log("RESET COUNTS");
			redisClient.set("count1", 9);
			redisClient.set("count2", 13);
			redisClient.set("count3", 5);
			res.redirect('/');
		});

    app.get('/', function(req, res) {
			res.render('index.ejs'); // load the index.ejs file
    });
};
