import db from './index';


export function sync(){
	db.sequelize.sync();	
}

export function syncForce(){
	db.sequelize.sync({force:true});		
}