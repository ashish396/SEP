
/* -----------------Created by Ashish Singla------------------------*/

var express = require("express");
var app = express();
var db = require('../model/db');
const jwt = require('jsonwebtoken');
var promise = require('promise');

function verifyToken(req, res, next) {

    //Request header with authorization key
    const bearerHeader = req.headers['authorization'];

    //Check if there is  a header
    if (typeof bearerHeader !== 'undefined') {

        const bearer = bearerHeader.split(' ');

        //Get Token arrray by spliting
        const bearerToken = bearer[1];

        req.token = bearerToken;

        //call next middleware
        next();

    } else {

        res.send([{ status: 0, msg: 'Token Not Defined' }]);
    }
}

app.get('/dashboard', verifyToken, function (req, res) {
    jwt.verify(req.token, 'SuperSecRetKey', (err, authData) => {
        if (err) {
            res.send([{ status: 0, msg: err }]);
        } else {
            var student = function () {
                return new Promise(function (resolve, reject) {
                    db.query("SELECT count(*) as student_count FROM `tbl_register` ", function (error, result) {
                        //console.log(result[0].student_count);
                        if (error) {
                            reject();
                        } else { resolve(result[0].student_count); }
                    });
                });
            }
            var training = function () {
                return new Promise(function (resolve, reject) {
                    db.query("SELECT count(*) as training_count FROM `tbl_master_training_type` WHERE is_deleted=1", function (error, result) {
                        if (error) {
                            reject();
                        } else { resolve(result[0].training_count); }
                    });
                });
            }
            var certified_trainer = function () {
                return new Promise(function (resolve, reject) {
                    db.query("SELECT count(*) as CT FROM `tbl_master_trainer` where trainer_type_name='Certified Trainer'", function (error, result) {
                        if (error) {
                            reject(error);
                        } else { resolve(result[0].CT); }
                    });
                });
            }
            var certified_master_trainer = function () {
                return new Promise(function (resolve, reject) {
                    db.query("SELECT count(*) as CMT FROM `tbl_master_trainer` where trainer_type_name='Certified Master Trainer'", function (error, result) {
                        if (error) {
                            reject(error);
                        } else { resolve(result[0].CMT); }
                    });
                });
            }
            var state_wise_students = function () {
                return new Promise(function (resolve, reject) {
                    db.query("SELECT state, COUNT(*) as total_state_wise_students FROM tbl_register GROUP BY state", function (error, result) {
                        if (error) {
                            reject(error);
                        } else { resolve(result); }
                    });
                });
            }
            var district_wise_students = function () {
                return new Promise(function (resolve, reject) {
                    db.query("SELECT district, COUNT(*) as total_district_wise_students FROM tbl_register GROUP BY district", function (error, result) {
                        if (error) {
                            reject(error);
                        } else { resolve(result); }
                    });
                });
            }
            student().then(function (row) {
                training().then(function (training) {
                    certified_trainer().then(function (certified_trainer) {
                        certified_master_trainer().then(function (certified_master_trainer) {
                            state_wise_students().then(function (total_state_wise_students) {
                                district_wise_students().then(function (total_district_wise_students) {
                                    res.send([{
                                        status: 1, student: row, training: training, certified_trainer: certified_trainer, certified_master_trainer: certified_master_trainer
                                        , state_wise_students: total_state_wise_students, district_wise_students: total_district_wise_students
                                    }]);
                                });
                            });
                        });
                    });
                });
            }).catch(function (error) {
                res.send([{ status: 0, err: error }]);
            });
        }
    });
});

app.get('/dashboard_graph/:id', verifyToken, function (req, res) {
    jwt.verify(req.token, 'SuperSecRetKey', (err, authData) => {
        if (err) {
            res.send([{ status: 0, msg: err }]);
        } else {
            var id = req.params.id;

            var year = function () {
                return new Promise(function (resolve, reject) {
                    db.query("SELECT count(*) as y, YEAR(t1.created_date) as label FROM tbl_register t1 join tbl_batch_insert t2 on t1.batch_id=t2.batch_id where t2.training_type_id=? GROUP BY YEAR(t1.created_date)", id, function (error, result) {
                        if (result.length == 0) {
                            reject(error);
                        } else { resolve(result); }
                    });
                });
            }
            var month = function () {
                return new Promise(function (resolve, reject) {
                    db.query("SELECT count(*) as y, case when month(t1.created_date)=1 THEN 'Jan' when month(t1.created_date)=2 THEN 'Feb' when month(t1.created_date)=3 THEN 'March' when month(t1.created_date)=4 THEN 'Apr' when month(t1.created_date)=5 THEN 'May' when month(t1.created_date)=6 THEN 'June' when month(t1.created_date)=7 THEN 'July' when month(t1.created_date)=8 THEN 'Aug' when month(t1.created_date)=9 THEN 'Sept' when month(t1.created_date)=10 THEN 'Oct' when month(t1.created_date)=11 THEN 'Nov' when month(t1.created_date)=12 THEN 'Dec' end as label FROM tbl_register t1 join tbl_batch_insert t2 on t1.batch_id=t2.batch_id where t2.training_type_id=? GROUP BY month(t1.created_date)", id, function (error, result) {
                        if (result.length == 0) {
                            reject(error);
                        } else { resolve(result); }
                    });
                });
            }
            year().then(function (row) {
                month().then(function (month) {
                    res.send([{ status: 1, year: row, month: month }]);
                });
            }).catch(function (err) {
                res.send([{ status: 0, year: 'No result found' }]);
            });

        }
    });
});


app.get('/logout', verifyToken, function (req, res) {
    jwt.verify(req.token, 'SuperSecRetKey', (err, authData) => {
        if (authData) {
            res.send([{ status: 1, msg: 'Valid Token' }]);
        } else {
            res.send([{ status: 0, msg: 'Invalid Token' }]);
        }
    });
});

app.get('/module_list', function (req, res) {
  
        var module_list = function () {
            return new Promise(function (resolve, reject) {
                db.query("SELECT *,module_id as id,module_name as itemName FROM `modules`", function (error, result) {
                    if (result.length == 0) {
                        reject(error);
                    } else { resolve(result); }
                });
            });
        }
        module_list().then(function (row) {
           
                res.send([{ status: 1, module_list: row }]);
        }).catch(function () {
            res.send([{ status: 0, module_list: 'No result found' }]);
        });

});

app.get('/module_wise_trainer_list/:id', function (req, res) {
  
    var id =  req.params.id;
    var module_list = function () {
        return new Promise(function (resolve, reject) {
            db.query("SELECT modules.module_name as itemName,modules.module_id as id FROM `module_trainer` join modules on module_trainer.module_id=modules.module_id join tbl_master_trainer on tbl_master_trainer.master_trainer_id=module_trainer.master_trainer_id where tbl_master_trainer.master_trainer_id=?",id, function (error, result) {
                if (result.length == 0) {
                    reject(error);
                } else { resolve(result); }
            });
        });
    }
    module_list().then(function (row) {
       
            res.send([{ status: 1, module_wise_trainer_list: row }]);
    }).catch(function () {
        res.send([{ status: 0, module_wise_trainer_list: 'No result found' }]);
    });

});
const csv = require('fast-csv');
const fs = require('fs');


module.exports = app;