
/* -----------------Created by Ashish Singla------------------------*/

var express = require("express");
var app = express();
var db = require('../model/db');
const jwt = require('jsonwebtoken');
var promise = require('promise');
const multer = require('multer');
var path = require("path");
/** verifyToken method - this method verifies token */
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


app.post('/create_batch', verifyToken, function (req, res) {
    jwt.verify(req.token, 'SuperSecRetKey', (err, authData) => {
        if (err) {
            res.send([{ status: 0, msg: err }]);
        } else {
            var data = {
                "training_type_id": req.body.training_type_id,
                "start_date": req.body.start_date,
                "end_date": req.body.end_date,
                "start_time": req.body.start_time,
                "end_time": req.body.end_time,
                "capacity": req.body.capacity,
                "venue": req.body.venue,
                "state": req.body.state,
                "district": req.body.district,
                // "coordinator_type": req.body.coordinator_type,
                "remarks": req.body.remarks,
                "created_by": authData['results'][0].trainer_name,
            }
            // Validation
            if (!data.start_date) {
                res.send([{ status: 0, msg: 'Start date is required' }]);

            } else if (!data.end_date) {
                res.send([{ status: 0, msg: 'End Date is required' }]);

            } else if (!data.capacity) {
                res.send([{ status: 0, msg: 'Capacity is required' }]);

            } else if (!data.venue) {
                res.send([{ status: 0, msg: 'Venue is required' }]);
            } else {
                db.query('insert into tbl_batch_insert set ?', data, function (err, result) {
                    if (err) {
                        res.send([{ status: 0, msg: err }]);
                    } else {
                        var insertId = result.insertId;
                        db.query('INSERT INTO batch_trainer (batch_id, trainer_master_id) VALUES ? ',
                            [Array.from(req.body.trainer_master_id).map(function (g) { return [insertId, g]; })], function (err, result, fields) {
                                db.query("SELECT case when training_type_id=1 then concat('BST/',batch_id) when training_type_id=2 then concat('TT/',batch_id) when training_type_id=3 then concat('MTT/',batch_id) end as batch_code FROM tbl_batch_insert where batch_id=?", insertId, function (err, batch_id) {
                                    //  console.log(batch_id[0]['batch_code'])
                                    res.send([{ status: 1, msg: batch_id[0]['batch_code'] + ' is generated successfully' }]);
                                });
                            });
                    }
                });
            }
        }
    });
});

app.get('/list_batch_trainer', verifyToken, function (req, res) {
    jwt.verify(req.token, 'SuperSecRetKey', (err, authData) => {
        if (err) {
            res.send([{ status: 0, msg: err }]);
        } else {
            var training_type = function () {
                return new Promise(function (resolve, reject) {
                    var query = db.query("SELECT * FROM tbl_master_training_type where is_deleted=0", function (error, result) {
                        if (error) {
                            reject(error);
                        } else { resolve(result); }
                    });
                });
            }

            var batch_list = function () {
                return new Promise(function (resolve, reject) {
                    db.query("SELECT *,CASE WHEN training_type_id = 1 THEN CONCAT('BST/',batch_id) when training_type_id = 2 THEN concat('TT/',batch_id) when training_type_id = 3 THEN concat('MTT/',batch_id) ELSE CONCAT('OT/',batch_id) END as batch_code FROM tbl_batch_insert", function (error, result) {
                        if (error) {
                            reject(error);
                        } else { resolve(result); }
                    });
                });
            }

            var venue_list = function () {
                return new Promise(function (resolve, reject) {
                    db.query("SELECT *,venue as venue_name FROM `tbl_master_venue_code` t1 join tbl_master_venue t2 on t1.venue_code=t2.venue_code", function (error, result) {
                        if (error) {
                            reject(error);
                        } else { resolve(result); }
                    });
                });
            }

            training_type().then(function (rows) {
                batch_list().then(function (batch_list) {
                    venue_list().then(function (venue_list) {
                        res.send([{ status: 1, training_type: rows, batch_list: batch_list, venue_list: venue_list }]);
                    });
                });
            }).catch(function (err) {
                res.send([{ status: 0, error: err }]);
            });
        }
    });
});

app.post('/update_batch/:id', verifyToken, function (req, res) {
    jwt.verify(req.token, 'SuperSecRetKey', (err, authData) => {
        if (err) {
            res.send([{ status: 0, msg: err }]);
        } else {
            var data = {
                "training_type_id": req.body.training_type_id,
                "start_date": req.body.start_date,
                "end_date": req.body.end_date,
                "start_time": req.body.start_time,
                "end_time": req.body.end_time,
                "capacity": req.body.capacity,
                "venue": req.body.venue,
                "coordinator_type": req.body.coordinator_type,
                "remarks": req.body.remarks,
                "modified_by": authData['results'][0].trainer_name,
            }
            var id = req.params.id;
            var trainer_id = req.body.trainer_master_id;

            // Validation
            if (!data.start_date) {
                res.send([{ status: 0, msg: 'Start Date is required' }]);
            }
            else if (!data.end_date) {
                res.send([{ status: 0, msg: 'End Date is required' }]);

            } else if (!trainer_id) {
                res.send([{ status: 0, msg: 'trainer id is required' }]);
            } else {

                var update = function () {
                    return new Promise(function (resolve, reject) {
                        db.query("update tbl_batch_insert set ? where batch_id = ?", [data, id], function (error, result) {
                            if (error) {
                                reject(error);
                            } else { resolve(result); }
                        });
                    });
                }
                var batch_delete = function () {
                    return new Promise(function (resolve, reject) {
                        db.query("delete from batch_trainer where batch_id = ?", id, function (error, result) {
                            if (error) {
                                reject(error);
                            } else { resolve(result); }
                        });
                    });
                }
                var batch_multiple_insert = function () {
                    return new Promise(function (resolve, reject) {

                        db.query('INSERT INTO batch_trainer (batch_id, trainer_master_id) VALUES ? ',
                            [Array.from(req.body.trainer_master_id).map(function (g) { return [id, g]; })], function (err, result) {
                                if (err) {
                                    reject(err);
                                } else { resolve(result); }
                            });

                    });
                }
                update().then(function () {
                    batch_delete().then(function () {
                        batch_multiple_insert().then(function () {
                            res.send([{ status: 1, msg: 'Data Updated Successfully' }]);
                        });
                    });
                }).catch(function (err) {
                    res.send([{ status: 0, error: err }]);
                });

            }
        }
    });
});

