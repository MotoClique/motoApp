//Switch flag for Production DB / Testing DB
var prodEnvFlag = true;

//
var port = process.env.PORT || process.env.OPENSHIFT_NODEJS_PORT || 8080,
    ip   = process.env.IP   || process.env.OPENSHIFT_NODEJS_IP || '0.0.0.0';

//importing modules

var express = require('express'),
app     = express(),
morgan  = require('morgan');

Object.assign=require('object-assign')

app.engine('html', require('ejs').renderFile);
app.use(morgan('combined'));


// BRING IN YOUR SCHEMAS & MODELS
//admin schemas
require('./models/users');
require('./models/profile');
require('./models/subscription');
require('./models/spec_fields');
require('./models/screens');
require('./models/role');
require('./models/product_type');
require('./models/product_thumbnail');
require('./models/product_spec');
require('./models/product_image');
require('./models/product_hierarchy');
require('./models/product');
require('./models/prd_typ_spec_field_map');
require('./models/otp');
require('./models/fields');
require('./models/brand');
require('./models/application');
require('./models/app_scr_fields_rights');
require('./models/country_state_city_loc');
require('./models/parameter');
require('./models/device_reg');
require('./models/placeOfReg');

//endusers schemas
require('./models/enduser/bid');
require('./models/enduser/bid_by');
require('./models/enduser/buy_request');
require('./models/enduser/favourite');
require('./models/enduser/filter');
require('./models/enduser/images');
require('./models/enduser/sell');
require('./models/enduser/thumbnails');
require('./models/enduser/user_address');
require('./models/enduser/user_alert');
require('./models/enduser/user_sub_map');
require('./models/enduser/service');
require('./models/enduser/feedback');
require('./models/enduser/rating');
require('./models/enduser/thumbs_up');
require('./models/enduser/thumbs_down');
require('./models/enduser/counter');
require('./models/enduser/chat_inbox');
require('./models/enduser/chat_details');
require('./models/enduser/payment_txn_log');

var mongoose = require('mongoose');
var passport = require('passport');
const route = require('./route');
require('./config/passport');

var bodyparser = require('body-parser');
var cors = require('cors');
var path = require('path');

app.use(cors());
app.use(bodyparser.json({limit: '50mb'}));
app.use(bodyparser.urlencoded({limit: '50mb', extended: true}));

app.use(express.static(path.join(__dirname, 'views')));

app.use(passport.initialize());
app.use('/api',route);

var googleMailAPI = require('./gmail');

// MongoDB Connection
  var prdDBUrl = "mongodb://motoadmin:Moto1234@ds217002.mlab.com:17002/motodb";
  var testDBUrl = "mongodb://meanadmin:Moto1234@ds235302.mlab.com:35302/meandb";
  var mongoURL = (prodEnvFlag)?prdDBUrl:testDBUrl;
  
  var mongodb = require('mongodb');
  
  mongoose.connect(mongoURL).then(
  (res) => { console.log(res); /*googleMailAPI.init();*/ },
  (err) => { console.log(err); }
);

//Cron Job
var job_schedule = require('./schedule');
job_schedule.scheduleBidClosedCheckJob();

app.get('/', function (req, res) {
  res.render('index.html', { pageCountMessage : null});
});




app.get('*', function (req, res) {
	  res.render('index.html', { pageCountMessage : null});
});


// error handling
app.use(function(err, req, res, next){
  console.error(err.stack);
  res.status(500).send('Something bad happened!');
});

//app.listen(3000, () => console.log('your app is listening on port 3000!'))
app.listen(port, ip);
console.log('Server running on http://%s:%s', ip, port);
console.log('server started:'+port);

module.exports = app ;
