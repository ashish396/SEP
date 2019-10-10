/* -----------------Created by Ashish Singla------------------------*/


var db = require('mysql');
var express = require("express");
var app = express();
var db = require('../model/db');
const jwt = require('jsonwebtoken');
var promise = require('promise');
var multer = require('multer');
var path = require("path");

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

app.get('/batch_report_list', verifyToken, function (req, res) {
    jwt.verify(req.token, 'SuperSecRetKey', (err, authData) => {
        if (err) {
            res.send([{ status: 0, msg: err }]);
        } else {

            db.query("SELECT *,case when training_type_id=1 then concat('BST/',batch_id) when training_type_id=2 then concat('TT/',batch_id) when training_type_id=3 then concat('MTT/',batch_id) end as batch_code FROM `tbl_batch_insert` ", function (error, result) {
                if (result.length == 0) {
                    res.send([{ status: 0, batch_report: 'No result found' }]);
                } else {
                    res.send([{ status: 1, batch_report: result }]);
                }
            });
        }
    });
});

app.get('/batch_report/:start_date/:end_date', verifyToken, function (req, res) {
    jwt.verify(req.token, 'SuperSecRetKey', (err, authData) => {
        if (err) {
            res.send([{ status: 0, msg: err }]);
        } else {
            var start_date = req.params.start_date;
            var end_date = req.params.end_date;

            db.query("SELECT * FROM `tbl_batch_insert` WHERE start_date >= ? and end_date <= ? ", [start_date, end_date], function (error, result) {
                if (result.length == 0) {
                    res.send([{ status: 0, get_batch_report: 'No result found' }]);
                } else {
                    res.send([{ status: 1, get_batch_report: result }]);
                }
            });
        }
    });
});

app.get('/batch_report_detail_list/:id', verifyToken, function (req, res) {
    jwt.verify(req.token, 'SuperSecRetKey', (err, authData) => {
        if (err) {
            res.send([{ status: 0, msg: err }]);
        } else {
            var id = req.params.id;
            var fullUrl = req.protocol + '://' + req.get('host');
            //console.log(req.protocol + '://' )
            var attendance_url = fullUrl + '/attendance_sheet/';
            var checklist_url = fullUrl + '/checklist/';
            //console.log(attendance_url);
            var batch_report_detail_list = function () {
                return new Promise(function (resolve, reject) {
                    db.query("call proc_batch_report_detail_list(?,?,?) ", [id, attendance_url, checklist_url], function (error, result) {
                        if (error) {
                            reject(error);
                        } else { resolve(result[0]); }
                    });
                });
            }
            var total_register = function () {
                return new Promise(function (resolve, reject) {
                    db.query("SELECT count(*) as total_register FROM `tbl_register` where batch_id=? GROUP by batch_id", id, function (error, result) {
                        if (error) {
                            reject(error);
                        } else { resolve(result); }
                    });
                });
            }
            var total_present = function () {
                return new Promise(function (resolve, reject) {
                    db.query("SELECT count(*) as total_present FROM `tbl_batch_attendance` where attendance=1 and batch_id=8 GROUP by batch_id", id, function (error, result) {
                        if (error) {
                            reject(error);
                        } else { resolve(result[0].total_present); }
                    });
                });
            }
            var student_present_list  = function () {
                return new Promise(function (resolve, reject) {
                    db.query("SELECT tbl_register.name as student_present_list FROM `tbl_register` join tbl_batch_attendance on tbl_register.batch_id = tbl_batch_attendance.batch_id where attendance=1 and tbl_batch_attendance.batch_id=?", id, function (error, student_list) {
                        if (error) {
                            reject(error);
                        } else { resolve(student_list); }
                    });
                });
            }
            batch_report_detail_list().then(function (row) {
                total_register().then(function (total_register) {
                    total_present().then(function (total_present) {
                        student_present_list ().then(function (student_present_list ) {
                            res.send([{
                                status: 1, batch_report_detail_list: row,
                                total_student_register: total_register, total_student_present: total_present
                                , student_present_list : student_present_list 
                            }]);
                        });
                    });
                });
            }).catch(function (err) {
                res.send([{ status: 0, batch_report_detail_list: 'No result found' }]);
            });
        }
    });
});

