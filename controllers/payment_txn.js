const async = require("async");
const request = require('request');
var mongoose = require('mongoose');
const checksum_lib = require('../checksum/checksum.js');
const https = require('https');
var userSubMap = require('./subscription');
var Parameter = mongoose.model('Parameter');
var ctrlGlobalVar = require('../globalVar');
var prd_env = false;

module.exports.success_html = function(){
var html = '<html>'+
'<head></head> '+
'<body style=""> '+
'<div style="width:100%; height:100%; display:flex; flex-direction: column; justify-content:center; align-items:center;"> '+
'<div style="width: 110px; text-align: center; border: 2px solid #E71B03; border-radius: 60px; line-height: 110px;">'+
'	<span style="font-size:60px; color:#E71B03;">&#10004;</span>'+
'</div>'+
'<div style="font-size:20px; color:#E71B03;">Transaction Successful!</div>'+
'</div>	 '+
'<script>'+
' setTimeout(function(){ '+
	'if(window.cordova) '+
		'window.location.replace("file:///android_asset/www/index.html"); '+
	'else '+
		'window.location.replace("'+ctrlGlobalVar.getGlobalVariable("hostname")+'"); '+
'},6000); '+		
'</script>'+
'</body> '+
'</html>';
	return html;
};

module.exports.pending_html = function(){
var html = '<html>'+
'<head></head> '+
'<body style=""> '+
'<div style="width:100%; height:100%; display:flex; flex-direction: column; justify-content:center; align-items:center;"> '+
'<div style="width: 110px; text-align: center; border: 2px solid #E71B03; border-radius: 60px; line-height: 110px;">'+
'	<span style="font-size:60px; color:#E71B03;"> ! </span>'+
'</div>'+
'<div style="font-size:20px; color:#E71B03;">Transaction Pending!</div>'+
'</div>	 '+
'<script>'+
' setTimeout(function(){ '+
	'if(window.cordova) '+
		'window.location.replace("file:///android_asset/www/index.html"); '+
	'else '+
		'window.location.replace("'+ctrlGlobalVar.getGlobalVariable("hostname")+'"); '+
'},6000); '+	
'</script>'+
'</body> '+
'</html>';
	return html;
};

module.exports.failed_html = function(){
var html = '<html>'+
'<head></head> '+
'<body style=""> '+
'<div style="width:100%; height:100%; display:flex; flex-direction: column; justify-content:center; align-items:center;"> '+
'<div style="width: 110px; text-align: center; border: 2px solid #E71B03; border-radius: 60px; line-height: 110px;">'+
'	<span style="font-size:60px; color:#E71B03;">&#10006;</span>'+
'</div>'+
'<div style="font-size:20px; color:#E71B03;">Transaction Failed!</div>'+
'</div>	 '+
'<script>'+
' setTimeout(function(){ '+
	'if(window.cordova) '+
		'window.location.replace("file:///android_asset/www/index.html"); '+
	'else '+
		'window.location.replace("'+ctrlGlobalVar.getGlobalVariable("hostname")+'"); '+
'},6000); '+		
'</script>'+
'</body> '+
'</html>';
	return html;
};
	
//////////////////////////PAYMENT TRANSACTION Table////////////////////////////////
const PaymentTxn = mongoose.model('PaymentTxn');

module.exports.getPendingPaymentTxn = function(req,res){//Fetch Pending Transaction
	var query = {};
	query.user_id = {"$eq":req.payload.user_id};
	query.STATUS = {"$eq": "PENDING"};
	query.txn_requested = {"$eq": true};
	query.checksum_verified = {"$eq": true};
	query.txn_verified = {"$eq": false};
	
	PaymentTxn.find(query,function(err, result){
		if(err)
		   res.json({statusCode:"F", results: result, error: err});
		else
			res.json({statusCode:"S", results: result, error: err});
	});
};

module.exports.getPaymentTxn = function(req,res){//Fetch
	var query = {};
	if(req.query.subscription_id){
		query.subscription_id = {"$eq":req.query.subscription_id};
	}
	if(req.query.user_id){
		query.user_id = {"$eq":req.query.user_id};
	}
	if(req.query.ORDERID){
		query.ORDERID = {"$eq":req.query.ORDERID};
	}
	PaymentTxn.find(query,function(err, result){
		res.json({results: result, error: err});
	});
};
module.exports.addPaymentTxn = function(payload,callBack){//Add New
			payload.createdAt = new Date();
			let newPayment = new PaymentTxn(payload);
			newPayment.save((save_err, save_result)=>{
				if(save_err){
					callBack(false,save_err);
				}
				else{
					callBack(true);
				}
			});
			
};
module.exports.updatePaymentTxn = function(updatePayment,callBack){//Update
	var d = new Date();	
	PaymentTxn.findOneAndUpdate({ORDERID: updatePayment.ORDERID},{$set: updatePayment},{new:true},(err, result)=>{
		if(err){
			callBack(false,err);
		}
		else{
			callBack(true,err,result);
		}
	});
};

module.exports.deletePaymentTxn = function(req,res){//Delete
	PaymentTxn.remove({_id: req.params.id}, function(err,result){
		if(err){
			res.json(err);
		}
		else{
			res.json(result);
		}
	});
};