app.get('/batch_list_bc/:id', verifyToken, function (req, res) {
    jwt.verify(req.token, 'SuperSecRetKey', (err, authData) => {
        if (err) {
            res.send([{ status: 0, msg: err }]);
        } else {
            var id = req.params.id;
            db.query("SELECT *,master_trainer_id as id,trainer_name as itemName,CASE WHEN t1.trainer_type_name = 'Trainer In process 1' THEN 'TIP1' WHEN t1.trainer_type_name = 'Trainer In process 2' THEN 'TIP2' WHEN t1.trainer_type_name = 'Master In process 1' THEN 'MIP1' WHEN t1.trainer_type_name = 'Master In process 2' THEN 'MIP2' WHEN t1.trainer_type_name = 'Supervised Teacher' THEN 'ST' WHEN t1.trainer_type_name = 'Supervisor CT' THEN 'SCT' WHEN t1.trainer_type_name = 'Supervisor CMT' THEN 'SCMT' when t1.trainer_type_name = 'Certified Trainer' THEN 'Trainer' ELSE 'Others' END as code FROM `tbl_master_trainer` t1 join tbl_master_training_type t2 on t1.trainer_id = t2.training_code where t2.training_type_id = ? ", id, function (error, result) {
                db.query("SELECT distinct t1.trainer_type_name FROM `tbl_master_trainer` t1 join tbl_master_training_type t2 on t1.trainer_id = t2.training_code where t2.training_type_id =?", id, function (error, type) {

                    if (result.length == 0) {
                        res.send([{ status: 0, trainer: 'No result found' }]);
                    } else {
                        res.send([{ status: 1, trainer: result, type: type }]);
                    }
                });
            });
        }
    });
});

app.get('/batch_list/:id', verifyToken, function (req, res) {
    jwt.verify(req.token, 'SuperSecRetKey', (err, authData) => {
        if (err) {
            res.send([{ status: 0, msg: err }]);
        } else {
            var id = req.params.id;
            db.query("SELECT trainer_type_name ,master_trainer_id as id,trainer_name as itemName FROM `tbl_master_trainer` t1 join tbl_master_training_type t2 on t1.trainer_id = t2.training_code where t2.training_type_id = ? ", id, function (error, result) {
                db.query("SELECT distinct t1.trainer_type_name FROM `tbl_master_trainer` t1 join tbl_master_training_type t2 on t1.trainer_id = t2.training_code where t2.training_type_id =?", id, function (error, type) {

                    if (result.length == 0) {
                        res.send([{ status: 0, trainer: 'No result found' }]);
                    } else {
                        res.send([{ status: 1, trainer: result, type: type, trainer_id: id }]);
                    }
                });
            });
        }
    });
});

