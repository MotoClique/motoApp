//Handle Global Variable
var globalVar = {};

module.exports.setGlobalVariable = function(param,val){
	globalVar[param] = val;
};

module.exports.getGlobalVariable = function(param){
	if(param)
		return globalVar[param];
	else
		return globalVar;
};