app.get('/register_report_list', verifyToken, function (req, res) {
    jwt.verify(req.token, 'SuperSecRetKey', (err, authData) => {
        if (err) {
            res.send([{ status: 0, msg: err }]);
        } else {
            db.query("SELECT *,case when training_type_id=1 then concat('BST/',t1.batch_id) when training_type_id=2 then concat('TT/',t1.batch_id) when training_type_id=3 then concat('MTT/',t1.batch_id) end as batch_code FROM `tbl_register` t1 join tbl_batch_insert t2 on t1.batch_id = t2.batch_id", function (error, result) {
                if (result.length == 0) {
                    res.send([{ status: 0, register_report_list: 'No result found' }]);
                } else {
                    res.send([{ status: 1, register_report_list: result }]);
                }
            });
        }
    });
});

app.get('/register_report/:start_date/:end_date', verifyToken, function (req, res) {
    jwt.verify(req.token, 'SuperSecRetKey', (err, authData) => {
        if (err) {
            res.send([{ status: 0, msg: err }]);
        } else {
            var start_date = req.params.start_date;
            var end_date = req.params.end_date;
            db.query("SELECT * FROM `tbl_register` t1 join tbl_batch_insert t2 on t1.batch_id = t2.batch_id WHERE t2.start_date >= ? AND t2.end_date <= ? ", [start_date, end_date], function (error, result) {
                if (result.length == 0) {
                    res.send([{ status: 0, register_report_list: 'No result found' }]);
                } else {
                    res.send([{ status: 1, register_report_list: result }]);
                }
            });
        }
    });
});

app.get('/register_report_detail_list/:mobile', verifyToken, function (req, res) {
    jwt.verify(req.token, 'SuperSecRetKey', (err, authData) => {
        if (err) {
            res.send([{ status: 0, msg: err }]);
        } else {
            var mobile = req.params.mobile;
            var register_report_detail_list = function () {
                return new Promise(function (resolve, reject) {
                    db.query("call proc_register_report_detail_list(?) ", mobile, function (error, result) {
                        if (result[0].length == 0) {
                            reject(error);
                        } else { resolve(result[0]); }
                    });
                });
            }
            register_report_detail_list().then(function (row) {
                res.send([{ status: 1, register_report_detail_list: row }]);
            }).catch(function (err) {
                res.send([{ status: 0, register_report_detail_list: 'No result found' }]);
            });
        }
    });
});

app.get('/applicant_life_cycle_report/:id', verifyToken, function (req, res) {
    jwt.verify(req.token, 'SuperSecRetKey', (err, authData) => {
        if (err) {
            res.send([{ status: 0, msg: err }]);
        } else {
            var mobile = req.params.id;
            var tip1 = function () {
                return new Promise(function (resolve, reject) {
                    db.query("call applicant_life_cycle_report(?) ", mobile, function (error, result) {
                        if (result[0].length == 0) {
                            reject(error);
                        } else { resolve(result[0]); }
                    });
                });
            }
            tip1().then(function (row) {
                res.send([{ status: 1, applicant_life_cycle_report: row }]);
            }).catch(function (err) {
                res.send([{ status: 0, applicant_life_cycle_report: 'No result found' }]);
            });
        }
    });
});

app.get('/examination_report_list/', verifyToken, function (req, res) {
    jwt.verify(req.token, 'SuperSecRetKey', (err, authData) => {
        if (err) {
            res.send([{ status: 0, msg: err }]);
        } else {

            var examination_report_list = function () {
                return new Promise(function (resolve, reject) {
                    db.query("call examination_report_list() ", function (error, result) {
                        if (result[0].length == 0) {
                            reject(error);
                        } else { resolve(result[0]); }
                    });
                });
            }
            examination_report_list().then(function (row) {
                res.send([{ status: 1, examination_report_list: row }]);
            }).catch(function (err) {
                res.send([{ status: 0, error: 'No result found' }]);
            });
        }
    });
});

app.get('/examination_report/:start_date/:end_date', verifyToken, function (req, res) {
    jwt.verify(req.token, 'SuperSecRetKey', (err, authData) => {
        if (err) {
            res.send([{ status: 0, msg: err }]);
        } else {
            var start_date = req.params.start_date;
            var end_date = req.params.end_date;
            var examination_report = function () {
                return new Promise(function (resolve, reject) {
                    db.query("call examination_report(?,?) ", [start_date, end_date], function (error, result) {
                        if (result[0].length == 0) {
                            reject(error);
                        } else { resolve(result[0]); }
                    });
                });
            }
            examination_report().then(function (row) {
                res.send([{ status: 1, examination_report: row }]);
            }).catch(function (err) {
                res.send([{ status: 0, examination_report: 'No result found' }]);
            });
        }
    });
});