app.post('/training_register', function (req, res) {

    var data = {
        "batch_id": req.body.batch_id,
        "distributor_id": req.body.distributor_id,
        "type": req.body.type,
        "name": req.body.name,
        "contact_no": req.body.contact_no,
        "zone": req.body.zone,
        "qualification": req.body.qualification,
        "rank": req.body.rank,
        "gender": req.body.gender,
        "email": req.body.email,
        "from_where": req.body.from_where,
        "father_name": req.body.father_name,
        "id_proof_type": req.body.id_proof_type,
        "id_proof_no": req.body.id_proof_no,
        "dob": req.body.dob,
        "occupation": req.body.occupation,
        "state": req.body.state,
        "district": req.body.district,
        "city": req.body.city,
        "street": req.body.street,
        "pincode": req.body.pincode,
        "remark": req.body.remark,
        "trainer_id": req.body.trainer_id,
        //"created_by": authData['results'][0].trainer_name,
    }
    // Validation
    if (!data.name) {
        res.send([{ status: 0, msg: 'Name is required' }]);

    } else if (!data.contact_no) {
        res.send([{ status: 0, msg: 'Mobile number is required' }]);

    } else if (!data.email) {
        res.send([{ status: 0, msg: 'Email is required' }]);

    } else if (!data.dob) {
        res.send([{ status: 0, msg: 'Date of birth is required' }]);
    } else {
        var contact_no = data.contact_no;

        db.query("SELECT trainer_id FROM `tbl_master_trainer` where mobile=?", contact_no, function (err, trainer) {
            db.query("SELECT distinct * FROM `basic_training_exam` where mobile=? and written_status=1 and interview_status=1 or written_status=0 and interview_status=1", contact_no, function (err, attendance) {
                db.query("SELECT * FROM `tbl_batch_attendance` where attendance=1 and type='Certified Trainer' and mobile = ?", contact_no, function (err, check_mtt) {

                    // let trainer_id = trainer[0].trainer_id;
                    var trainer_type = data.trainer_id;
                    if (trainer.length == 0 & trainer_type == 'BST') {
                        db.query('insert into tbl_register set ?', data, function (err, result) {
                            if (err) {
                                res.send([{ status: 0, msg: err }]);
                            } else {
                                res.send([{ status: 1, msg: 'Data Saved Successfully' }]);
                            }
                        });

                    } else if (trainer.length > 0 & trainer_type == 'BST' || trainer_type == 'TT' || trainer_type == 'MTT') {
                        db.query('insert into tbl_register set ?', data, function (err, result) {
                            if (err) {
                                res.send([{ status: 0, msg: err }]);
                            } else {
                                res.send([{ status: 1, msg: 'Data Saved Successfully' }]);
                            }
                        });
                    } else if (attendance.length > 0 & trainer_type == 'TT') {
                        db.query('insert into tbl_register set ?', data, function (err, result) {
                            if (err) {
                                res.send([{ status: 0, msg: err }]);
                            } else {
                                res.send([{ status: 1, msg: 'Data Saved Successfully' }]);
                            }
                        });
                    } else if (check_mtt.length > 0 & trainer_type == 'MTT') {
                        db.query('insert into tbl_register set ?', data, function (err, result) {
                            if (err) {
                                res.send([{ status: 0, msg: err }]);
                            } else {
                                res.send([{ status: 1, msg: 'Data Saved Successfully' }]);
                            }
                        });
                    } else {
                        res.send([{ status: 0, msg: 'Attend Basic Training First' }]);
                    }
                });
            });
        });
    }
});

app.get('/get_batch/:id', verifyToken, function (req, res) {
    jwt.verify(req.token, 'SuperSecRetKey', (err, authData) => {
        if (err) {
            res.send([{ status: 0, msg: err }]);
        } else {
            var id = req.params.id;
            db.query("SELECT distinct t1.batch_id,CASE WHEN t1.training_type_id = 1 THEN CONCAT('BST/',t1.batch_id) when t1.training_type_id = 2 THEN concat('TT/',t1.batch_id) when t1.training_type_id = 3 THEN concat('MTT/',t1.batch_id) ELSE CONCAT('OT/',t1.batch_id) END as batch_code FROM tbl_batch_insert t1 join tbl_master_training_type t2 on t1.training_type_id=t2.training_type_id left join tbl_batch_attendance t3 on t1.batch_id<>t3.batch_id where t2.training_type_id = ? and t1.status=4", id, function (error, result) {
                if (result.length == 0) {
                    res.send([{ status: 0, get_batch: 'No result found' }]);
                } else {
                    res.send([{ status: 1, get_batch: result }]);
                }
            });
        }
    });
});

app.get('/get_batch_date/:id', verifyToken, function (req, res) {
    jwt.verify(req.token, 'SuperSecRetKey', (err, authData) => {
        if (err) {
            res.send([{ status: 0, msg: err }]);
        } else {
            var id = req.params.id;
            db.query("SELECT start_date,batch_id FROM `tbl_batch_insert` where batch_id = ? ", id, function (error, result) {
                if (result.length == 0) {
                    res.send([{ status: 0, get_batch_date: 'No result found' }]);
                } else {
                    res.send([{ status: 1, get_batch_date: result }]);
                }
            });
        }
    });
});

app.get('/attendance_list/:id', verifyToken, function (req, res) {
    jwt.verify(req.token, 'SuperSecRetKey', (err, authData) => {
        if (err) {
            res.send([{ status: 0, msg: err }]);
        } else {
            var id = req.params.id;
            var register_list = function () {
                return new Promise(function (resolve, reject) {
                    db.query("SELECT case when training_type_id then 'Student' else 'Student' end as type ,t1.batch_id,start_date ,name,email,distributor_id,training_type_id,case when t2.type=1 THEN '1' else '1' end as trainer_type_name ,contact_no as mobile FROM `tbl_batch_insert` t1 join tbl_register t2 on t1.batch_id = t2.batch_id where t1.batch_id = ? and status=4 ", id, function (error, result) {
                        if (error) {
                            reject(error);
                        } else { resolve(result); }
                    });
                });
            }

            var trainer_list = function () {
                return new Promise(function (resolve, reject) {
                    db.query("SELECT case when training_type_id then trainer_type_name else trainer_type_name end as type ,t1.batch_id,start_date ,training_type_id,email,trainer_name as name,master_trainer_id,mobile,trainer_type_name FROM `tbl_batch_insert` t1 join batch_trainer t2 on t1.batch_id=t2.batch_id join tbl_master_trainer t3 on t2.trainer_master_id=t3.master_trainer_id where t1.batch_id=? and t1.status=4", id, function (error, result) {
                        if (error) {
                            reject(error);
                        } else { resolve(result); }
                    });
                });
            }
            register_list().then(function (rows) {
                trainer_list().then(function (trainer_list) {
                    res.send([{ status: 1, register_list: rows, trainer_list: trainer_list }]);
                });
            }).catch(function (err) {
                res.send([{ status: 0, error: err }]);
            });
        }
    });
});

