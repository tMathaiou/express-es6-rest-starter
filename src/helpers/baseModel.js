import Sequelize from "sequelize";
import uuid from 'node-uuid';


export const baseModel = {
	id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
	uid: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV1, 
		set: function setValue(value) {			
			if(!this.getDataValue('uid')){
				this.setDataValue('uid', uuid.v1());
			}			
		}		
	}
};