module.exports.buySubscription = function(req,res){//Buy Subscription
if(ctrlGlobalVar.getGlobalVariable('hostname')){
	Parameter.find({},function(params_err, params_result){
		if(params_result && params_result.length>0){
			var config_params = {};
			params_result.forEach(function(val,indx,arr){
				config_params[val.parameter] = val.value;
			});
			if(req.payload.user_id && req.body.amount){
				var order_id = req.payload.user_id + "_";
				var currentDateTime = new Date();
				order_id += currentDateTime.getFullYear();
				order_id += (currentDateTime.getMonth() >= 9)?(currentDateTime.getMonth() - (-1)):('0'+(currentDateTime.getMonth() - (-1)));
				order_id += (currentDateTime.getDate() > 9)?(currentDateTime.getDate()):('0'+ currentDateTime.getDate());
				order_id += (currentDateTime.getHours() > 9)?(currentDateTime.getHours()):('0'+ currentDateTime.getHours());
				order_id += (currentDateTime.getMinutes() > 9)?(currentDateTime.getMinutes()):('0'+ currentDateTime.getMinutes());
				order_id += (currentDateTime.getSeconds() > 9)?(currentDateTime.getSeconds()):('0'+ currentDateTime.getSeconds());
				
				var callback_url = '';
				if(ctrlGlobalVar.getGlobalVariable('hostname'))
					callback_url = ctrlGlobalVar.getGlobalVariable('hostname') + '/api/paymentCallback';
				
				var PaytmConfig = {
					mid: "hmaLsf12637844253552", //config_params['mid'],
					key: "WeF48eF#O@@Iw3F%",
					website: "WEBSTAGING",
					industry_type: "Retail",
					channel: "WEB",
					callback: callback_url
				}
				
				var order = {};
				order['ORDER_ID']			= order_id;
				order['CUST_ID'] 			= req.payload.user_id;
				order['TXN_AMOUNT']			= req.body.amount;
				order['EMAIL']				= req.body.email;
				order['MOBILE_NO']			= req.body.mobile;
				order['MID'] 				= PaytmConfig.mid;
				order['WEBSITE']			= PaytmConfig.website;
				order['CHANNEL_ID']			= PaytmConfig.channel;
				order['INDUSTRY_TYPE_ID']	= PaytmConfig.industry_type;
				order['CALLBACK_URL']		= PaytmConfig.callback;

				checksum_lib.genchecksum(order, PaytmConfig.key, function (checksum_err, checksum) {
					if(checksum_err || !checksum){
						res.json({statusCode:"F", msg:"Unable to generate checksum.", results: null, error: checksum_err});
					}
					else{
						var transaction = {
							user_id: req.payload.user_id,
							subscription_id: req.body.subscription_id,
							app_id: req.body.app_id,
							role_id: req.body.role_id,
							mobile: req.body.mobile,
							ORDERID: order['ORDER_ID'],
							MID: order['MID'],
							TXNID: '',
							TXNAMOUNT: Number(order['TXN_AMOUNT']),
							PAYMENTMODE: '',
							CURRENCY: '',
							TXNDATE: '',
							STATUS: '',
							TXNTYPE: '',
							RESPCODE: '',
							RESPMSG: '',
							GATEWAYNAME: '',
							BANKTXNID: '',
							BANKNAME: '',
							REFUNDAMT: 0.00,
							CHECKSUMHASH: checksum,
							txn_requested: false,
							checksum_verified: false,
							txn_verified: false,
							sub_mapping_verified: false,	
							createdAt: new Date()
						};
						module.exports.addPaymentTxn(transaction, function(status,paymentTxn_err){
							if(status){
								var txn_url = "https://securegw-stage.paytm.in/theia/processTransaction"; 	//for staging
								if(prd_env)
									txn_url = "https://securegw.paytm.in/theia/processTransaction"; 		//for production
								
								var form_fields = "";
								for(var x in order){
									form_fields += "<input type='hidden' name='"+x+"' value='"+order[x]+"' >";
								}
								form_fields += "<input type='hidden' name='CHECKSUMHASH' value='"+checksum+"' >";

								res.writeHead(200, {'Content-Type': 'text/html'});
								res.write('<html>'+
								'<head><title>Merchant Checkout Page</title></head>'+
								'<body>'+
								'<center><h1>Please do not refresh this page...</h1></center>'+
								'<form method="post" action="'+txn_url+'" name="f1">'+form_fields+'</form>'+
								'<script type="text/javascript">document.f1.submit();</script>'+
								'</body>'+
								'</html>');
								res.end();
							}
							else{
								res.json({statusCode:"F", msg:"Unable to generate order.", results: null, error: paymentTxn_err});
							}
						});
					}
				});
				
			}
			else{
				res.json({statusCode:"F", msg:"No Amount specified.", results: null, error: null});
			}
		}
		else{
			res.json({statusCode:"F", msg:"Unable to fetch configuration parameter.", results: null, error: params_err});
		}
	});
	}
	else{
		res.json({statusCode:"F", msg:"Unable to proceed currently. Try Again.", results: null, error: null});
	}
};