app.post('/create_attendance', verifyToken, (req, res) => {
    jwt.verify(req.token, 'SuperSecRetKey', (err, authData) => {
        if (err) {
            res.send([{ status: 0, msg: err }]);
        } else {
            var jsondata = req.body;
            var values = [];
            for (var i = 0; i < jsondata.length; i++)
                values.push([
                    jsondata[i].batch_id,
                    jsondata[i].training_type,
                    jsondata[i].date,
                    jsondata[i].name,
                    jsondata[i].email,
                    jsondata[i].mobile,
                    jsondata[i].attendance,
                    jsondata[i].remarks,
                    jsondata[i].type
                ]);
            var batch_id = jsondata[0].batch_id;
            db.query('insert into tbl_batch_attendance (batch_id, training_type,date,name,email,mobile,attendance,remarks,type) VALUES  ?', [values], function (err, result) {
                if (err) {
                    res.send([{ status: 0, msg: err }]);
                } else {
                    db.query("update tbl_batch_insert set status=5 where batch_id=?", batch_id, function (err, result2) {
                        db.query('SELECT * FROM `tbl_batch_attendance` where training_type=2 and attendance=1 and type = 1', function (error, result) {
                            var attendance = result[0].attendance;
                            var phone = result[0].mobile;

                            if (attendance == 0) {
                                db.query('DELETE FROM tbl_master_trainer where mobile=?', phone, function (err, update) {
                                });
                            } else {
                                //var data = [];
                                var tip = 'Trainer In process 1';
                                // var trainer_code = 'BST';
                                var trainer_id = 'BST';
                                // for (var i = 0; i < result.length; i++)
                                //     data.push([result[i].name, result[i].email, result[i].mobile, tip, trainer_id]);
                                db.query("update tbl_master_trainer set trainer_type_name=? where mobile=?, ", [tip, phone], function (err, result1) {

                                    res.send([{ status: 1, msg: 'Data Saved Successfully', batch_id: batch_id }]);

                                });

                            }
                        });
                    });
                }
            });
            db.query("SELECT * FROM `tbl_batch_attendance` where training_type=1 and attendance=1 and type='Trainer In process 2'", function (err, ct) {
                var mobile = ct[0].mobile;
                var attendance = ct[0].attendance;
                var Certified = 'Certified Trainer';
                if (attendance == 1) {
                    db.query('UPDATE tbl_master_trainer set trainer_type_name =? where mobile=?', [Certified, mobile], function (err, update) {

                    });
                } else {
                    db.query('DELETE FROM tbl_master_trainer where mobile=?', mobile, function (err, update) {

                    });
                }
            });
            db.query('SELECT * FROM `tbl_batch_attendance` WHERE training_type=3 and attendance=1 and type=1', function (err, mip1) {
                var mobile = mip1[0].mobile;
                var attendance = mip1[0].attendance;
                var trainer_id = 'TT';
                var Certified = 'Master In process 1';
                if (attendance == 1) {
                    db.query('UPDATE tbl_master_trainer set trainer_type_name =?,trainer_id=? where mobile=?', [Certified, trainer_id, mobile], function (err, update) {

                    });
                } else {
                    db.query('DELETE FROM tbl_master_trainer where mobile=?', mobile, function (err, update) {

                    });
                }
            });
        }
    });
});

app.get('/batch_list_trainer_wise_bc/:id', verifyToken, function (req, res) {
    jwt.verify(req.token, 'SuperSecRetKey', (err, authData) => {
        if (err) {
            res.send([{ status: 0, msg: err }]);
        } else {
            var id = req.params.id;
            db.query("SELECT distinct *,case when batch_trainer.batch_id=? then '1' else '0' end selected FROM `batch_trainer` join tbl_master_trainer on batch_trainer.trainer_master_id=tbl_master_trainer.master_trainer_id GROUP by tbl_master_trainer.master_trainer_id", id, function (error, result) {
                db.query("SELECT distinct trainer_type_name FROM `batch_trainer` join tbl_master_trainer on batch_trainer.trainer_master_id=tbl_master_trainer.master_trainer_id where batch_trainer.batch_id=? ", id, function (error, type) {
                    if (result.length == 0) {
                        res.send([{ status: 0, batch_list_trainer_wise: 'No result found' }]);
                    } else {
                        res.send([{ status: 1, batch_list_trainer_wise: result, type: type }]);
                    }
                });
            });
        }
    });
});

app.get('/batch_list_trainer_wise_bcc/:id', verifyToken, function (req, res) {
    jwt.verify(req.token, 'SuperSecRetKey', (err, authData) => {
        if (err) {
            res.send([{ status: 0, msg: err }]);
        } else {
            var id = req.params.id;
            db.query("SELECT master_trainer_id as id,trainer_name as itemName,trainer_type_name FROM `tbl_master_trainer` ", id, function (error, trainer) {
                db.query("SELECT master_trainer_id as id,trainer_name as itemName,trainer_type_name FROM `batch_trainer` join tbl_master_trainer on batch_trainer.trainer_master_id=tbl_master_trainer.master_trainer_id where batch_id=? ", [id, id], function (error, result) {
                    db.query("SELECT distinct trainer_type_name FROM `batch_trainer` join tbl_master_trainer on batch_trainer.trainer_master_id=tbl_master_trainer.master_trainer_id where batch_trainer.batch_id=? ", id, function (error, type) {
                        if (result.length == 0) {
                            res.send([{ status: 0, trainer: 'No result found' }]);
                        } else {
                            res.send([{ status: 1, trainer: trainer, selected: result, type: type }]);
                        }
                    });
                });

            });
        }
    });
});

