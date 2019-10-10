
/* -----------------Created by Ashish Singla------------------------*/

const express = require('express'),
  app = express(),
  bodyParser = require('body-parser');
// app.set('port',(process.env.port || 80));
PORT = process.env.PORT || 2222;
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
var expressValidator = require('express-validator');  // validation library
app.use(expressValidator());  //this line to be addded
var path = require('path');
url = require('url');
const exphbs = require('express-handlebars');

// var apps =app.use(express.static(__dirname + 'public'));

//show image in browser or specific path given
var publicDir = require('path').join(__dirname, '/public');
app.use(express.static(publicDir));

// var logger = require("./logger");
// app.set('logger',logger) ;

// app.use(require('morgan')());

app.engine('handlebars', exphbs());
app.set('view engine', 'handlebars');
// Add headers
app.use(function (req, res, next) {       // add headers

  // Website you wish to allow to connect
  res.header("Access-Control-Allow-Origin", "*");

  // Request methods you wish to allow
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

  // Request headers you wish to allow
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  res.header('Access-Control-Allow-Headers', 'Content-Type,Authorization');

  // Set to true if you need the website to include cookies in the requests sent
  // to the API (e.g. in case you use sessions)
  res.setHeader('Access-Control-Allow-Credentials', true);

  // Pass to next layer of middleware
  next();
});

// app.get('/', (req, res) => res.send('404 Not Found'));

app.get('/', function (req, res, next) {
  try {
    //get the data
    res.status(200).json(data);
  } catch (error) {
    next(error);
  }
});
app.use(function (err, req, res, next) {
  //TODO implement error log (e.g. WINSTON)
  res.json({ "status": err.status, "data": err.data, "message": err.message });
});

// create log error file using morgan library 
var logger = require('morgan');
var fs = require('fs');
app.use(logger('common', {
  stream: fs.createWriteStream('./log/log.log', { flags: 'a' })
}));
//app.use(logger('dev'));

// app.listen(app.get('port'),function(){
//   console.log('Server listening on port',app.get('port'))
// });

app.listen(PORT, "192.168.30.127", function () {
  console.log("Server listening on port:%s", PORT);
});

var routes = require('./routes/approute'); //importing route
routes(app); //register the route

var router = express.Router();
app.use('/', router);

var master = require('./controller/masterController');
var renewal = require('./controller/renewal');
var batch = require('./controller/batch');
var reports = require('./controller/reports');
var exam = require('./controller/exam');
var dashboard = require('./controller/dashboard');

router.post('/training_type_master', master);  //add training type master
router.get('/list_training_type_master', master); //get training type master
router.post('/update_training_type_master/:id', master); //update training type master
router.delete('/delete_training_type_master/:id', master); //delete training type master

router.post('/trainer_type_master', master);  //add trainer type master
router.get('/list_trainer_type_master', master); //get trainer type master
router.post('/update_trainer_type_master/:id', master); //update trainer type master
router.delete('/delete_trainer_type_master/:id', master); //delete trainer type master

router.post('/trainer_master', master);  //add trainer master
router.get('/list_trainer_master', master); //get trainer master
router.post('/update_trainer_master/:id', master); //update trainer master
router.delete('/delete_trainer_master/:id', master); //delete trainer type master
router.get('/trainer_list', master);

router.post('/venue_code_master', master);  //add Venue Code master
router.get('/list_venue_code_master', master); //get venue code master
router.post('/update_venue_code_master/:id', master); //update venue code master
router.delete('/delete_venue_code_master/:id', master); //delete trainer type master

router.post('/venue_master', master);  //add Venue master
router.get('/list_venue_master', master); //get venue master
router.post('/update_venue_master/:id', master); //update venue master
router.delete('/delete_venue_master/:id', master); //delete venue master

router.post('/feedback_question', master);  //add feedback question master
router.get('/list_feedback_question', master); //list feedback question master
router.post('/update_feedback_question/:id', master); //update feedback question master
router.delete('/delete_feedback_question/:id', master); //delete feedback question master

router.get('/states', master); //states
router.get('/state_wise_district/:id', master); //states wise district

router.get('/list_trainer_activation', renewal); // get trainer activation
router.put('/update_trainer_activation/:id', renewal); //update trainer activation


router.post('/create_batch', batch);  //create batch
router.get('/list_batch_trainer', batch); // trainer list
router.post('/update_batch/:id', batch); // update batch
router.get('/batch_list/:id', batch); // batch list
router.post('/training_register', batch);  //create training register
router.get('/get_batch/:id', batch); // get batch
router.get('/get_batch_date/:id', batch); // get branch date
router.get('/attendance_list/:id', batch); // get attendance list
router.post('/create_attendance', batch);  //create attendance
router.get('/batch_list_trainer_wise/:id/:training_id', batch);  //batch list by id
router.post('/upload/:id', batch);  //file upload for attendance
router.get('/batch_id_list', batch); // batch list without token
router.post('/update_status/:id', batch);  //update_status
router.get('/phone_number_wise_list/:id', batch); // phone_number_wise_list
router.post('/group_link/:id', batch); 

router.post('/checklist_upload/:id', reports);  //checklist file upload for attendance
router.get('/batch_report_list', reports);      //batch report list
router.get('/batch_report/:start_date/:end_date', reports);   // btch report list with start and end date
router.get('/batch_report_detail_list/:id', reports);   // batch report detail list with batch batch id
router.get('/register_report_list', reports);     //register report list
router.get('/register_report/:start_date/:end_date', reports);  //register report with start and end date
router.get('/register_report_detail_list/:mobile', reports);   // register report detail list with batch batch id
router.get('/applicant_life_cycle_report/:id', reports);    //applicant life cycle report with mobile number
router.get('/examination_report/:start_date/:end_date', reports); //examination report with start and end date
router.get('/trainer_training_report_list', reports);   //list of trainer training report
router.get('/examination_report_list', reports);        //examination report list
router.get('/trainer_training_report/:start_date/:end_date', reports);    //list of trainer training report with start and end date
router.get('/trainer_training_report_list_detail/:mobile', reports);

router.get('/basic_training_exam_list', exam);   //get basic training exam list 
router.post('/exam_result_bst', exam);          //insert basic training
router.get('/TIP1_exam_list', exam);  // list tip1 
router.post('/tip1_training_exam', exam);   //add tip1 training exam
router.get('/TIP2_exam_list', exam);  //tip2 exam list
router.post('/tip2_training_exam', exam);
router.get('/MIP1_exam_list', exam);
router.post('/MIP1_training_exam', exam);
router.get('/MIP2_exam_list', exam);
router.post('/MIP2_training_exam', exam);

router.get('/dashboard', dashboard);
router.get('/dashboard_graph/:id', dashboard);  
router.get('/logout', dashboard);   //check whether user loggedin or not
router.post('/post', batch);  
router.get('/module_list', dashboard);   // module list for profiling
router.get('/module_wise_trainer_list/:id', dashboard); //module list wise id for profiling
