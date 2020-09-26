import { check, Match } from 'meteor/check';
import { TAPi18n } from 'meteor/rocketchat:tap-i18n';

import { API } from '../../../../api/server';
import { Livechat } from '../../lib/Livechat';
import { Meteor } from 'meteor/meteor';

API.v1.addRoute('livechat/offline.message', {
	post() {
		try {
			check(this.bodyParams, {
				token: String,
				// name: String,
				// email: String,
				message: String,
				department: String,
				host: Match.Maybe(String),
			});

			const { token, department, message, host } = this.bodyParams;
			const user = Meteor.users.findOne(token);
			if (!user) {
				throw new Meteor.Error('error-invalid-user', 'Invalid user',
					{ method: 'livechat/offline.message' });
			}
			const { name } = user;
			const email = user.emails[0].address;

			if (!Livechat.sendOfflineMessage({
				name,
				email,
				message,
				department,
				host,
			})) {
				return API.v1.failure({ message: TAPi18n.__('Error_sending_livechat_offline_message') });
			}

			return API.v1.success({ message: TAPi18n.__('Livechat_offline_message_sent') });
		} catch (e) {
			return API.v1.failure(e);
		}
	},
});