app.get('/batch_list_trainer_wise/:id/:training_id', verifyToken, function (req, res) {
    jwt.verify(req.token, 'SuperSecRetKey', (err, authData) => {
        if (err) {
            res.send([{ status: 0, msg: err }]);
        } else {
            var id = req.params.id;
            var training_id = req.params.training_id;
            if (training_id == 1) {
                var tip1 = function () {
                    return new Promise(function (resolve, reject) {
                        db.query("SELECT master_trainer_id as id,trainer_name as itemName,trainer_type_name FROM `batch_trainer` join tbl_master_trainer on batch_trainer.trainer_master_id=tbl_master_trainer.master_trainer_id where batch_id=? ", id, function (error, result) {
                            if (error) {
                                reject(error);
                            } else { resolve(result); }
                        });
                    });
                }
                // var tip2 = function () {
                //     return new Promise(function (resolve, reject) {
                //         db.query("SELECT master_trainer_id as id,trainer_name as itemName,trainer_type_name FROM `batch_trainer` join tbl_master_trainer on batch_trainer.trainer_master_id=tbl_master_trainer.master_trainer_id where batch_id=? and trainer_type_name='Trainer In process 2'", id, function (error, result) {
                //             if (error) {
                //                 reject(error);
                //             } else { resolve(result); }
                //         });
                //     });
                // }
                // var ct = function () {
                //     return new Promise(function (resolve, reject) {
                //         db.query("SELECT master_trainer_id as id,trainer_name as itemName,trainer_type_name FROM `batch_trainer` join tbl_master_trainer on batch_trainer.trainer_master_id=tbl_master_trainer.master_trainer_id where batch_id=? and trainer_type_name='Certified Trainer'", id, function (error, result) {
                //             if (error) {
                //                 reject(error);
                //             } else { resolve(result); }
                //         });
                //     });
                // }
                // var supervisor = function () {
                //     return new Promise(function (resolve, reject) {
                //         db.query("SELECT master_trainer_id as id,trainer_name as itemName,trainer_type_name FROM `batch_trainer` join tbl_master_trainer on batch_trainer.trainer_master_id=tbl_master_trainer.master_trainer_id where batch_id=? and trainer_type_name='Supervisor'", id, function (error, result) {
                //             if (error) {
                //                 reject(error);
                //             } else { resolve(result); }
                //         });
                //     });
                // }
                var type = function () {
                    return new Promise(function (resolve, reject) {
                        db.query("SELECT DISTINCT trainer_type_name from tbl_master_trainer where trainer_id= 'BST'", function (error, result) {
                            if (error) {
                                reject(error);
                            } else { resolve(result); }
                        });
                    });
                }
                var trainer = function () {
                    return new Promise(function (resolve, reject) {
                        db.query("SELECT distinct trainer_type_name ,master_trainer_id as id,trainer_name as itemName FROM `batch_trainer` join tbl_master_trainer on batch_trainer.trainer_master_id=tbl_master_trainer.master_trainer_id where trainer_id= 'BST'", function (error, result) {
                            if (error) {
                                reject(error);
                            } else { resolve(result); }
                        });
                    });
                }
                // var trainer_tip2 = function () {
                //     return new Promise(function (resolve, reject) {
                //         db.query("SELECT master_trainer_id as id,trainer_name as itemName FROM `tbl_master_trainer` where trainer_type_name = 'Trainer In process 2'", function (error, result) {
                //             if (error) {
                //                 reject(error);
                //             } else { resolve(result); }
                //         });
                //     });
                // }
                // var trainer_ct = function () {
                //     return new Promise(function (resolve, reject) {
                //         db.query("SELECT master_trainer_id as id,trainer_name as itemName FROM `tbl_master_trainer` where trainer_type_name = 'Certified Trainer'", function (error, result) {
                //             if (error) {
                //                 reject(error);
                //             } else { resolve(result); }
                //         });
                //     });
                // }
                // var trainer_supervisor = function () {
                //     return new Promise(function (resolve, reject) {
                //         db.query("SELECT master_trainer_id as id,trainer_name as itemName FROM `tbl_master_trainer` where trainer_type_name = 'Supervisor'", function (error, result) {
                //             if (error) {
                //                 reject(error);
                //             } else { resolve(result); }
                //         });
                //     });
                // }
                tip1().then(function (rows) {
                    // tip2().then(function (tip2) {
                    // ct().then(function (ct) {
                    //    supervisor().then(function (supervisor) {
                    type().then(function (type) {
                        trainer().then(function (trainer) {
                            //  trainer_tip2().then(function (trainer_tip2) {
                            //   trainer_ct().then(function (trainer_ct) {
                            //    trainer_supervisor().then(function (trainer_supervisor) {
                            res.send([{
                                status: 1, selected: rows,// selected_tip2: tip2, selected_ct: ct,
                                //selected_supervisor: supervisor,
                                type: type, trainer: trainer, //trainer_tip2: trainer_tip2,
                                //trainer_ct: trainer_ct, trainer_supervisor: trainer_supervisor, training_id: training_id
                            }]);
                            //    });
                            //   });
                            //});
                        });
                        //    });
                        //   });
                        // });
                    });
                }).catch(function (error) {
                    res.send([{ status: 0, selected_tip1: error }]);
                });
            } else if (training_id == 2) {
                var mip1 = function () {
                    return new Promise(function (resolve, reject) {
                        db.query("SELECT master_trainer_id as id,trainer_name as itemName,trainer_type_name FROM `batch_trainer` join tbl_master_trainer on batch_trainer.trainer_master_id=tbl_master_trainer.master_trainer_id where batch_id=? ", id, function (error, result) {
                            if (error) {
                                reject(error);
                            } else { resolve(result); }
                        });
                    });
                }
                // var mip2 = function () {
                //     return new Promise(function (resolve, reject) {
                //         db.query("SELECT master_trainer_id as id,trainer_name as itemName,trainer_type_name FROM `batch_trainer` join tbl_master_trainer on batch_trainer.trainer_master_id=tbl_master_trainer.master_trainer_id where batch_id=? and trainer_type_name='Master In process 2'", id, function (error, result) {
                //             if (error) {
                //                 reject(error);
                //             } else { resolve(result); }
                //         });
                //     });
                // }
                // var cmt = function () {
                //     return new Promise(function (resolve, reject) {
                //         db.query("SELECT master_trainer_id as id,trainer_name as itemName,trainer_type_name FROM `batch_trainer` join tbl_master_trainer on batch_trainer.trainer_master_id=tbl_master_trainer.master_trainer_id where batch_id=? and trainer_type_name='Certified Master Trainer'", id, function (error, result) {
                //             if (error) {
                //                 reject(error);
                //             } else { resolve(result); }
                //         });
                //     });
                // }
                // var supervisor = function () {
                //     return new Promise(function (resolve, reject) {
                //         db.query("SELECT master_trainer_id as id,trainer_name as itemName,trainer_type_name FROM `batch_trainer` join tbl_master_trainer on batch_trainer.trainer_master_id=tbl_master_trainer.master_trainer_id where batch_id=? and trainer_type_name='Supervisor'", id, function (error, result) {
                //             if (error) {
                //                 reject(error);
                //             } else { resolve(result); }
                //         });
                //     });
                // }
                var type = function () {
                    return new Promise(function (resolve, reject) {
                        db.query("SELECT DISTINCT trainer_type_name from tbl_master_trainer where trainer_id= 'TT'", function (error, result) {
                            if (error) {
                                reject(error);
                            } else { resolve(result); }
                        });
                    });
                }
                var trainer = function () {
                    return new Promise(function (resolve, reject) {
                        db.query("SELECT distinct trainer_type_name ,master_trainer_id as id,trainer_name as itemName FROM `batch_trainer` join tbl_master_trainer on batch_trainer.trainer_master_id=tbl_master_trainer.master_trainer_id where trainer_id= 'TT'", function (error, result) {
                            if (error) {
                                reject(error);
                            } else { resolve(result); }
                        });
                    });
                }
                // var trainer_mip2 = function () {
                //     return new Promise(function (resolve, reject) {
                //         db.query("SELECT master_trainer_id as id,trainer_name as itemName FROM `tbl_master_trainer` where trainer_type_name = 'Master In process 2'", function (error, result) {
                //             if (error) {
                //                 reject(error);
                //             } else { resolve(result); }
                //         });
                //     });
                // }
                // var trainer_cmt = function () {
                //     return new Promise(function (resolve, reject) {
                //         db.query("SELECT master_trainer_id as id,trainer_name as itemName FROM `tbl_master_trainer` where trainer_type_name = 'Certified Master Trainer'", function (error, result) {
                //             if (error) {
                //                 reject(error);
                //             } else { resolve(result); }
                //         });
                //     });
                // }
                // var trainer_supervisor = function () {
                //     return new Promise(function (resolve, reject) {
                //         db.query("SELECT master_trainer_id as id,trainer_name as itemName FROM `tbl_master_trainer` where trainer_type_name = 'Supervisor'", function (error, result) {
                //             if (error) {
                //                 reject(error);
                //             } else { resolve(result); }
                //         });
                //     });
                // }

                mip1().then(function (mip1) {
                    //  mip2().then(function (mip2) {
                    //  cmt().then(function (cmt) {
                    //    supervisor().then(function (supervisor) {
                    type().then(function (type) {
                        trainer().then(function (trainer) {
                            //       trainer_mip2().then(function (trainer_mip2) {
                            //     trainer_cmt().then(function (trainer_cmt) {
                            //       trainer_supervisor().then(function (trainer_supervisor) {
                            res.send([{
                                status: 1, selected: mip1, //selected_mip2: mip2, selected_cmt: cmt
                                // , selected_supervisor: supervisor,
                                type: type, trainer: trainer
                                //, trainer_mip2: trainer_mip2, trainer_cmt: trainer_cmt, trainer_supervisor: trainer_supervisor, training_id: training_id
                            }]);
                        });
                        //  });
                        //   });
                        // });
                        //     });
                        // });
                        // });
                    });
                }).catch(function (error) {
                    res.send([{ status: 0, selected_tip1: error }]);
                });

            } else if (training_id == 3) {

                var cmt = function () {
                    return new Promise(function (resolve, reject) {
                        db.query("SELECT master_trainer_id as id,trainer_name as itemName,trainer_type_name FROM `batch_trainer` join tbl_master_trainer on batch_trainer.trainer_master_id=tbl_master_trainer.master_trainer_id where batch_id=? ", id, function (error, result) {
                            if (error) {
                                reject(error);
                            } else { resolve(result); }
                        });
                    });
                }
                // var supervisor = function () {
                //     return new Promise(function (resolve, reject) {
                //         db.query("SELECT master_trainer_id as id,trainer_name as itemName,trainer_type_name FROM `batch_trainer` join tbl_master_trainer on batch_trainer.trainer_master_id=tbl_master_trainer.master_trainer_id where batch_id=? and trainer_type_name='Supervisor'", id, function (error, result) {
                //             if (error) {
                //                 reject(error);
                //             } else { resolve(result); }
                //         });
                //     });
                // }
                var type = function () {
                    return new Promise(function (resolve, reject) {
                        db.query("SELECT DISTINCT trainer_type_name from tbl_master_trainer where trainer_id= 'MTT'", function (error, result) {
                            if (error) {
                                reject(error);
                            } else { resolve(result); }
                        });
                    });
                }
                var trainer = function () {
                    return new Promise(function (resolve, reject) {
                        db.query("SELECT distinct trainer_type_name ,master_trainer_id as id,trainer_name as itemName FROM `batch_trainer` join tbl_master_trainer on batch_trainer.trainer_master_id=tbl_master_trainer.master_trainer_id where trainer_id= 'MTT'", function (error, result) {
                            if (error) {
                                reject(error);
                            } else { resolve(result); }
                        });
                    });
                }
                // var trainer_supervisor = function () {
                //     return new Promise(function (resolve, reject) {
                //         db.query("SELECT master_trainer_id as id,trainer_name as itemName FROM `tbl_master_trainer` where trainer_type_name = 'Supervisor'", function (error, result) {
                //             if (error) {
                //                 reject(error);
                //             } else { resolve(result); }
                //         });
                //     });
                // }
                cmt().then(function (cmt) {
                    //  supervisor().then(function (supervisor) {
                    type().then(function (type) {
                        trainer_cmt().then(function (trainer_cmt) {
                            //   trainer_supervisor().then(function (trainer_supervisor) {
                            res.send([{
                                status: 1, selected: cmt, //supervisor: supervisor,
                                type: type
                                , trainer: trainer_cmt// trainer_supervisor: trainer_supervisor, training_id: training_id
                            }]);
                        });
                        // });
                        //});
                    });
                }).catch(function (error) {
                    res.send([{ status: 0, selected_tip1: error }]);
                });
            } else {
                var cmt = function () {
                    return new Promise(function (resolve, reject) {
                        db.query("SELECT distinct trainer_type_name ,master_trainer_id as id,trainer_name as itemName FROM `batch_trainer` join tbl_master_trainer on batch_trainer.trainer_master_id=tbl_master_trainer.master_trainer_id where trainer_id= 'OT'", function (error, result) {
                            if (error) {
                                reject(error);
                            } else { resolve(result); }
                        });
                    });
                }
                // var supervisor = function () {
                //     return new Promise(function (resolve, reject) {
                //         db.query("SELECT master_trainer_id as id,trainer_name as itemName,trainer_type_name FROM `batch_trainer` join tbl_master_trainer on batch_trainer.trainer_master_id=tbl_master_trainer.master_trainer_id where batch_id=? and trainer_type_name='Supervisor'", id, function (error, result) {
                //             if (error) {
                //                 reject(error);
                //             } else { resolve(result); }
                //         });
                //     });
                // }
                // var ct = function () {
                //     return new Promise(function (resolve, reject) {
                //         db.query("SELECT master_trainer_id as id,trainer_name as itemName,trainer_type_name FROM `batch_trainer` join tbl_master_trainer on batch_trainer.trainer_master_id=tbl_master_trainer.master_trainer_id where batch_id=? and trainer_type_name='Certified Trainer'", id, function (error, result) {
                //             if (error) {
                //                 reject(error);
                //             } else { resolve(result); }
                //         });
                //     });
                // }
                var type = function () {
                    return new Promise(function (resolve, reject) {
                        db.query("SELECT DISTINCT trainer_type_name from tbl_master_trainer where trainer_id= 'OT'", function (error, result) {
                            if (error) {
                                reject(error);
                            } else { resolve(result); }
                        });
                    });
                }
                var trainer_cmt = function () {
                    return new Promise(function (resolve, reject) {
                        db.query("SELECT master_trainer_id as id,trainer_name as itemName FROM `tbl_master_trainer` where trainer_type_name = 'Certified Master Trainer'", function (error, result) {
                            if (error) {
                                reject(error);
                            } else { resolve(result); }
                        });
                    });
                }
                // var trainer_supervisor = function () {
                //     return new Promise(function (resolve, reject) {
                //         db.query("SELECT master_trainer_id as id,trainer_name as itemName FROM `tbl_master_trainer` where trainer_type_name = 'Supervisor'", function (error, result) {
                //             if (error) {
                //                 reject(error);
                //             } else { resolve(result); }
                //         });
                //     });
                // }
                // var trainer_ct = function () {
                //     return new Promise(function (resolve, reject) {
                //         db.query("SELECT master_trainer_id as id,trainer_name as itemName FROM `tbl_master_trainer` where trainer_type_name = 'Certified Trainer'", function (error, result) {
                //             if (error) {
                //                 reject(error);
                //             } else { resolve(result); }
                //         });
                //     });
                // }
                cmt().then(function (cmt) {
                    //  supervisor().then(function (supervisor) {
                    type().then(function (type) {
                        trainer_cmt().then(function (trainer_cmt) {
                            //       trainer_supervisor().then(function (trainer_supervisor) {
                            //        trainer_ct().then(function (trainer_ct) {
                            res.send([{
                                status: 1, selected: cmt,// supervisor: supervisor,
                                type: type
                                , trainer: trainer_cmt//, trainer_supervisor: trainer_supervisor, trainer_ct: trainer_ct
                            }]);
                        });
                        //    });
                        // });
                        //   });
                    });
                }).catch(function (error) {
                    res.send([{ status: 0, selected_tip1: error }]);
                });
            }
        }
    });
});

