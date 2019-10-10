
/* -----------------Created by Ashish Singla------------------------*/
var express = require("express");
var app = express();
var db = require('../model/db');
const jwt = require('jsonwebtoken');
var promise = require('promise');
var nodemailer = require('nodemailer');
var http = require('http');
var request = require('request');


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

app.get('/basic_training_exam_list', verifyToken, function (req, res) {
    jwt.verify(req.token, 'SuperSecRetKey', (err, authData) => {
        if (err) {
            res.send([{ status: 0, msg: err }]);
        } else {
            var bst_exam_list = function () {
                return new Promise(function (resolve, reject) {
                    db.query("SELECT distinct *,case when training_type=1 then concat('BST/',batch_id) end as batch_code FROM `tbl_batch_attendance` where training_type=1 and count=1 and type=1 and attendance=1 group by mobile having count(mobile)=2 ", function (error, result) {
                        if (result.length == 0) {
                            reject(error);
                        } else { resolve(result); }
                    });
                });
            }

            bst_exam_list().then(function (rows) {
                res.send([{ status: 1, bst_exam_list: rows }]);
            }).catch(function (err) {
                res.send([{ status: 0, bst_exam_list: 'No result found' }]);
            });
        }
    });
});

app.post('/exam_result_bst', verifyToken, (req, res) => {
    jwt.verify(req.token, 'SuperSecRetKey', (err, authData) => {
        if (err) {
            res.send([{ status: 0, msg: err }]);
        } else {
            var jsondata = req.body;
            // console.log(jsondata['address']);

            var values = [];
            for (var i = 0; i < jsondata['address'].length; i++)
                values.push([
                    jsondata['address'][i].batch_id,
                    jsondata['address'][i].name,
                    jsondata['address'][i].email,
                    jsondata['address'][i].mobile,
                    jsondata['address'][i].written_status,
                    jsondata['address'][i].interview_status,
                    jsondata['address'][i].remarks]);

            db.query('insert into basic_training_exam (batch_id, name,email,mobile,written_status,interview_status,remarks) VALUES  ?', [values], function (err, result) {
                if (err) {
                    res.send([{ status: 0, msg: err }]);
                } else {

                    db.query('SELECT distinct * FROM `basic_training_exam` where written_status=1 and interview_status=1 or written_status=0 and interview_status=1', function (err, data) {
                        for (var i = 0; i < data.length; i++) {
                            var email = data[i].email;
                            var mobile = data[i].mobile;
                            var name = data[i].name;

                            db.query('UPDATE `tbl_batch_attendance` SET count=2 where mobile = ?', mobile, function (err, data) {
                                /* --------------------------------------code for SMS Start------------------------*/

                                request.get({ url: "http://nimbusit.co.in/api/swsendSingle.asp?username=t1globalapi&password=glaze_123&sender=GALWAY&sendto=" + mobile + "&message=Congrats! You have cleared the written test and Interview of the Basic SEP Training attended 2-times. www.galwayfoundation.org to know more" }, mobile, function (error, response, body) {
                                });
                                /* --------------------------------------code for SMS end------------------------*/

                            });



                            /* --------------------------------------code for mail start------------------------*/
                            var smtpConfig = {
                                host: 'smtp.gmail.com',
                                port: 465,
                                secure: true, // use SSL
                                auth: {
                                    user: 'info.sep@glazegalway.com',
                                    pass: 'mind.soul@123'
                                }
                            };
                            var transporter = nodemailer.createTransport(smtpConfig);
                            let mailOptions = {
                                from: 'info.sep@glazegalway.com', // sender address
                                to: email, // list of receivers
                                subject: 'Congrats! You have cleared the Basic SEP Training ', // Subject line
                                //text: 'dsad', // plain text body
                                html: '<b>Dear ' + name + ',</b>' + '</br></br>' + "<p style='font-size: 16px;font-family: sans-serif;line-height: 28px;'> We are pleased to announce that you have cleared the written test and Interview of the Basic SEP Training attended 2-times.</p> <div style='background-color: #fff9e9;padding: 20px 40px 20px 40px;border-left: 3px solid #fee596;'> <h4 style='text-align: left;font-family: sans-serif;font-weight: 500;font-size: 17px;'>Message from Ms Romshri Ashesh:</h4><p style='text-align: justify;line-height: 26px;font-family: sans-serif;font-size: 14px;'>“This program envisions a world full of peaceful, joyful, empowered, successful, spiritual, happy and elevated souls who are sharing this significant knowledge with their fellow human-beings with pure intentions. I pray to Creator that as you are reading these words, may your life filled up with spiritual knowledge, health, prosperity, happiness, abundance and empowerment. I humbly and sincerely dedicate this program to every individual who carry a pure desire to know the meaning of life and to spread this knowledge selflessly and virtuously to this entire world.”You have to attend Trainer's Training (TT) to become Certified Trainer of Basic SEP Training.Go to <a href='www.galwayfoundation.org' style='background-color: #ec8675;color: white;text-decoration: none;padding: 2px 8px;'> www.galwayfoundation.org</a> or contact your trainer to know more.</p></div> <p style='font-family: sans-serif;text-align: center;font-size: 15px;line-height: 24px;color: #424141;'><span style='color: white;background-color: #45bb4a;padding: 6px 12px;line-height: 55px;border-radius: 4px;'> We once again welcome you to SEP Trainer Family.</span><br />Love & Light,SEP Team<br />Galway Foundation</p>",  // html body
                                //html:BST_pass.html,
                            };
                            transporter.sendMail(mailOptions, (error, info) => {
                                if (error) {
                                    return console.log(error);
                                }

                            });
                            /* --------------------------------------code for mail end------------------------*/
                        }
                    });

                    db.query('SELECT distinct * FROM `basic_training_exam` where written_status=1 and interview_status=0 or written_status=0 and interview_status=0', function (err, resolve) {
                        for (var i = 0; i < resolve.length; i++) {
                            var email = resolve[i].email;
                            var mobile = resolve[i].mobile;
                            var name = resolve[i].name;
                            db.query('UPDATE `tbl_batch_attendance` SET `count`=0 where mobile = ?', mobile, function (err, data) {
                                request.get({ url: "http://nimbusit.co.in/api/swsendSingle.asp?username=t1globalapi&password=glaze_123&sender=GALWAY&sendto=" + mobile + "&message=You have not cleared Basic SEP Training’s written test & Interview. www.galwayfoundation.org to know more" }, mobile, function (error, response, body) {
                                });
                            });


                            var smtpConfig = {
                                host: 'smtp.gmail.com',
                                port: 465,
                                secure: true, // use SSL
                                auth: {
                                    user: 'info.sep@glazegalway.com',
                                    pass: 'mind.soul@123'
                                }
                            };
                            var transporter = nodemailer.createTransport(smtpConfig);
                            let mailOptions = {
                                from: 'info.sep@glazegalway.com', // sender address
                                to: email, // list of receivers
                                subject: 'You have not cleared the Basic SEP Training ', // Subject line
                                html: '<b>Dear ' + name + ',</b>' + '</br></br>' + "<p style='font-size: 16px;font-family: sans-serif;line-height: 28px;'> We regret to announce that you have not cleared the written test and Video Interview of the Basic SEP Training attended 2-times.</p> <div style='background-color: #fff9e9;padding: 20px 40px 20px 40px;border-left: 3px solid #fee596;'> <h4 style='text-align: left;font-family: sans-serif;font-weight: 500;font-size: 17px;'>Message from Ms Romshri Ashesh:</h4><p style='text-align: justify;line-height: 26px;font-family: sans-serif;font-size: 14px;'>“This program envisions a world full of peaceful, joyful, empowered, successful, spiritual, happy and elevated souls who are sharing this significant knowledge with their fellow human-beings with pure intentions. I pray to Creator that as you are reading these words, may your life filled up with spiritual knowledge, health, prosperity, happiness, abundance and empowerment. I humbly and sincerely dedicate this program to every individual who carry a pure desire to know the meaning of life and to spread this knowledge selflessly and virtuously to this entire world.”You have to attend the basic SEP training once again to become Certified Trainer of Basic SEP Training.Go to <a href='www.galwayfoundation.org' style='background-color: #ec8675;color: white;text-decoration: none;padding: 2px 8px;'> www.galwayfoundation.org</a> or contact your trainer to know more.</p></div> <p style='font-family: sans-serif;text-align: center;font-size: 15px;line-height: 24px;color: #424141;'><span style='color: white;background-color: #45bb4a;padding: 6px 12px;line-height: 55px;border-radius: 4px;'> We once again welcome you to SEP Trainer Family.</span><br />Love & Light,SEP Team<br />Galway Foundation</p>",  // html body
                                //html:BST_pass.html,
                            };
                            transporter.sendMail(mailOptions, (error, info) => {
                                if (error) {
                                    return console.log(error);
                                }
                            });
                        }
                    });
                    res.send([{ status: 1, msg: 'Data Saved Successfully' }]);
                }
            });
        }
    });
});