app.get('/trainer_training_report_list/', verifyToken, function (req, res) {
    jwt.verify(req.token, 'SuperSecRetKey', (err, authData) => {
        if (err) {
            res.send([{ status: 0, msg: err }]);
        } else {
            //let promises = [];
            var trainer_training_report = async function (res) {
                return await new Promise(function (resolve, reject) {

                    db.query("SELECT DISTINCT master_trainer_id, t1.name,t1.email,t1.mobile,(select sum(t1.mobile= t2.mobile) from tbl_batch_attendance t1 where type<>1) as count_trainer_training, trainer_type_name as trainer_level FROM `tbl_batch_attendance` t1 join tbl_master_trainer t2 on t1.mobile=t2.mobile WHERE attendance = 1 and t1.mobile =t2.mobile group by mobile order by master_trainer_id desc", function (error, data) {
                        if (error) {
                            reject(error);
                        } else {
                            resolve(data);
                        }
                    });

                });
            }

            trainer_training_report().then(async function (row) {
                res.json([{ status: 1, trainer_training_report: row }]);
            }).catch(function (err) {
                res.send([{ status: 0, error: err }]);
            });
        }
    });
});

app.get('/trainer_training_report/:start_date/:end_date', verifyToken, function (req, res) {
    jwt.verify(req.token, 'SuperSecRetKey', (err, authData) => {
        if (err) {
            res.send([{ status: 0, msg: err }]);
        } else {
            var start_date = req.params.start_date;
            var end_date = req.params.end_date;
            var trainer_training_report = function () {
                return new Promise(function (resolve, reject) {
                    db.query("SELECT DISTINCT master_trainer_id, t1.name,t1.email,t1.mobile,(select sum(t1.mobile= t2.mobile) from tbl_batch_attendance t1 where type<>1) as count_trainer_training, trainer_type_name as trainer_level FROM `tbl_batch_attendance` t1 join tbl_master_trainer t2 on t1.mobile=t2.mobile WHERE attendance = 1 and t1.mobile =t2.mobile and t1.date>= ? and t1.date <=? group by mobile", [start_date, end_date], function (error, result) {
                        if (result.length == 0) {
                            reject(error);
                        } else { resolve(result); }
                    });
                });
            }
            trainer_training_report().then(function (row) {
                res.send([{ status: 1, trainer_training_report: row }]);
            }).catch(function (err) {
                res.send([{ status: 0, trainer_training_report: 'No result found' }]);
            });
        }
    });
});

app.get('/trainer_training_report_list_detail/:mobile', verifyToken, function (req, res) {
    jwt.verify(req.token, 'SuperSecRetKey', (err, authData) => {
        if (err) {
            res.send([{ status: 0, msg: err }]);
        } else {
            var mobile = req.params.mobile;
            var trainer_training_report_list_detail = async function (res) {
                return await new Promise(function (resolve, reject) {
                    db.query("SELECT * FROM `tbl_batch_attendance` t1 join tbl_master_trainer t2 on t1.mobile=t2.mobile where t1.mobile=? and attendance=1 and type<>1", mobile, function (error, data) {
                        if (error) {
                            reject(error);
                        } else {
                            resolve(data);
                        }
                    });

                });
            }

            trainer_training_report_list_detail().then(async function (row) {
                res.json([{ status: 1, trainer_training_report_list_detail: row }]);
            }).catch(function (err) {
                res.send([{ status: 0, trainer_training_report_list_detail: err }]);
            });
        }
    });
});

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public/checklist');
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname + '-' + Date.now() + path.extname(file.originalname))
    }
});

const upload = multer({
    storage: storage,
});

app.post("/checklist_upload/:id", upload.any(), (req, res) => {

    var name = req.files;
    if (!name) {
        res.send({ status: 0, msg: 'Please choose file' });
    } else {
        var checklist = req.files[0].filename;
        var id = req.params.id;
        db.query('update tbl_batch_insert set checklist_copy =? where batch_id = ?', [checklist, id], function (error, result) {
            if (error) {
                res.send({ status: 1, msg: error });
            } else { res.send({ status: 1, msg: 'file Uploaded' }); }

        });
    }
});


module.exports = app;