// image upload api 
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public/attendance_sheet');
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname + '-' + Date.now() + path.extname(file.originalname))
    }
});

// const fileFilter = (req, file, cb) => {
//     // reject a file
//     if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png') {
//         cb(null, true);
//     } else {
//         cb(null, false);
//     }
// };

const upload = multer({
    storage: storage,
});

app.post("/upload/:id", upload.any(), (req, res, next) => {

    var name = req.files;
    if (!name) {
        res.send({ status: 0, msg: 'Please choose file' });
    } else {
        var attendance_sheet = req.files[0].filename;
        var id = req.params.id;
        var fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;
        db.query('update tbl_batch_insert set attendance_sheet =? where batch_id = ?', [attendance_sheet, id], function (error, result) {
            if (error) {
                res.send({ status: 1, msg: error });
            } else { res.send({ status: 1, msg: 'file Uploaded' }); }

        });
    }
});

app.get('/batch_id_list', function (req, res) {

    db.query("SELECT *,case when training_type_id=1 then 'BST' when training_type_id=2 then 'TT' when training_type_id=3 then 'MTT' end as code, case when training_type_id=1 then concat('BST/',batch_id) when training_type_id=2 then concat('TT/',batch_id) when training_type_id=3 then concat('MTT/',batch_id) end as batch_code FROM `tbl_batch_insert` where status=1", function (error, result) {
        //  db.query("call batch_id_list() ", function (error, result) {

        if (result.length == 0) {
            res.send([{ status: 0, batch_id_list: 'No result found' }]);
        } else {
            res.send([{ status: 1, batch_id_list: result }]);
        }
    });
});