app.get('/TIP1_exam_list', verifyToken, function (req, res) {
    jwt.verify(req.token, 'SuperSecRetKey', (err, authData) => {
        if (err) {
            res.send([{ status: 0, msg: err }]);
        } else {
            var TIP1_exam_list = function () {
                return new Promise(function (resolve, reject) {
                    db.query("SELECT distinct * ,case when training_type=1 then concat('BST/',batch_id) when training_type=2 then concat('TT/',batch_id) when training_type=3 then concat('MTT/',batch_id) end as batch_code FROM `tbl_batch_attendance` where attendance=1 and training_type=2 and count=1 and type='1'", function (error, result) {
                        if (result.length == 0) {
                            reject(error);
                        } else { resolve(result); }
                    });
                });
            }

            TIP1_exam_list().then(function (rows) {
                res.send([{ status: 1, TIP1_exam_list: rows }]);
            }).catch(function (err) {
                res.send([{ status: 0, TIP1_exam_list: 'No result found' }]);
            });
        }
    });
});

app.post('/tip1_training_exam', verifyToken, (req, res) => {
    jwt.verify(req.token, 'SuperSecRetKey', (err, authData) => {
        if (err) {
            res.send([{ status: 0, msg: err }]);
        } else {
            var jsondata = req.body;
            var values = [];
            for (var i = 0; i < jsondata['address'].length; i++) {
                values.push([
                    jsondata['address'][i].batch_id,
                    jsondata['address'][i].name,
                    jsondata['address'][i].email,
                    jsondata['address'][i].mobile,
                    jsondata['address'][i].status,
                    jsondata['address'][i].remarks]);

                var status = jsondata['address'][i].status;
                var mobile = jsondata['address'][i].mobile;
                if (status == 0) {
                    db.query('delete from tbl_master_trainer where mobile=?', [mobile], function (err, result) {
                        db.query('UPDATE `tbl_batch_attendance` SET count=0 where mobile = ?', mobile, function (err, data) {
                            request.get({ url: "http://nimbusit.co.in/api/swsendSingle.asp?username=t1globalapi&password=glaze_123&sender=GALWAY&sendto=" + mobile + "&message=You have not cleared the test of TIP 1, you have to attend the basic SEP training once again. Go to  www.galwayfoundation.org to know more" }, mobile, function (error, response, body) {

                            });
                        });
                    });
                } else if (status == 1) {
                    var tip = 'Trainer In process 1';
                    var trainer_id = 'BST';
                    db.query('UPDATE `tbl_batch_attendance` SET count=2 where mobile = ?', mobile, function (err, data) {

                        db.query('update tbl_master_trainer set trainer_type_name=?,trainer_id=? where mobile=?', [tip, trainer_id, mobile], function (err, result) {
                            request.get({ url: "http://nimbusit.co.in/api/swsendSingle.asp?username=t1globalapi&password=glaze_123&sender=GALWAY&sendto=" + mobile + "&message=Congratulations! You have cleared the test of TIP 1, now you may perform TIP2. Go to  www.galwayfoundation.org to know more" }, mobile, function (error, response, body) {
                            });
                        });
                        db.query("SELECT master_trainer_id FROM tbl_master_trainer where mobile=?", mobile, function (err, master_trainer_id) {
                            //console.log(master_trainer_id[0]['master_trainer_id']);
                            var master_id = master_trainer_id[0]['master_trainer_id'];

                            db.query("insert into module_trainer (module_id,master_trainer_id) values(14,?),(15,?),(16,?),(17,?),(18,?)", [master_id, master_id, master_id, master_id, master_id], function (err, insert) {
                            });
                        });
                    });
                }
            }
            db.query('insert into tip1_training_exam (batch_id, name,email,mobile,status,remarks) VALUES  ?', [values], function (err, result) {
                if (err) {
                    res.send([{ status: 0, msg: err }]);
                } else {
                    db.query('SELECT distinct * FROM tip1_training_exam', function (err, data) {
                        for (var i = 0; i < data.length; i++) {
                            var status = data[i].status;
                            var mobile = data[i].mobile;
                            var name = data[i].name;
                            var email = data[i].email;
                            //console.log(status);
                            if (status == 1) {
                                var smtpConfig = {
                                    host: 'smtp.gmail.com',
                                    port: 465,
                                    secure: true, // use SSL
                                    auth: {
                                        user: 'info.sep@glazegalway.com',
                                        pass: 'mind.soul@123'
                                    }
                                };
                                var transporter = nodemailer.createTransport(smtpConfig);
                                let mailOptions = {
                                    from: 'info.sep@glazegalway.com', // sender address
                                    to: email, // list of receivers
                                    subject: 'Congratulations! You have cleared the test of TIP1 training ', // Subject line
                                    //text: 'dsad', // plain text body
                                    html: '<b>Dear ' + name + ',</b>' + '</br></br>' + "<p style='font-size: 16px;font-family: sans-serif;line-height: 28px;'> We are pleased to announce that you have cleared the Video test of the Trainer-in-process (TIP) 1.</p> <div style='background-color: #fff9e9;padding: 20px 40px 20px 40px;border-left: 3px solid #fee596;'> <h4 style='text-align: left;font-family: sans-serif;font-weight: 500;font-size: 17px;'>Ms Romshri Ashesh has assessed your video. she is the Founder of the Self-Empowerment program in Galway Foundation Message from Ms Romshri Ashesh:</h4><p style='text-align: justify;line-height: 26px;font-family: sans-serif;font-size: 14px;'>You have to perform TIP 2 to become Certified Trainer of Basic SEP Training.Go to <a href='www.galwayfoundation.org' style='background-color: #ec8675;color: white;text-decoration: none;padding: 2px 8px;'> www.galwayfoundation.org</a> or contact your trainer to know more.</p></div> <p style='font-family: sans-serif;text-align: center;font-size: 15px;line-height: 24px;color: #424141;'><span style='color: white;background-color: #45bb4a;padding: 6px 12px;line-height: 55px;border-radius: 4px;'> We once again welcome you to SEP Trainer Family.</span><br />Love & Light,SEP Team<br />Galway Foundation</p>",  // html body
                                    //html:BST_pass.html,
                                };
                                transporter.sendMail(mailOptions, (error, info) => {
                                    if (error) {
                                        return console.log(error);
                                    }

                                });

                            } else {
                                let mailOptions = {
                                    from: 'info.sep@glazegalway.com', // sender address
                                    to: email, // list of receivers
                                    subject: 'You have not cleared the test of TIP 1', // Subject line
                                    //text: 'dsad', // plain text body
                                    html: '<b>Dear ' + name + ',</b>' + '</br></br>' + "<p style='font-size: 16px;font-family: sans-serif;line-height: 28px;'>We regret to announce that you have not cleared the Video test of the Trainer-in-process (TIP) 1.</p> <div style='background-color: #fff9e9;padding: 20px 40px 20px 40px;border-left: 3px solid #fee596;'> <h4 style='text-align: left;font-family: sans-serif;font-weight: 500;font-size: 17px;'>Ms Romshri Ashesh has assessed your video. she is the Founder of the Self-Empowerment program in Galway Foundation Message from Ms Romshri Ashesh:</h4><p style='text-align: justify;line-height: 26px;font-family: sans-serif;font-size: 14px;'>You have to attend the basic SEP training once again to become Certified Trainer of Basic SEP Training.Go to <a href='www.galwayfoundation.org' style='background-color: #ec8675;color: white;text-decoration: none;padding: 2px 8px;'> www.galwayfoundation.org</a> or contact your trainer to know more.</p></div> <p style='font-family: sans-serif;text-align: center;font-size: 15px;line-height: 24px;color: #424141;'><span style='color: white;background-color: #45bb4a;padding: 6px 12px;line-height: 55px;border-radius: 4px;'> We once again welcome you to SEP Trainer Family.</span><br />Love & Light,SEP Team<br />Galway Foundation</p>",  // html body
                                    //html:BST_pass.html,
                                };
                                transporter.sendMail(mailOptions, (error, info) => {
                                    if (error) {
                                        // console.log(error);
                                    }

                                });
                            }
                        }
                        res.send([{ status: 1, msg: 'Data Saved Successfully' }]);
                    });


                }
            });
        }
    });
});

