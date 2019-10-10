var express     =   require("express");
var app         =   express();
var db = require('../model/db');
const jwt = require('jsonwebtoken');
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

    res.send([{status:0,msg:'Token Not Defined'}]);
    }
}

app.get('/list_trainer_activation',verifyToken,function(req,res){
    jwt.verify(req.token, 'SuperSecRetKey', (err, authData)=>{

        var pageNo = parseInt(req.query.pageNo)
        var size = parseInt(req.query.size)
        var query = {}

        query.limit = pageNo
        query.skip = query.limit + 1
        db.query('select count(*) as count from tbl_master_trainer where is_deleted=0 and activation_date  < NOW() - INTERVAL 12 month ',function(err,totalCount){
        //var totalPages = Math.ceil(totalCount[0].count / size)
        db.query('select * from tbl_master_trainer where is_deleted=0 and activation_date  < NOW() - INTERVAL 12 month limit 10 offset ?',query.limit,function(error,result){
            if(result.length==0){
                res.send([{status:0,list_renewal_CT:'No result found'}]);
            }else{
                
                res.send([{status:1,list_renewal_CT:result,total_count:totalCount}]);
            }
        });
     });
    });  
});

app.put('/update_trainer_activation/:id',verifyToken,function(req,res){
    jwt.verify(req.token, 'SuperSecRetKey', (err, authData)=>{
        if(err){
            res.send([{status:0,msg:err}]);
        }else{
            var data = {
                "activation_date":req.body.activation_date,
                "last_modified_by":authData['results'][0].company_code,
            }
            var id = req.params.id;
            // Validation
                if(!data.activation_date){
                    res.send([{status:0,msg:'Activation date is required'}]);
                
                }else{
                    db.query('update tbl_master_trainer set ? where master_trainer_id = ? ',[data,id],function(err,result){
                        if(err){
                            res.send([{status:0,msg:'Something went wrong',error:error}]); 
                        }else{
                            res.send([{status:1,msg:'Data Updated Successfully'}]);
                        }
                    });
                }
            }
    });
});


module.exports = app;