app.post('/update_status/:id', verifyToken, function (req, res) {
    jwt.verify(req.token, 'SuperSecRetKey', (err, authData) => {
        if (err) {
            res.send([{ status: 0, msg: err }]);
        } else {
            var status = req.body.status;
            var id = req.params.id;
            var modified_by = authData['results'][0].trainer_name;

            db.query('SELECT status FROM `tbl_batch_insert` where batch_id =? ', id, function (err, status_check) {

                if (status == status_check[0].status) {
                    res.send([{ status: 1, msg: 'Already Closed' }]);
                } else {
                    db.query('update tbl_batch_insert set status= ?,modified_by=? where batch_id =? ', [status, modified_by, id], function (err, result) {
                        if (err) {
                            res.send([{ status: 0, msg: error }]);
                        } else {
                            res.send([{ status: 1, msg: 'Status Updated Successfully' }]);
                        }
                    });
                }
            });
        }
    });
});

app.get('/phone_number_wise_list/:id', verifyToken, function (req, res) {
    var id = req.params.id;
    db.query("SELECT * FROM `tbl_register` where contact_no=? order by register_id desc", id, function (error, result) {
        if (result.length == 0) {
            res.send([{ status: 0, phone_number_wise_list: 'No result found', error: error }]);
        } else {
            res.send({ status: 1, phone_number_wise_list: result });
        }
    });
});