app.get('/TIP2_exam_list', verifyToken, function (req, res) {
    jwt.verify(req.token, 'SuperSecRetKey', (err, authData) => {
        if (err) {
            res.send([{ status: 0, msg: err }]);
        } else {
            var TIP2_exam_list = function () {
                return new Promise(function (resolve, reject) {
                    db.query("SELECT * ,case when training_type=1 then concat('BST/',batch_id) when training_type=2 then concat('TT/',batch_id) when training_type=3 then concat('MTT/',batch_id) end as batch_code FROM `tbl_batch_attendance` where attendance=1 and training_type=1 and count=1 and type='Trainer In process 1' ", function (error, result) {
                        if (result.length == 0) {
                            reject(error);
                        } else { resolve(result); }
                    });
                });
            }

            TIP2_exam_list().then(function (rows) {
                res.send([{ status: 1, TIP2_exam_list: rows }]);
            }).catch(function (err) {
                res.send([{ status: 0, TIP2_exam_list: 'No result found' }]);
            });
        }
    });
});

app.post('/tip2_training_exam', verifyToken, (req, res) => {
    jwt.verify(req.token, 'SuperSecRetKey', (err, authData) => {
        if (err) {
            res.send([{ status: 0, msg: err }]);
        } else {
            var jsondata = req.body;
            var values = [];
            for (var i = 0; i < jsondata['address'].length; i++) {
                values.push([jsondata['address'][i].batch_id,
                jsondata['address'][i].name,
                jsondata['address'][i].email,
                jsondata['address'][i].mobile,
                jsondata['address'][i].status,
                jsondata['address'][i].remarks]);

                var status = jsondata['address'][i].status;
                var mobile = jsondata['address'][i].mobile;
                if (status == 0) {
                    db.query('delete from tbl_master_trainer where mobile=?', [mobile], function (err, result) {
                        db.query('UPDATE `tbl_batch_attendance` SET count=0 where mobile = ?', mobile, function (err, data) {
                            request.get({ url: "http://nimbusit.co.in/api/swsendSingle.asp?username=t1globalapi&password=glaze_123&sender=GALWAY&sendto=" + mobile + "&message=You have not cleared the test of TIP 2, you have to attend the basic SEP training once again. Go to  www.galwayfoundation.org to know more" }, mobile, function (error, response, body) {
                            });
                        });
                    });
                } else if (status == 1) {
                    var tip = 'Trainer In process 2';
                    var trainer_id = 'BST';
                    db.query('UPDATE `tbl_batch_attendance` SET count=2 where mobile = ?', mobile, function (err, data) {
                        db.query('update tbl_master_trainer set trainer_type_name=?,trainer_id=? where mobile=?', [tip, trainer_id, mobile], function (err, result) {
                            request.get({ url: "http://nimbusit.co.in/api/swsendSingle.asp?username=t1globalapi&password=glaze_123&sender=GALWAY&sendto=" + mobile + "&message=Congrats! You have cleared the test of TIP-2, You are now Certified Trainer of basic SEP Training. Go to  www.galwayfoundation.org to know more" }, mobile, function (error, response, body) {
                            });
                        });
                    });
                }
            }
            db.query('insert into tip2_training_exam (batch_id, name,email,mobile,status,remarks) VALUES  ?', [values], function (err, result) {
                if (err) {
                    res.send([{ status: 0, msg: err }]);
                } else {
                    db.query('SELECT distinct * FROM tip2_training_exam', function (err, data) {
                        for (var i = 0; i < data.length; i++) {
                            var status = data[i].status;
                            var mobile = data[i].mobile;
                            var name = data[i].name;
                            var email = data[i].email;
                            if (status == 1) {
                                var smtpConfig = {
                                    host: 'smtp.gmail.com',
                                    port: 465,
                                    secure: true, // use SSL
                                    auth: {
                                        user: 'info.sep@glazegalway.com',
                                        pass: 'mind.soul@123'
                                    }
                                };
                                var transporter = nodemailer.createTransport(smtpConfig);
                                let mailOptions = {
                                    from: 'info.sep@glazegalway.com', // sender address
                                    to: email, // list of receivers
                                    subject: 'Congratulations! You have cleared the test of TIP-2 training ', // Subject line
                                    //text: 'dsad', // plain text body
                                    html: '<b>Dear ' + name + ',</b>' + '</br></br>' + "<p style='font-size: 16px;font-family: sans-serif;line-height: 28px;'>We are pleased to announce that you have cleared the Video test of the Trainer-in-process-2 (TIP-2).</p> <div style='background-color: #fff9e9;padding: 20px 40px 20px 40px;border-left: 3px solid #fee596;'> <h4 style='text-align: left;font-family: sans-serif;font-weight: 500;font-size: 17px;'>Ms Romshri Ashesh has assessed your video. she is the Founder of the Self-Empowerment program in Galway Foundation Message from Ms Romshri Ashesh:</h4><p style='text-align: justify;line-height: 26px;font-family: sans-serif;font-size: 14px;'>You are now Certified Trainer of Basic SEP Training.Go to <a href='www.galwayfoundation.org' style='background-color: #ec8675;color: white;text-decoration: none;padding: 2px 8px;'> www.galwayfoundation.org</a> or contact your trainer to know more.</p></div> <p style='font-family: sans-serif;text-align: center;font-size: 15px;line-height: 24px;color: #424141;'><span style='color: white;background-color: #45bb4a;padding: 6px 12px;line-height: 55px;border-radius: 4px;'> We once again welcome you to SEP Trainer Family.</span><br />Love & Light,SEP Team<br />Galway Foundation</p>",  // html body
                                    //html:BST_pass.html,
                                };
                                transporter.sendMail(mailOptions, (error, info) => {
                                    if (error) {
                                        console.log(error);
                                    }

                                });

                            } else {
                                let mailOptions = {
                                    from: 'info.sep@glazegalway.com', // sender address
                                    to: email, // list of receivers
                                    subject: 'You have not cleared the test of TIP 2', // Subject line
                                    //text: 'dsad', // plain text body
                                    html: '<b>Dear ' + name + ',</b>' + '</br></br>' + "<p style='font-size: 16px;font-family: sans-serif;line-height: 28px;'>We regret to announce that you have not cleared the Video test of the Trainer-in-process-2 (TIP-2).</p> <div style='background-color: #fff9e9;padding: 20px 40px 20px 40px;border-left: 3px solid #fee596;'> <h4 style='text-align: left;font-family: sans-serif;font-weight: 500;font-size: 17px;'>Ms Romshri Ashesh has assessed your video. she is the Founder of the Self-Empowerment program in Galway Foundation Message from Ms Romshri Ashesh:</h4><p style='text-align: justify;line-height: 26px;font-family: sans-serif;font-size: 14px;'>You have to attend the basic SEP training once again to become Certified Trainer of Basic SEP Training.Go to <a href='www.galwayfoundation.org' style='background-color: #ec8675;color: white;text-decoration: none;padding: 2px 8px;'> www.galwayfoundation.org</a> or contact your trainer to know more.</p></div> <p style='font-family: sans-serif;text-align: center;font-size: 15px;line-height: 24px;color: #424141;'><span style='color: white;background-color: #45bb4a;padding: 6px 12px;line-height: 55px;border-radius: 4px;'> We once again welcome you to SEP Trainer Family.</span><br />Love & Light,SEP Team<br />Galway Foundation</p>",  // html body
                                    //html:BST_pass.html,
                                };
                                transporter.sendMail(mailOptions, (error, info) => {
                                    if (error) {
                                        return console.log(error);
                                    }

                                });
                            }
                        }
                    });
                    res.send([{ status: 1, msg: 'Data Saved Successfully' }]);

                }
            });
        }
    });
});

