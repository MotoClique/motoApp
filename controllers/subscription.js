
const async = require("async");
const request = require('request');
var mongoose = require('mongoose');
const PaymentTxn = mongoose.model('PaymentTxn');
var ctrlGlobalVar = require('../globalVar');

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

//////////////////////////User Subscription Mapping Table////////////////////////////////
const UserSubMap = mongoose.model('UserSubMap');

module.exports.getUserSubMap = function(req,res){//Fetch
	var query = {};
	if(req.query.subscription_id){
		query.subscription_id = {"$eq":req.query.subscription_id};
	}
	if(req.query.user_id){
		query.user_id = {"$eq":req.query.user_id};
	}
	if(req.query.deleted){
		query.deleted = {"$eq":req.query.deleted};
	}
	else{
		query.deleted = {"$ne": true};
	}
	UserSubMap.find(query,function(err, result){
		res.json({results: result, error: err});
	});
};
module.exports.addUserSubMap = function(req,res){//Add New
	var Subscription = mongoose.model('Subscription');
	var query = {"subscription_id":{"$eq":req.body.subscription_id}};	
	Subscription.find(query,function(err, result){
		if(err){
			res.json({statusCode: 'F', msg: 'Failed to add Subscription.', error: err});
		}else if(result.length && result.length > 0){
			var tdyObj = new Date();
			var valid_from = tdyObj.getDate() +"/"+ (tdyObj.getMonth() - (-1)) +"/"+ tdyObj.getFullYear() ;
			var valid_to = "";
			var validity_unit = result[0].validity_unit.toLowerCase();
			if(validity_unit.includes("hour")){
				var d = new Date();
				d.setTime(d.getTime() + (parseInt(result[0].validity_period)*60*60*1000)); 
				valid_to = d.getDate() +"/"+ (d.getMonth() - (-1)) +"/"+ d.getFullYear() ;
			}
			else if(validity_unit.includes("day")){
				var d = new Date();
				d.setDate(d.getDate() + parseInt(result[0].validity_period));
				valid_to = d.getDate() +"/"+ (d.getMonth() - (-1)) +"/"+ d.getFullYear() ;
			}
			else if(validity_unit.includes("month")){
				var d = new Date();
				d.setMonth(d.getMonth() + parseInt(result[0].validity_period));
				valid_to = d.getDate() +"/"+ (d.getMonth() - (-1)) +"/"+ d.getFullYear() ;
			}
			else if(validity_unit.includes("year")){
				var d = new Date();
				d.setFullYear(d.getFullYear() + parseInt(result[0].validity_period));
				valid_to = d.getDate() +"/"+ (d.getMonth() - (-1)) +"/"+ d.getFullYear() ;
			}
			
			let newSubscription = new UserSubMap({
				ORDERID: req.body.ORDERID,
				user_id: req.body.user_id,
				subscription_id: req.body.subscription_id,
				subscription_name: result[0].subscription_name,
				app_id: result[0].app_id,
				app_name: result[0].app_name,
				role_id: result[0].role_id,
				valid_from: valid_from, 
				valid_to: valid_to,
				amt_paid: (req.body.TXNAMOUNT + ''),
				currency: req.body.CURRENCY,
				remain_post: result[0].post_allowed,
				post_day: result[0].post_day,
				post_priority: result[0].post_priority,
				feature: result[0].featureOnTop,
				getHighlighted: result[0].getHighlighted,
				notification_sms: result[0].notification_sms,
				notification_email: result[0].notification_email,
				notification_app: result[0].notification_app,
				active: "X",
				createdBy: req.body.user_id,
				createdAt: tdyObj,
				changedBy: req.body.user_id,
				changedAt: tdyObj,
				deleted: false
			});
			
			UserSubMap.updateMany({"user_id": {$eq: req.body.user_id}},{$set: {"active": "-"}},{upsert: false},(update_err, update_result)=>{
				if(update_err){
					res.json({statusCode: 'F', msg: 'Failed to add Subscription.', error: update_err});
				}
				else{
					newSubscription.save((save_err, save_result)=>{
						if(save_err){
							res.json({statusCode: 'F', msg: 'Failed to add Subscription.', error: save_err});
						}
						else{
							var payment = {};
							payment.ORDERID = save_result.ORDERID;
							payment.sub_mapping_verified = true;
							PaymentTxn.findOneAndUpdate({ORDERID: payment.ORDERID},{$set: payment},{new:true},(payment_err, payment_result)=>{
							//res.json({statusCode: 'S', msg: 'Entry added', results: save_result});
							res.writeHead(200, {'Content-Type': 'text/html'});
							res.write(module.exports.success_html());
							res.end();
							});
						}
					});
				}
			});
				
		}
		else{
			res.json({statusCode: 'F', msg: 'Invalid Subscription. Failed to add', error: ""});
		}
	});
};
module.exports.updateUserSubMap = function(req,res){//Update
	var d = new Date();
	var at = d.getDate() +"/"+ (d.getMonth() - (-1)) +"/"+ d.getFullYear() ;
	let updateSubscription = {
			_id:req.body._id,
			user_id: req.body.user_id,
			subscription_id: req.body.subscription_id,
			subscription_name: req.body.subscription_name,
			app_id: req.body.app_id,
			app_name: req.body.app_name,
			role_id: req.body.role_id,
			valid_from: req.body.valid_from,
			valid_to: req.body.valid_to,
			amt_paid: req.body.amt_paid,
			currency: req.body.currency,
			remain_post: req.body.remain_post,
			post_day: req.body.post_day,
			post_priority: req.body.post_priority,
			feature: req.body.feature,
			getHighlighted: req.body.getHighlighted,
			notification_sms: req.body.notification_sms,
			notification_email: req.body.notification_email,
			notification_app: req.body.notification_app,
			active: req.body.active,
			//createdBy: req.body.createdBy,
			//createdAt: req.body.createdAt,
			changedBy: req.payload.user_id,
			changedAt: d,
			deleted: req.body.deleted
	};
	
	UserSubMap.findOneAndUpdate({_id:req.body._id},{$set: updateSubscription},{},(err, result)=>{
		if(err){
			res.json({statusCode: 'F', msg: 'Failed to update', error: err});
		}
		else{
			res.json({statusCode: 'S', msg: 'Entry updated', updated: result});
		}
	});
};

module.exports.deleteUserSubMap = function(req,res){//Delete
	UserSubMap.remove({_id: req.params.id}, function(err,result){
		if(err){
			res.json(err);
		}
		else{
			res.json(result);
		}
	});
};

