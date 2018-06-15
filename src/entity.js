class M {
	Setup(com, fun) {
		//this function is typically used to allow the entity/module to handle any internal setup
		//procedures prior to being connected to by other entities/modules

		fun(null, com);
	}

	Start(com, fun){
		//this function is typically used to allow the entity/module to handle any external setup
		//procedures

		fun(null, com);
	}
};