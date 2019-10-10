var sql = require('./db');
var md5 = require('md5');

//object constructor
var Register = function(register){
    this.name = register.name;
    this.email = register.email;
    this.mobile = register.mobile;
    this.password = md5(register.password);
    this.roleid = register.roleid;
    this.company_code = register.company_code;
};

Register.Createuser = function Createuser(newTask,result){
    sql.query("INSERT INTO tbl_users set ?", newTask, function (err, res) {
        if(err){
            result(err, null);
        }else{
            result(null, res.insertId);
        }
    });
};

Register.exists = function exists(phone,result){
    sql.query("select * from tbl_users where mobile = ?",phone,function(err,data){
        if(err){
            result(err, null);
        }else{
            result(null, data);
        }
    });
};



module.exports= Register;