app.post('/group_link/:id', verifyToken, function (req, res) {
    jwt.verify(req.token, 'SuperSecRetKey', (err, authData) => {

        if (err) {
            res.send([{ status: 0, msg: err }]);
        } else {
            var classroom_link = req.body.classroom_link;
            var group_link = req.body.group_link;
            var id = req.params.id;
            db.query('update tbl_batch_insert set group_link=?,classroom_link= ? where batch_id =?', [group_link, classroom_link, id], function (err, result) {
                if (err) {
                    res.send({ status: 0, group_link: err });
                } else {
                    res.send({ status: 1, group_link: 'Updated Successfully' });
                }
            });
        }
    });
});

app.post('/post', function (req, res) {
    var data = {
        "training_type_name": req.body.training_type_name,
        "training_code": req.body.training_code,
        "created_by": 'Ashish',
    }
    // Validation
    if (!data.training_type_name) {
        res.send([{ status: 0, msg: 'Training Name is required' }]);
    }
    else if (!data.training_code) {
        res.send([{ status: 0, msg: 'Training code is required' }]);
    } else {
        db.query('insert into tbl_master_training_type set ?', data, function (err, result) {
            if (err) {
                res.send([{ status: 0, msg: err }]);
            } else {
                res.send([{ status: 1, msg: 'Data Saved Successfully' }]);
            }
        });
    }

});

module.exports = app;