module.exports.buySubscriptionCallback = function(req,res){//Buy Subscription
	var html = "";
	var post_data = req.body;	
	var transaction = JSON.parse(JSON.stringify(post_data));
	transaction.txn_requested = true;
	module.exports.updatePaymentTxn(transaction, function(status,update_err,update_res){
		//if(status){
			if(post_data.STATUS === 'TXN_SUCCESS' || post_data.STATUS === 'PENDING'){
				Parameter.find({},function(params_err, params_result){
					if(params_result && params_result.length>0){
						var config_params = {};
						params_result.forEach(function(val,indx,arr){
							config_params[val.parameter] = val.value;
						});
						
						var callback_url = '';
						if(ctrlGlobalVar.getGlobalVariable('hostname'))
							callback_url = ctrlGlobalVar.getGlobalVariable('hostname') + '/api/paymentCallback';
						
						var PaytmConfig = {
							mid: "hmaLsf12637844253552", //config_params['mid'],
							key: "WeF48eF#O@@Iw3F%",
							website: "WEBSTAGING",
							industry_type: "Retail",
							channel: "WEB",
							callback: callback_url
						};

						// verify the checksum
						var checksumhash = update_res.CHECKSUMHASH; //post_data.CHECKSUMHASH;
						// delete post_data.CHECKSUMHASH;
						var checksum_result = checksum_lib.verifychecksum(post_data, PaytmConfig.key, checksumhash);
						
						var transaction = {};
						transaction.ORDERID = post_data.ORDERID;
						transaction.checksum_verified = checksum_result;
						module.exports.updatePaymentTxn(transaction, function(status,update_err,update_res){
							if(checksum_result){
								// Send Server-to-Server request to verify Order Status
								module.exports.buySubscriptionTxnVerification(req,res);
							}
							else{
								res.writeHead(200, {'Content-Type': 'text/html'});
								res.write(module.exports.failed_html());
								res.end();
							}
						});
					}
					else{
						res.json({statusCode:"F", msg:"Unable to fetch configuration parameter.", results: null, error: params_err});
					}
				});
			}
			else{
				res.writeHead(200, {'Content-Type': 'text/html'});
				res.write(module.exports.failed_html());
				res.end();
			}
		//}
		//else{
			//		
		//}
	});
};

module.exports.buySubscriptionTxnVerification = function(req,res){//Buy Subscription TRANSACTION Verification
	Parameter.find({},function(params_err, params_result){
		if(params_result && params_result.length>0){
			var config_params = {};
			params_result.forEach(function(val,indx,arr){
				config_params[val.parameter] = val.value;
			});
			
			var callback_url = '';
			if(ctrlGlobalVar.getGlobalVariable('hostname'))
				callback_url = ctrlGlobalVar.getGlobalVariable('hostname') + '/api/paymentCallback';
						
			
			var PaytmConfig = {
							mid: "hmaLsf12637844253552", //config_params['mid'],
							key: "WeF48eF#O@@Iw3F%",
							website: "WEBSTAGING",
							industry_type: "Retail",
							channel: "WEB",
							callback: callback_url
			};
						
			var post_data = '';
			var params = {"MID": PaytmConfig.mid, "ORDERID": req.body.ORDERID};
			checksum_lib.genchecksum(params, PaytmConfig.key, function (checksum_err, checksum) {
				params.CHECKSUMHASH = checksum;
				post_data = 'JsonData='+JSON.stringify(params);
				var options = {
							hostname: '',
							port: 443,
							path: '/merchant-status/getTxnStatus',
							method: 'POST',
							headers: {
									'Content-Type': 'application/x-www-form-urlencoded',
									'Content-Length': post_data.length
							}
				};
				if(prd_env)
					options['hostname'] = 'securegw.paytm.in'; 		//for production
				else
					options['hostname'] = 'securegw-stage.paytm.in';	//for staging
											
				// Set up the request
				var response = "";
				var post_req = https.request(options, function(post_res) {
					post_res.on('data', function (chunk) {
						response += chunk;
					});
					post_res.on('end', function(){
						var _result = JSON.parse(response);
						var transaction = {};
						transaction.ORDERID = req.body.ORDERID;
						transaction.txn_verified = (_result.STATUS == 'TXN_SUCCESS')?true:false;
						module.exports.updatePaymentTxn(transaction, function(status,update_err,update_res){
							if(_result.STATUS == 'TXN_SUCCESS'){
								userSubMap.addUserSubMap({body: update_res},res);
							}
							else if(_result.STATUS == 'PENDING'){
								res.writeHead(200, {'Content-Type': 'text/html'});
								res.write(module.exports.pending_html());
								res.end();
							}
							else{
								res.writeHead(200, {'Content-Type': 'text/html'});
								res.write(module.exports.failed_html());
								res.end();
							}
						});												
					});
				});
				//post the data
				post_req.write(post_data);
				post_req.end();
			});
		}
		else{
			res.json({statusCode:"F", msg:"Unable to fetch configuration parameter.", results: null, error: params_err});
		}
	});
};

