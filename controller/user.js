const jwt = require('jsonwebtoken');
var md5 = require('md5');
var db = require('../model/db');
var Register = require('../model/userModel');



exports.create = function (req, res) {
    var md5 = require('md5');
    var new_task = new Register(req.body);
    // console.log(new_task.name);
    req.checkBody('new_task.name', 'Name is required').notEmpty();
    req.checkBody('new_task.email', 'Email is required').isEmail();
    req.checkBody('new_task.mobile', 'Mobile Number is required ').notEmpty();
    req.checkBody('new_task.password', 'Password is required ').notEmpty();
    req.checkBody('new_task.roleid', 'Role ID is required').notEmpty();
    req.checkBody('new_task.mobile', 'Mobile Number should be 10').notEmpty();

    var errors = req.validationErrors();
    var mobile = new_task.mobile;
    //console.log(errors);
    if (!new_task.name) {
        res.send([{ status: 0, message: errors[0].msg }]);
    } else if (!new_task.email) {
        res.send([{ status: 0, message: errors[1].msg }]);
    } else if (!mobile) {
        res.send([{ status: 0, message: errors[2].msg }]);
    } else if (!new_task.password) {
        res.send([{ status: 0, message: errors[3].msg }]);
    } else if (mobile.length > 10 || mobile.length <= 9) {
        res.send([{ status: 0, message: errors[5].msg }]);
    } else {
        Register.exists(new_task.mobile, function (err, data) {
            if (data.length > 0) {
                res.send([{ status: 0, msg: 'Phone Number already exists,please try another number' }]);
            } else {
                Register.Createuser(new_task, function (err, result) {
                    if (err) throw err;
                    else {
                        res.send([{ status: 1, msg: 'Regsitered Successfully!!!' }]);
                    }
                });
            }
        });
    }
};

exports.login = function (req, res) {
    var mobile = req.body.mobile;
    var password = req.body.password;
    db.query('select * from tbl_master_trainer where mobile=? and password=?', [mobile, password], function (error, results) {
        
        if (results.length > 0) {
            jwt.sign({ results }, 'SuperSecRetKey', (err, token) => {
                if(err){
                    res.send({err});
                }else{
                res.send([{ status: 1, msg: 'Success', Token: token, id: results[0].master_trainer_id,trainer_type_name:results[0].trainer_type_name, name: results[0].trainer_name }]);
                }
            });
        } else {
            res.send([{ status: 0, msg: 'Invalid Mobile Number and Password' }]);
        }
    });
};