app.get('/MIP1_exam_list', verifyToken, function (req, res) {
    jwt.verify(req.token, 'SuperSecRetKey', (err, authData) => {
        if (err) {
            res.send([{ status: 0, msg: err }]);
        } else {
            var trainer = function () {
                return new Promise(function (resolve, reject) {
                    db.query("SELECT *,case when training_type=1 then concat('BST/',batch_id) when training_type=2 then concat('TT/',batch_id) when training_type=3 then concat('MTT/',batch_id) end as batch_code FROM tbl_batch_attendance AS a, tbl_batch_attendance AS b WHERE a.mobile = b.mobile and a.type='Certified Trainer' and a.training_type=1 and a.attendance=1 and b.type=1 and b.training_type=2 and b.attendance=1 GROUP by a.mobile HAVING count(a.mobile) >=10", function (error, result) {
                        if (result.length == 0) {
                            reject(error);
                        } else {
                            for (var i = 0; i < result.length; i++) {
                                var tip = 'Master In process 1'
                                var trainer_id = 'TT';
                                var mobile = result[i].mobile;
                                db.query('update tbl_master_trainer set trainer_type_name=?,trainer_id=? where mobile=?', [tip, trainer_id, mobile], function (err, data) {
                                    resolve(result);
                                });
                            }
                        }
                    });
                });
            }
            var MIP1_list = function () {
                return new Promise(function (resolve, reject) {
                    db.query("SELECT *,case when training_type=1 then concat('BST/',batch_id) when training_type=2 then concat('TT/',batch_id) when training_type=3 then concat('MTT/',batch_id) end as batch_code FROM `tbl_batch_attendance` where training_type=2 and attendance=1 and count=1 and type='Master In process 1' ", function (error, result) {
                        if (result.length == 0) {
                            reject(error);
                        } else { resolve(result); }
                    });
                });
            }
            MIP1_list().then(function (data) {
                res.send([{ status: 1, MIP1_list: data }]);
            }).catch(function (err) {
                res.send([{ status: 0, MIP1_list: 'No result found' }]);
            });
        }
    });
});

