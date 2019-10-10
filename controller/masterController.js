/* -----------------Created by Ashish Singla------------------------*/

var express = require("express");
var app = express();
var db = require('../model/db');
const jwt = require('jsonwebtoken');
var router = express.Router();
app.use('/', router);
var async = require('async');

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

app.post('/training_type_master', verifyToken, (req, res) => {
    jwt.verify(req.token, 'SuperSecRetKey', (err, authData) => {
        if (err) {
            res.send([{ status: 0, msg: err }]);
        } else {
            var data = {
                "training_type_name": req.body.training_type_name,
                "training_code": req.body.training_code,
                "created_by": authData['results'][0].trainer_name,
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
        }
    });
});

app.get('/list_training_type_master', verifyToken, function (req, res) {
    jwt.verify(req.token, 'SuperSecRetKey', (err, authData) => {
        if (err) {
            res.send([{ status: 0, msg: err }]);
        } else {
            db.query('select * from tbl_master_training_type where is_deleted=0', function (error, result) {
                if (result.length == 0) {
                    res.send([{ status: 0, list_training_type_master: 'No result found' }]);
                } else {
                    //  console.log(result)
                    res.send([{ status: 1, list_training_type_master: result }]);
                }
            });
        }
    });
});

app.post('/update_training_type_master/:id', verifyToken, function (req, res) {
    jwt.verify(req.token, 'SuperSecRetKey', (err, authData) => {
        if (err) {
            res.send([{ status: 0, msg: err }]);
        } else {
            var data = {
                "training_type_name": req.body.training_type_name,
                "training_code": req.body.training_code,
                "last_modified_by": authData['results'][0].trainer_name,
            }
            var id = req.params.id;
            // Validation
            if (!data.training_type_name) {
                res.send([{ status: 0, msg: 'Training Name is required' }]);
            }
            else if (!data.training_code) {
                res.send([{ status: 0, msg: 'Training code is required' }]);
            } else {
                db.query('update tbl_master_training_type set ? where training_type_id =? ', [data, id], function (err, result) {
                    if (err) {
                        res.send([{ status: 0, msg: 'Something went wrong', error: error }]);
                    } else {
                        res.send([{ status: 1, msg: 'Data Updated Successfully' }]);
                    }
                });
            }
        }
    });
});

app.delete('/delete_training_type_master/:id', verifyToken, function (req, res) {
    jwt.verify(req.token, 'SuperSecRetKey', (err, authData) => {
        if (err) {
            res.send([{ status: 0, msg: 'Token Required' }]);
        } else {
            var id = req.params.id;
            db.query('update tbl_master_training_type SET is_deleted = 1,last_modified_by = ? where training_type_id =? ', [authData['results'][0].trainer_name, id], function (err, result) {
                if (err) {
                    res.send([{ status: 0, msg: 'Something went wrong', error: error }]);
                } else {
                    res.send([{ status: 1, msg: 'Training type master successfully deleted' }]);
                }
            });
        }
    });
});

app.post('/trainer_type_master', verifyToken, (req, res) => {
    jwt.verify(req.token, 'SuperSecRetKey', (err, authData) => {
        if (err) {
            res.send([{ status: 0, msg: err }]);
        } else {
            var data = {
                "trainer_type_name": req.body.trainer_type_name,
                "trainer_type_code": req.body.trainer_type_code,
                //"training_id":req.body.training_id,
                "created_by": authData['results'][0].trainer_name,
            }
            // Validation
            if (!data.trainer_type_name) {
                res.send([{ status: 0, msg: 'Training Name is required' }]);
            }
            else if (!data.trainer_type_code) {
                res.send([{ status: 0, msg: 'Training code is required' }]);
            } else {
                db.query('insert into tbl_master_trainer_type set ?', data, function (err, result) {
                    if (err) {
                        res.send([{ status: 0, msg: err }]);
                    } else {
                        res.send([{ status: 1, msg: 'Data Saved Successfully' }]);
                    }
                });
            }
        }
    });
});

app.get('/list_trainer_type_master', verifyToken, function (req, res) {
    jwt.verify(req.token, 'SuperSecRetKey', (err, authData) => {
        db.query('select * from tbl_master_trainer_type where is_deleted=0', function (error, result) {
            if (result.length == 0) {
                res.send([{ status: 0, list_trainer_type_master: 'No result found' }]);
            } else {
                res.send([{ status: 1, list_trainer_type_master: result }]);
            }
        });
    });
});

app.post('/update_trainer_type_master/:id', verifyToken, function (req, res) {
    jwt.verify(req.token, 'SuperSecRetKey', (err, authData) => {
        if (err) {
            res.send([{ status: 0, msg: err }]);
        } else {
            var data = {
                "trainer_type_name": req.body.trainer_type_name,
                "trainer_type_code": req.body.trainer_type_code,
                "last_modified_by": authData['results'][0].trainer_name,
            }
            var id = req.params.id;
            // Validation
            if (!data.trainer_type_name) {
                res.send([{ status: 0, msg: 'Training Name is required' }]);
            }
            else if (!data.trainer_type_code) {
                res.send([{ status: 0, msg: 'Training code is required' }]);
            } else {
                db.query('update tbl_master_trainer_type set ? where trainer_type_id =? ', [data, id], function (err, result) {
                    if (err) {
                        res.send([{ status: 0, msg: 'Something went wrong', error: error }]);
                    } else {
                        res.send([{ status: 1, msg: 'Data Updated Successfully' }]);
                    }
                });
            }
        }
    });
});

app.delete('/delete_trainer_type_master/:id', verifyToken, function (req, res) {
    jwt.verify(req.token, 'SuperSecRetKey', (err, authData) => {
        if (err) {
            res.send([{ status: 0, msg: err }]);
        } else {
            var id = req.params.id;
            db.query('update tbl_master_trainer_type SET is_deleted = 1,last_modified_by = ? where trainer_type_id =? ', [authData['results'][0].trainer_name, id], function (err, result) {
                if (err) {
                    res.send([{ status: 0, msg: 'Something went wrong', error: error }]);
                } else {
                    res.send([{ status: 1, msg: 'Trainer type master successfully deleted' }]);
                }
            });
        }
    });
});

app.post('/trainer_master', verifyToken, (req, res) => {
    jwt.verify(req.token, 'SuperSecRetKey', (err, authData) => {
        if (err) {
            res.send([{ status: 0, msg: err }]);
        } else {
            var data = {
                "trainer_type_name": req.body.trainer_type_name,
                "trainer_name": req.body.trainer_name,
                //"trainer_code":req.body.trainer_code,
                "trainer_id": req.body.trainer_id,
                "mobile": req.body.mobile,
                "password": req.body.mobile,
                "email": req.body.email,
                "certificate_issue_date": req.body.certificate_issue_date,
                "status": req.body.status,
                "created_by": authData['results'][0].trainer_name,
                "activation_date": new Date()
            }
            // Validation
            if (!data.trainer_name) {
                res.send([{ status: 0, msg: 'Trainer Name is required' }]);
            }
            else if (!data.mobile) {
                res.send([{ status: 0, msg: 'Mobile is required' }]);

            } else if (!data.email) {
                res.send([{ status: 0, msg: 'Email is required' }]);
            } else {
                var trainer_id = 'TT';
                var trainer_id1 = 'MTT';

                db.query('select * from tbl_master_trainer where mobile=?', data.mobile, function (err, check_number) {

                    if (check_number.length == 0) {
                        db.query('insert into tbl_master_trainer set ?', data, function (err, result) {
                            var insertId = result.insertId;
                            var modules_ids = [];
                            // console.log(req.body.module_id[0]['id']);
                            for (var i = 0; i < req.body.module_id.length; i++) {
                                modules_ids[i] = req.body.module_id[i]['id']
                            }

                            if (modules_ids.length == 0) {
                                db.query("insert into module_trainer (module_id,master_trainer_id) values (1,?),(2,?),(3,?),(4,?),(5,?),(6,?),(7,?),(8,?),(9,?),(10,?),(11,?),(12,?),(13,?),(14,?),(15,?),(16,?),(17,?),(18,?),(19,?),(20,?),(21,?),(22,?),(23,?),(12,?)", [insertId, insertId, insertId, insertId, insertId, insertId, insertId, insertId, insertId, insertId, insertId, insertId, insertId, insertId, insertId, insertId, insertId, insertId, insertId, insertId, insertId, insertId, insertId, insertId], function (err, insert) {
                                });
                            } else {
                                db.query('INSERT INTO module_trainer (module_id, master_trainer_id) VALUES ? ',
                                    [Array.from(modules_ids).map(function (g) { return [g, insertId]; })], function (err, result, fields) {
                                        res.send([{ status: 1, msg: 'Data Saved Successfully' }]);
                                    });
                            }
                            if (err) {
                                res.send([{ status: 0, msg: err }]);
                            } else {
                                if (data.trainer_type_name == 'Supervisor CMT' || data.trainer_type_name == 'Supervisor CT' || data.trainer_type_name == 'Supervised Teacher') {
                                    db.query("INSERT INTO `tbl_master_trainer`( trainer_type_name, trainer_id, trainer_name, mobile, email, certificate_issue_date)values(?,?,?,?,?,?)", [data.trainer_type_name, trainer_id, data.trainer_name, data.mobile, data.email, data.certificate_issue_date], function (error, result) {
                                        db.query("INSERT INTO `tbl_master_trainer`( trainer_type_name, trainer_id, trainer_name, mobile, email, certificate_issue_date)values(?,?,?,?,?,?)", [data.trainer_type_name, trainer_id1, data.trainer_name, data.mobile, data.email, data.certificate_issue_date], function (error, insert) {


                                            res.send([{ status: 1, msg: 'Data Saved Successfully', error }]);
                                        });
                                    });
                                } else {
                                    res.send([{ status: 1, msg: 'Data Saved Successfully' }]);
                                }
                            }
                        });
                    } else {
                        res.send([{ status: 0, msg: 'Phone number already exists' }]);

                    }
                });

            }
        }
    });
});

app.get('/list_trainer_master', verifyToken, function (req, res) {
    jwt.verify(req.token, 'SuperSecRetKey', (err, authData) => {

        var pageNo = parseInt(req.query.pageNo)
        var size = parseInt(req.query.size)
        var query = {}

        query.limit = pageNo
        query.skip = query.limit + 1

        db.query('select count(*) as count from tbl_master_trainer where is_deleted=0 and activation_date  >= NOW() - INTERVAL 12 month ', function (err, totalCount) {
            //var totalPages = Math.ceil(totalCount[0].count / size)
            // db.query('select * from tbl_master_trainer where is_deleted=0 and activation_date  >= NOW() - INTERVAL 12 month limit 10 offset ?',query.limit,function(error,result){
            db.query('select * from tbl_master_trainer where is_deleted=0 and activation_date  >= NOW() - INTERVAL 12 month ', function (error, result) {
                if (result.length == 0) {
                    res.send([{ status: 0, list_trainer_master: 'No result found' }]);
                } else {

                    res.send([{ status: 1, list_trainer_master: result, total_count: totalCount }]);
                }

            });
        });
    });
});

app.post('/update_trainer_master/:id', verifyToken, function (req, res) {
    jwt.verify(req.token, 'SuperSecRetKey', (err, authData) => {
        if (err) {
            res.send([{ status: 0, msg: err }]);
        } else {
            var data = {
                "trainer_type_name": req.body.trainer_type_name,
                "trainer_name": req.body.trainer_name,
                "trainer_id": req.body.trainer_id,
                "mobile": req.body.mobile,
                "password": req.body.mobile,
                "email": req.body.email,
                "certificate_issue_date": req.body.certificate_issue_date,
                "status": req.body.status,
                "last_modified_by": authData['results'][0].trainer_name,
            }
            var id = req.params.id;
            // Validation
            if (!data.trainer_name) {
                res.send([{ status: 0, msg: 'Name is required' }]);
            }
            else if (!data.mobile) {
                res.send([{ status: 0, msg: 'Mobile is required' }]);

            } else if (!data.email) {
                res.send([{ status: 0, msg: 'Email is required' }]);
            } else {
                var trainer_id = 'TT';
                var trainer_id1 = 'MTT';
                db.query('update tbl_master_trainer set ? where master_trainer_id =? ', [data, id], function (err, result) {
                    db.query("delete FROM `module_trainer` where master_trainer_id=?", id, function (error, master) {
                        var modules_ids = [];
                        // console.log(req.body.module_id[0]['id']);
                        for (var i = 0; i < req.body.module_id.length; i++) {
                            modules_ids[i] = req.body.module_id[i]['id']
                        }
                        db.query('INSERT INTO module_trainer (module_id, master_trainer_id) VALUES ? ',
                            [Array.from(modules_ids).map(function (g) { return [g, id]; })], function (err, result, fields) {
                                res.send([{ status: 1, msg: 'Data Updated Successfully', error }]);
                            });
                    });
                    if (err) {
                        res.send([{ status: 0, msg: 'Something went wrong', error: err }]);
                    } else {
                        if (data.trainer_type_name == 'Supervisor CMT' || data.trainer_type_name == 'Supervisor CT' || data.trainer_type_name == 'Supervised Teacher') {
                            db.query("update  `tbl_master_trainer` set trainer_type_name =?, trainer_id=?, trainer_name=?, mobile=?, email=?, certificate_issue_date=? where master_trainer_id =?", [data.trainer_type_name, trainer_id, data.trainer_name, data.mobile, data.email, data.certificate_issue_date, id], function (error, insert) {
                                db.query("update  `tbl_master_trainer` set trainer_type_name =?, trainer_id=?, trainer_name=?, mobile=?, email=?, certificate_issue_date=? where master_trainer_id =?", [data.trainer_type_name, trainer_id1, data.trainer_name, data.mobile, data.email, data.certificate_issue_date, id], function (error, insert) {
                                    db.query("delete FROM `module_trainer` where master_trainer_id=?", id, function (error, master) {

                                        db.query('INSERT INTO module_trainer (module_id, master_trainer_id) VALUES ? ',
                                            [Array.from(req.body.module_id).map(function (g) { return [g, id]; })], function (err, result, fields) {
                                                console.log(req.body.module_id);
                                                res.send([{ status: 1, msg: 'Data Updated Successfully', error }]);
                                            });
                                    });
                                });
                            });
                        } else {
                            res.send([{ status: 1, msg: 'Data Updated Successfully' }]);
                        }
                    }
                });
            }
        }
    });
});

app.delete('/delete_trainer_master/:id', verifyToken, function (req, res) {
    jwt.verify(req.token, 'SuperSecRetKey', (err, authData) => {
        if (err) {
            res.send([{ status: 0, msg: err }]);
        } else {
            var id = req.params.id;
            db.query('update tbl_master_trainer SET is_deleted = 1,last_modified_by = ? where master_trainer_id =? ', [authData['results'][0].trainer_name, id], function (err, result) {
                if (err) {
                    res.send([{ status: 0, msg: 'Something went wrong', error: error }]);
                } else {
                    res.send([{ status: 1, msg: 'Trainer master successfully deleted' }]);
                }
            });
        }
    });
});

app.post('/venue_code_master', verifyToken, (req, res) => {
    jwt.verify(req.token, 'SuperSecRetKey', (err, authData) => {
        if (err) {
            res.send([{ status: 0, msg: err }]);
        } else {
            var data = {
                "venue_code": req.body.venue_code,
                "venue_name": req.body.venue_name,
                "created_by": authData['results'][0].trainer_name,
            }
            // Validation
            if (!data.venue_code) {
                res.send([{ status: 0, msg: 'Venue Code is required' }]);
            }
            else if (!data.venue_name) {
                res.send([{ status: 0, msg: 'Venue Name is required' }]);
            } else {
                db.query('insert into tbl_master_venue_code set ?', data, function (err, result) {
                    if (err) {
                        res.send([{ status: 0, msg: err }]);
                    } else {
                        res.send([{ status: 1, msg: 'Data Saved Successfully' }]);
                    }
                });
            }
        }
    });
});

app.get('/list_venue_code_master', verifyToken, function (req, res) {
    jwt.verify(req.token, 'SuperSecRetKey', (err, authData) => {
        if (err) {
            res.send([{ status: 0, msg: err }]);
        } else {
            db.query('select * from tbl_master_venue_code where is_deleted=0', function (error, result) {
                if (result.length == 0) {
                    res.send([{ status: 0, list_venue_code_master: 'No result found' }]);
                } else {
                    res.send([{ status: 1, list_venue_code_master: result }]);
                }
            });
        }
    });
});

app.post('/update_venue_code_master/:id', verifyToken, function (req, res) {
    jwt.verify(req.token, 'SuperSecRetKey', (err, authData) => {
        if (err) {
            res.send([{ status: 0, msg: err }]);
        } else {
            var data = {
                "venue_code": req.body.venue_code,
                "venue_name": req.body.venue_name,
                "last_modified_by": authData['results'][0].trainer_name,
            }
            var id = req.params.id;
            // Validation
            if (!data.venue_code) {
                res.send([{ status: 0, msg: 'Venue Code is required' }]);

            } else if (!data.venue_name) {
                res.send([{ status: 0, msg: 'Venue Name is required' }]);

            } else {
                db.query('update tbl_master_venue_code set ? where venue_code_id = ? ', [data, id], function (err, result) {
                    if (err) {
                        res.send([{ status: 0, msg: 'Something went wrong', error: error }]);
                    } else {
                        res.send([{ status: 1, msg: 'Data Updated Successfully' }]);
                    }
                });
            }
        }
    });
});

app.delete('/delete_venue_code_master/:id', verifyToken, function (req, res) {
    jwt.verify(req.token, 'SuperSecRetKey', (err, authData) => {
        if (err) {
            res.send([{ status: 0, msg: err }]);
        } else {
            var id = req.params.id;
            db.query('update tbl_master_venue_code SET is_deleted = 1,last_modified_by = ? where venue_code_id =? ', [authData['results'][0].trainer_name, id], function (err, result) {
                if (err) {
                    res.send([{ status: 0, msg: 'Something went wrong', error: err }]);
                } else {
                    res.send([{ status: 1, msg: 'Venue master code successfully deleted' }]);
                }
            });
        }
    });
});

app.post('/venue_master', verifyToken, (req, res) => {
    jwt.verify(req.token, 'SuperSecRetKey', (err, authData) => {
        if (err) {
            res.send([{ status: 0, msg: err }]);
        } else {
            var data = {
                "venue_code": req.body.venue_code,
                "state": req.body.state,
                "district": req.body.district,
                "city": req.body.city,
                "venue": req.body.venue,
                "pincode": req.body.pincode,
                "capacity": req.body.capacity,
                "status": req.body.status,
                "created_by": authData['results'][0].trainer_name,
            }
            // Validation
            if (!data.state) {
                res.send([{ status: 0, msg: 'State is required' }]);
            }
            else if (!data.venue) {
                res.send([{ status: 0, msg: 'Venue is required' }]);

            } else if (!data.pincode) {
                res.send([{ status: 0, msg: 'Pincode is required' }]);

            } else if (!data.capacity) {
                res.send([{ status: 0, msg: 'Capacity is required' }]);
            } else {
                db.query('insert into tbl_master_venue set ?', data, function (err, result) {
                    if (err) {
                        res.send([{ status: 0, msg: err }]);
                    } else {
                        res.send([{ status: 1, msg: 'Data Saved Successfully' }]);
                    }
                });
            }
        }
    });
});

app.get('/list_venue_master', verifyToken, function (req, res) {
    jwt.verify(req.token, 'SuperSecRetKey', (err, authData) => {
        if (err) {
            res.send([{ status: 0, msg: err }]);
        } else {
            var pageNo = parseInt(req.query.pageNo)
            var size = parseInt(req.query.size)
            var query = {}
            query.limit = pageNo
            db.query('select count(*) as count from tbl_master_venue where is_deleted=0', function (err, totalCount) {

                db.query('SELECT state_name as state,venue,venue_code,district,pincode,capacity FROM `tbl_master_venue` left join states on tbl_master_venue.state = states.state_id where is_deleted=0 ', function (error, result) {
                    if (result.length == 0) {
                        res.send([{ status: 0, list_venue_master: 'No result found' }]);
                    } else {
                        db.query('select venue_code from tbl_master_venue_code where is_deleted=0', function (err, data) {
                            res.send([{ status: 1, list_venue_master: result, total_count: totalCount, venue_code: data }]);
                        });
                    }
                });
            });
        }
    });
});

app.post('/update_venue_master/:id', verifyToken, function (req, res) {
    jwt.verify(req.token, 'SuperSecRetKey', (err, authData) => {
        if (err) {
            res.send([{ status: 0, msg: err }]);
        } else {
            var data = {
                "venue_code": req.body.venue_code,
                "state": req.body.state,
                "city": req.body.city,
                "venue": req.body.venue,
                "pincode": req.body.pincode,
                "capacity": req.body.capacity,
                "status": req.body.status,
                "last_modified_by": authData['results'][0].trainer_name,
            }
            var id = req.params.id;
            // Validation
            if (!data.venue) {
                res.send([{ status: 0, msg: 'Venue is required' }]);

            } else if (!data.state) {
                res.send([{ status: 0, msg: 'State is required' }]);

            } else if (!data.capacity) {
                res.send([{ status: 0, msg: 'Capacity is required' }]);

            } else {
                db.query('update tbl_master_venue set ? where venue_id = ? ', [data, id], function (err, result) {
                    if (err) {
                        res.send([{ status: 0, msg: 'Something went wrong', error: error }]);
                    } else {
                        res.send([{ status: 1, msg: 'Data Updated Successfully' }]);
                    }
                });
            }
        }
    });
});

app.delete('/delete_venue_master/:id', verifyToken, function (req, res) {
    jwt.verify(req.token, 'SuperSecRetKey', (err, authData) => {
        if (err) {
            res.send([{ status: 0, msg: err }]);
        } else {
            var id = req.params.id;

            db.query('update tbl_master_venue SET is_deleted = 1,last_modified_by = ? where venue_id =? ', [authData['results'][0].trainer_name, id], function (err, result) {
                if (err) {
                    res.send([{ status: 0, msg: 'Something went wrong', error: err }]);
                } else {
                    res.send([{ status: 1, msg: 'Venue master successfully deleted' }]);
                }
            });
        }
    });
});

app.post('/feedback_question', verifyToken, function (req, res) {
    jwt.verify(req.token, 'SuperSecRetKey', (err, authData) => {
        if (err) {
            res.send([{ status: 0, msg: err }]);
        } else {
            var data = {
                "question_english": req.body.question_english,
                "question_hindi": req.body.question_hindi,
                "status": req.body.status,
                "created_by": authData['results'][0].trainer_name,
            }
            // Validation
            if (!data.question_english) {
                res.send([{ status: 0, msg: 'Question english is required' }]);
            }
            else if (!data.question_hindi) {
                res.send([{ status: 0, msg: 'Question hindi is required' }]);

            } else {
                db.query('insert into tbl_master_feedback_question set ?', data, function (err, result) {
                    if (err) {
                        res.send([{ status: 0, msg: err }]);
                    } else {
                        res.send([{ status: 1, msg: 'Data Saved Successfully' }]);
                    }
                });
            }
        }
    });
});

app.get('/list_feedback_question', verifyToken, function (req, res) {
    jwt.verify(req.token, 'SuperSecRetKey', (err, authData) => {
        if (err) {
            res.send([{ status: 0, msg: err }]);
        } else {
            db.query('select * from tbl_master_feedback_question where is_deleted=0', function (error, result) {
                if (result.length == 0) {
                    res.send([{ status: 0, list_feedback_question: 'No result found' }]);
                } else {
                    res.send([{ status: 1, list_feedback_question: result }]);
                }
            });
        }
    });
});

app.post('/update_feedback_question/:id', verifyToken, function (req, res) {
    jwt.verify(req.token, 'SuperSecRetKey', (err, authData) => {
        if (err) {
            res.send([{ status: 0, msg: err }]);
        } else {
            var data = {
                "question_english": req.body.question_english,
                "question_hindi": req.body.question_hindi,
                "status": req.body.status,
                "last_modified_by": authData['results'][0].trainer_name,
            }
            var id = req.params.id;
            // Validation
            if (!data.question_english) {
                res.send([{ status: 0, msg: 'Question english is required' }]);
            }
            else if (!data.question_hindi) {
                res.send([{ status: 0, msg: 'Question hindi is required' }]);

            } else {
                db.query('update tbl_master_feedback_question set ? where feedback_question_id = ? ', [data, id], function (err, result) {
                    if (err) {
                        res.send([{ status: 0, msg: 'Something went wrong', error: error }]);
                    } else {
                        res.send([{ status: 1, msg: 'Data Updated Successfully' }]);
                    }
                });
            }
        }
    });
});

app.delete('/delete_feedback_question/:id', verifyToken, function (req, res) {
    jwt.verify(req.token, 'SuperSecRetKey', (err, authData) => {
        if (err) {
            res.send([{ status: 0, msg: err }]);
        } else {
            var id = req.params.id;

            db.query('update tbl_master_feedback_question SET is_deleted = 1,last_modified_by = ? where feedback_question_id =? ', [authData['results'][0].trainer_name, id], function (err, result) {
                if (err) {
                    res.send([{ status: 0, msg: 'Something went wrong', error: err }]);
                } else {
                    res.send([{ status: 1, msg: 'Feedback question master deleted successfully ' }]);
                }
            });
        }
    });
});

app.get('/trainer_list', verifyToken, function (req, res) {
    jwt.verify(req.token, 'SuperSecRetKey', (err, authData) => {
        if (err) {
            res.send([{ status: 0, msg: err }]);
        } else {
            db.query('select trainer_type_name,trainer_type_code from tbl_master_trainer_type where is_deleted=0', function (error, result) {
                if (result.length == 0) {
                    res.send([{ status: 0, trainer_list: 'No result found' }]);
                } else {
                    res.send([{ status: 1, trainer_list: result }]);
                }
            });
        }
    });
});

app.get('/states', function (req, res) {

    db.query('select * from states', function (error, result) {
        if (result.length == 0) {
            res.send([{ status: 0, states: 'No result found' }]);
        } else {
            res.send([{ status: 1, states: result }]);
        }
    });
});

app.get('/state_wise_district/:id', function (req, res) {

    var id = req.params.id;
    db.query('SELECT * FROM `states` join districts on states.state_id=districts.state_id where state_name= ? ', id, function (error, result) {
        db.query('SELECT venue FROM `states`  join tbl_master_venue on tbl_master_venue.state=states.state_name where states.state_name=? ', id, function (error, venue_list) {

            if (result.length == 0) {
                res.send([{ status: 0, state_wise_district: 'No result found' }]);
            } else {
                res.send([{ status: 1, state_wise_district: result, state_wise_venue: venue_list }]);
            }
        });

    });
});



module.exports = app;