
const async = require("async");
const request = require('request');
var mongoose = require('mongoose');
var Counter = mongoose.model('Counter');
var Profile = mongoose.model('Profile');

//////////////////////////User Alerts////////////////////////////////
const UserAlert = mongoose.model('UserAlert');

module.exports.getUserAlert = function(req,res){//Fetch
	var query = {};
	if(req.query.alert_id){
		query.alert_id = {"$regex":req.query.alert_id, "$options":"i"};
	}
	if(req.query.user_id){
		query.user_id = {"$regex":req.query.user_id, "$options":"i"};
	}
	if(req.query.deleted){
		query.deleted = {"$regex":req.query.deleted, "$options":"i"};
	}
	else{
		query.deleted = {"$ne": true};
	}
	UserAlert.find(query,function(err, result){
		res.json({results: result, error: err});
	});
};
module.exports.addUserAlert = function(req,res){//Add New
	var query_profile = {};
	query_profile.user_id = {"$eq": req.payload.user_id};
	query_profile.deleted = {"$ne": true};
	Profile.find(query_profile,function(profile_err, profiles){
		if(!profile_err && profiles.length > 0){
			if(req.body.email && !(profiles[0].email)){
				res.json({statusCode: 'F', msg: 'Please maintain email id.'});
			}
			else{
				var alert_id = "0";
				Counter.getNextSequenceValue('alert',function(sequence){
					if(sequence){
						var index_count = sequence.sequence_value;
						var d = new Date();
						var at = d.getDate() +"/"+ (d.getMonth() - (-1)) +"/"+ d.getFullYear() ;
						var doc = req.body;
						//let newUserAlert = new UserAlert({
							doc.user_id = req.payload.user_id;
							doc.alert_id =  alert_id - (-index_count);
							/*bid_sell_buy: req.body.bid_sell_buy,
							individual_dealer: req.body.individual_dealer,
							owner_type: req.body.owner_type,
							product_type_name: req.body.product_type_name,
							brand_name: req.body.brand_name,
							model: req.body.model,
							variant: req.body.variant,
							fuel_type: req.body.fuel_type,
							color: req.body.color,
							transmission: req.body.transmission,
							country: req.body.country,
							state: req.body.state,
							city: req.body.city,
							location: req.body.location,
							price_from: req.body.price_from,
							price_to: req.body.price_to,
							discount_from: req.body.discount_from,
							discount_to: req.body.discount_to,
							km_run_from: req.body.km_run_from,
							km_run_to: req.body.km_run_to,
							year_of_reg_from: req.body.year_of_reg_from,
							year_of_reg_to: req.body.year_of_reg_to,
							sms: req.body.sms,
							email: req.body.email,
							app: req.body.app,
							active: req.body.active,
							deleted: req.body.deleted,*/
							doc.createdBy = req.payload.user_id;
							doc.createdAt = at;
							doc.changedBy = req.payload.user_id;
							doc.changedAt = at;
						//});
						let newUserAlert = new UserAlert(doc);
						newUserAlert.save((err, result)=>{
							if(err){
								res.json({statusCode: 'F', msg: 'Failed to add', error: err});
							}
							else{
								res.json({statusCode: 'S', msg: 'Entry added', result: result});
							}
						});
					}
					else{
						res.json({statusCode: 'F', msg: 'Unable to generate sequence number.'});
					}
				});
			}
		}
		else{
			res.json({statusCode: 'F', msg: 'Unable to find your profile detail.'});
		}
	});
};
module.exports.updateUserAlert = function(req,res){//Update
	var query_profile = {};
	query_profile.user_id = {"$eq": req.payload.user_id};
	query_profile.deleted = {"$ne": true};
	Profile.find(query_profile,function(profile_err, profiles){
		if(!profile_err && profiles.length > 0){
			if(req.body.email && !(profiles[0].email)){
				res.json({statusCode: 'F', msg: 'Please maintain email id.'});
			}
			else{
				var d = new Date();
				var at = d.getDate() +"/"+ (d.getMonth() - (-1)) +"/"+ d.getFullYear() ;
				var doc = req.body;
				/*let updateUserAddress = {
						_id:req.body._id,
						user_id: req.body.user_id,
						alert_id: req.body.alert_id,
						bid_sell_buy: req.body.bid_sell_buy,
						individual_dealer: req.body.individual_dealer,
						owner_type: req.body.owner_type,
						product_type_name: req.body.product_type_name,
						brand_name: req.body.brand_name,
						model: req.body.model,
						variant: req.body.variant,
						fuel_type: req.body.fuel_type,
						color: req.body.color,
						transmission: req.body.transmission,
						country: req.body.country,
						state: req.body.state,
						city: req.body.city,
						location: req.body.location,
						price_from: req.body.price_from,
						price_to: req.body.price_to,
						discount_from: req.body.discount_from,
						discount_to: req.body.discount_to,
						km_run_from: req.body.km_run_from,
						km_run_to: req.body.km_run_to,
						year_of_reg_from: req.body.year_of_reg_from,
						year_of_reg_to: req.body.year_of_reg_to,
						sms: req.body.sms,
						email: req.body.email,
						app: req.body.app,
						active: req.body.active,
						deleted: req.body.deleted,*/
						delete doc.createdBy;
						delete doc.createdAt;
						doc.changedBy = req.payload.user_id;
						doc.changedAt = at;
				//};
				
				UserAlert.findOneAndUpdate({_id:req.body._id},{$set: doc},{},(err, updated)=>{
					if(err){
						res.json({statusCode: 'F', msg: 'Failed to update', error: err});
					}
					else{
						res.json({statusCode: 'S', msg: 'Entry updated', updated: updated});
					}
				});
			}
		}
		else{
			res.json({statusCode: 'F', msg: 'Unable to find your profile detail.'});
		}
	});
};

module.exports.deleteUserAlert = function(req,res){//Delete
	UserAlert.remove({_id: req.params.id}, function(err,result){
		if(err){
			res.json(err);
		}
		else{
			res.json(result);
		}
	});
};