app.post('/MIP1_training_exam', verifyToken, (req, res) => {
    jwt.verify(req.token, 'SuperSecRetKey', (err, authData) => {
        if (err) {
            res.send([{ status: 0, msg: err }]);
        } else {
            var jsondata = req.body;
            var values = [];
            for (var i = 0; i < jsondata['address'].length; i++) {
                values.push([
                    jsondata['address'][i].batch_id,
                    jsondata['address'][i].name,
                    jsondata['address'][i].email,
                    jsondata['address'][i].mobile,
                    jsondata['address'][i].status,
                    jsondata['address'][i].remarks]);

                var status = jsondata['address'][i].status;
                var mobile = jsondata['address'][i].mobile;
                if (status == 0) {
                    var fail = 'Certified Trainer';
                    db.query('update tbl_master_trainer set trainer_type_name=? where mobile=?', [fail, mobile], function (err, result) {
                        db.query('UPDATE `tbl_batch_attendance` SET count=0 where mobile = ?', mobile, function (err, data) {
                            request.get({ url: "http://nimbusit.co.in/api/swsendSingle.asp?username=t1globalapi&password=glaze_123&sender=GALWAY&sendto=" + mobile + "&message=You have not cleared the test of MIP 1, you have to attend the Master trainer's training once again. Go to  www.galwayfoundation.org to know more" }, mobile, function (error, response, body) {
                            });
                        });
                    });
                } else if (status == 1) {
                    var tip = 'Master In process 2';
                    var trainer_id = 'TT';
                    db.query('UPDATE `tbl_batch_attendance` SET count=2 where mobile = ?', mobile, function (err, data) {

                        db.query('update tbl_master_trainer set trainer_type_name=?,trainer_id=? where mobile=?', [tip, trainer_id, mobile], function (err, result) {
                            request.get({ url: "http://nimbusit.co.in/api/swsendSingle.asp?username=t1globalapi&password=glaze_123&sender=GALWAY&sendto=" + mobile + "&message=Congratulations! You have cleared the test of MIP 1, now you may perform MIP2. Go to  www.galwayfoundation.org to know more" }, mobile, function (error, response, body) {
                            });
                        });
                    });
                }
            }
            db.query('insert into mip1_training_exam (batch_id, name,email,mobile,status,remarks) VALUES  ?', [values], function (err, result) {
                if (err) {
                    res.send([{ status: 0, msg: err }]);
                } else {
                    db.query('SELECT distinct * FROM mip1_training_exam', function (err, data) {
                        for (var i = 0; i < data.length; i++) {
                            var status = data[i].status;
                            var mobile = data[i].mobile;
                            var name = data[i].name;
                            var email = data[i].email;
                            if (status == 1) {
                                var smtpConfig = {
                                    host: 'smtp.gmail.com',
                                    port: 465,
                                    secure: true, // use SSL
                                    auth: {
                                        user: 'info.sep@glazegalway.com',
                                        pass: 'mind.soul@123'
                                    }
                                };
                                var transporter = nodemailer.createTransport(smtpConfig);
                                let mailOptions = {
                                    from: 'info.sep@glazegalway.com', // sender address
                                    to: email, // list of receivers
                                    subject: 'Congratulations! You have cleared the test of MIP-1 training ', // Subject line
                                    //text: 'dsad', // plain text body
                                    html: '<b>Dear ' + name + ',</b>' + '</br></br>' + "<p style='font-size: 16px;font-family: sans-serif;line-height: 28px;'>We are pleased to announce that you have cleared the Video test of the Master Trainer-in-process (MIP) 1.</p> <div style='background-color: #fff9e9;padding: 20px 40px 20px 40px;border-left: 3px solid #fee596;'> <h4 style='text-align: left;font-family: sans-serif;font-weight: 500;font-size: 17px;'>Ms Romshri Ashesh has assessed your video. she is the Founder of the Self-Empowerment program in Galway Foundation Message from Ms Romshri Ashesh:</h4><p style='text-align: justify;line-height: 26px;font-family: sans-serif;font-size: 14px;'>You have to perform MIP 2 to become Certified Trainer of SEP Trainer’s Training.Go to <a href='www.galwayfoundation.org' style='background-color: #ec8675;color: white;text-decoration: none;padding: 2px 8px;'> www.galwayfoundation.org</a> or contact your trainer to know more.</p></div> <p style='font-family: sans-serif;text-align: center;font-size: 15px;line-height: 24px;color: #424141;'><span style='color: white;background-color: #45bb4a;padding: 6px 12px;line-height: 55px;border-radius: 4px;'> We once again welcome you to SEP Trainer Family.</span><br />Love & Light,SEP Team<br />Galway Foundation</p>",  // html body
                                    //html:BST_pass.html,
                                };
                                transporter.sendMail(mailOptions, (error, info) => {
                                    if (error) {
                                        return console.log(error);
                                    }

                                });
                            } else {
                                let mailOptions = {
                                    from: 'info.sep@glazegalway.com', // sender address
                                    to: email, // list of receivers
                                    subject: 'You have not cleared the test of MIP 1', // Subject line
                                    //text: 'dsad', // plain text body
                                    html: '<b>Dear ' + name + ',</b>' + '</br></br>' + "<p style='font-size: 16px;font-family: sans-serif;line-height: 28px;'>We regret to announce that you have not cleared the Video test of the Master Trainer-in-process (MIP) 1.</p> <div style='background-color: #fff9e9;padding: 20px 40px 20px 40px;border-left: 3px solid #fee596;'> <h4 style='text-align: left;font-family: sans-serif;font-weight: 500;font-size: 17px;'>Ms Romshri Ashesh has assessed your video. she is the Founder of the Self-Empowerment program in Galway Foundation Message from Ms Romshri Ashesh:</h4><p style='text-align: justify;line-height: 26px;font-family: sans-serif;font-size: 14px;'>You have to attend the Master Trainer’s training once again to become Certified Master Trainer.Go to <a href='www.galwayfoundation.org' style='background-color: #ec8675;color: white;text-decoration: none;padding: 2px 8px;'> www.galwayfoundation.org</a> or contact your trainer to know more.</p></div> <p style='font-family: sans-serif;text-align: center;font-size: 15px;line-height: 24px;color: #424141;'><span style='color: white;background-color: #45bb4a;padding: 6px 12px;line-height: 55px;border-radius: 4px;'> We once again welcome you to SEP Trainer Family.</span><br />Love & Light,SEP Team<br />Galway Foundation</p>",  // html body
                                    //html:BST_pass.html,
                                };
                                transporter.sendMail(mailOptions, (error, info) => {
                                    if (error) {
                                        return console.log(error);
                                    }

                                });
                            }
                        }
                    });

                    res.send([{ status: 1, msg: 'Data Saved Successfully' }]);
                }
            });
        }
    });
});

