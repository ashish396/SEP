/** verifyToken method - this method verifies token */
function verifyToken(req, res, next){
    
    //Request header with authorization key
    const bearerHeader = req.headers['authorization'];
    
    //Check if there is  a header
    if(typeof bearerHeader !== 'undefined'){

        const bearer = bearerHeader.split(' ');
        
        //Get Token arrray by spliting
        const bearerToken = bearer[1];

        req.token = bearerToken;

        //call next middleware
        next();

    }else{

        res.sendStatus(403);

    }
}