'use strict';
const jwt = require('jsonwebtoken');
var Task = require('../model/appModel.js');

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

exports.list_all_tasks = function(req, res) {
  Task.getAllTask(function(err, task) {

    console.log('controller')
    if (err)
      res.send(err);
      console.log('res', task);
    res.send(task);
  });
};


exports.create_a_task = function(req, res) {
  var new_task = new Task(req.body);

  //handles null error 
   if(!new_task.task || !new_task.status){
       
            res.status(400).send({ error:true, message: 'Please provide task/status' });
        }
else{
Task.exists(new_task.task,function(err,data){
if(data.length>0){
res.send({message:'already'});
    }else{
  Task.createTask(new_task, function(err, task) {
    if (err)
      res.send(err);
    res.send({message:'Data Added'});
  });
}
});
}
};


exports.read_a_task = verifyToken, (req, res)=> {
    jwt.verify(req.token, 'SuperSecRetKey', (error, authData)=>{
        if(error){
            res.send({status:0,message:'Token required'});
        }else{
        Task.getTaskById(req.params.taskId, function(err, task) {
            if (err)
            res.send(err);
            res.json(task);
                });
        }
    });
};


exports.update_a_task = function(req, res) {
  Task.updateById(req.params.taskId, new Task(req.body), function(err, task) {
    if (err)
      res.send(err);
    res.json(task);
  });
};

exports.delete_a_task = function(req, res) {

  Task.remove( req.params.taskId, function(err, task) {
    if (err)
      res.send(err);
    res.json({ message: 'Task successfully deleted' });
  });
};