app.get('/MIP2_exam_list', verifyToken, function (req, res) {
    jwt.verify(req.token, 'SuperSecRetKey', (err, authData) => {
        if (err) {
            res.send([{ status: 0, msg: err }]);
        } else {
            var MIP2_exam_list = function () {
                return new Promise(function (resolve, reject) {
                    db.query("SELECT *,case when training_type=1 then concat('BST/',batch_id) when training_type=2 then concat('TT/',batch_id) when training_type=3 then concat('MTT/',batch_id) end as batch_code FROM `tbl_batch_attendance` where attendance=1 and count=1 and training_type=2 and type='Master In process 2'", function (error, result) {
                        if (result.length == 0) {
                            reject(error);
                        } else { resolve(result); }
                    });
                });
            }

            MIP2_exam_list().then(function (rows) {
                res.send([{ status: 1, MIP2_exam_list: rows }]);
            }).catch(function (err) {
                res.send([{ status: 0, MIP2_exam_list: 'No result found' }]);
            });
        }
    });
});

app.post('/MIP2_training_exam', verifyToken, (req, res) => {
    jwt.verify(req.token, 'SuperSecRetKey', (err, authData) => {
        if (err) {
            res.send([{ status: 0, msg: err }]);
        } else {
            var jsondata = req.body;
            var values = [];
            for (var i = 0; i < jsondata['address'].length; i++) {
                values.push([
                    jsondata['address'][i].batch_id,
                    jsondata['address'][i].name,
                    jsondata['address'][i].email,
                    jsondata['address'][i].mobile,
                    jsondata['address'][i].status,
                    jsondata['address'][i].remarks]);

                var status = jsondata['address'][i].status;
                var mobile = jsondata['address'][i].mobile;
                if (status == 0) {
                    var fail = 'Certified Trainer';
                    db.query('update tbl_master_trainer set trainer_type_name=? where mobile=?', [fail, mobile], function (err, result) {
                        db.query('UPDATE `tbl_batch_attendance` SET count=0 where mobile = ?', mobile, function (err, data) {
                            request.get({ url: "http://nimbusit.co.in/api/swsendSingle.asp?username=t1globalapi&password=glaze_123&sender=GALWAY&sendto=" + mobile + "&message=You have not cleared the test of MIP 2, you have to attend the Master trainer's training once again. Go to  www.galwayfoundation.org to know more" }, mobile, function (error, response, body) {
                            });
                        });
                    });
                } else if (status == 1) {
                    var tip = 'Certified Master Trainer';
                    var trainer_code = 'TT';
                    db.query('update tbl_master_trainer set trainer_type_name=?,trainer_id=? where mobile=?', [tip, trainer_code, mobile], function (err, result) {

                        db.query('UPDATE `tbl_batch_attendance` SET count=2 where mobile = ?', mobile, function (err, data) {

                            request.get({ url: "http://nimbusit.co.in/api/swsendSingle.asp?username=t1globalapi&password=glaze_123&sender=GALWAY&sendto=" + mobile + "&message=Congrats! You have cleared the test of MIP-2, You are now Certified Master Trainer. Go to  www.galwayfoundation.org to know more" }, mobile, function (error, response, body) {
                            });
                        });
                    });
                }
            }
            db.query('insert into mip2_training_exam (batch_id, name,email,mobile,status,remarks) VALUES  ?', [values], function (err, result) {
                if (err) {
                    res.send([{ status: 0, msg: err }]);
                } else {
                    db.query('SELECT distinct * FROM mip2_training_exam', function (err, data) {
                        for (var i = 0; i < data.length; i++) {
                            var status = data[i].status;
                            var mobile = data[i].mobile;
                            var name = data[i].name;
                            var email = data[i].email;

                            if (status == 1) {
                                var smtpConfig = {
                                    host: 'smtp.gmail.com',
                                    port: 465,
                                    secure: true, // use SSL
                                    auth: {
                                        user: 'info.sep@glazegalway.com',
                                        pass: 'mind.soul@123'
                                    }
                                };
                                var transporter = nodemailer.createTransport(smtpConfig);
                                let mailOptions = {
                                    from: 'info.sep@glazegalway.com', // sender address
                                    to: email, // list of receivers
                                    subject: 'Congratulations! You have cleared the test of MIP-2 training ', // Subject line
                                    //text: 'dsad', // plain text body
                                    html: '<b>Dear ' + name + ',</b>' + '</br></br>' + "<p style='font-size: 16px;font-family: sans-serif;line-height: 28px;'>We are pleased to announce that you have cleared the Video test of the Master Trainer-in-process-2 (MIP-2).</p> <div style='background-color: #fff9e9;padding: 20px 40px 20px 40px;border-left: 3px solid #fee596;'> <h4 style='text-align: left;font-family: sans-serif;font-weight: 500;font-size: 17px;'>Ms Romshri Ashesh has assessed your video. she is the Founder of the Self-Empowerment program in Galway Foundation Message from Ms Romshri Ashesh:</h4><p style='text-align: justify;line-height: 26px;font-family: sans-serif;font-size: 14px;'>You are now Certified Master Trainer of SEP Trainer’s Training.Go to <a href='www.galwayfoundation.org' style='background-color: #ec8675;color: white;text-decoration: none;padding: 2px 8px;'> www.galwayfoundation.org</a> or contact your trainer to know more.</p></div> <p style='font-family: sans-serif;text-align: center;font-size: 15px;line-height: 24px;color: #424141;'><span style='color: white;background-color: #45bb4a;padding: 6px 12px;line-height: 55px;border-radius: 4px;'> We once again welcome you to SEP Trainer Family.</span><br />Love & Light,SEP Team<br />Galway Foundation</p>",  // html body
                                    //html:BST_pass.html,
                                };
                                transporter.sendMail(mailOptions, (error, info) => {
                                    if (error) {
                                        return console.log(error);
                                    }
                                });

                            } else {
                                let mailOptions = {
                                    from: 'info.sep@glazegalway.com', // sender address
                                    to: email, // list of receivers
                                    subject: 'You have not cleared the test of MIP 2', // Subject line
                                    //text: 'dsad', // plain text body
                                    html: '<b>Dear ' + name + ',</b>' + '</br></br>' + "<p style='font-size: 16px;font-family: sans-serif;line-height: 28px;'>We regret to announce that you have not cleared the Video test of the Master Trainer-in-process-2 (MIP-2).</p> <div style='background-color: #fff9e9;padding: 20px 40px 20px 40px;border-left: 3px solid #fee596;'> <h4 style='text-align: left;font-family: sans-serif;font-weight: 500;font-size: 17px;'>Ms Romshri Ashesh has assessed your video. she is the Founder of the Self-Empowerment program in Galway Foundation Message from Ms Romshri Ashesh:</h4><p style='text-align: justify;line-height: 26px;font-family: sans-serif;font-size: 14px;'>You have to attend MTT once again to become Certified Master Trainer.Go to <a href='www.galwayfoundation.org' style='background-color: #ec8675;color: white;text-decoration: none;padding: 2px 8px;'> www.galwayfoundation.org</a> or contact your trainer to know more.</p></div> <p style='font-family: sans-serif;text-align: center;font-size: 15px;line-height: 24px;color: #424141;'><span style='color: white;background-color: #45bb4a;padding: 6px 12px;line-height: 55px;border-radius: 4px;'> We once again welcome you to SEP Trainer Family.</span><br />Love & Light,SEP Team<br />Galway Foundation</p>",  // html body
                                    //html:BST_pass.html,
                                };
                                transporter.sendMail(mailOptions, (error, info) => {
                                    if (error) {
                                        return console.log(error);
                                    }

                                });
                            }
                        }
                    });

                    res.send([{ status: 1, msg: 'Data Saved Successfully' }]);
                }
            });
        }
    });
});

module.exports = app;