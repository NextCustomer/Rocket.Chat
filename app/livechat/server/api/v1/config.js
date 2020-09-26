import { check, Match } from 'meteor/check';

import { API } from '../../../../api/server';
import { findAgent, findGuest, findOpenRoom, getExtraConfigInfo, online, settings } from '../lib/livechat';
import { Livechat } from '../../lib/Livechat';

API.v1.addRoute('livechat/config', {
	get() {
		try {
			check(this.queryParams, {
				token: Match.Maybe(String),
				department: Match.Maybe(String),
			});

			const config = settings();
			if (!config.enabled) {
				return API.v1.success({ config: { enabled: false } });
			}

			const { token, department } = this.queryParams;
			const status = online(department);
			const guest = token && findGuest(token);

			let room;
			let agent;

			if (guest) {
				if (department && guest.department !== department) {
					Livechat.setDepartmentForGuest({
						token,
						department,
					});
				}

				room = findOpenRoom(token, department);
				agent = room && room.servedBy && findAgent(room.servedBy._id);
			}
			const extra = Promise.await(getExtraConfigInfo(room));
			const { config: extraConfig = {} } = extra || {};
			Object.assign(config, {
				online: status,
				guest,
				room,
				agent,
			}, { ...extraConfig });

			return API.v1.success({ config });
		} catch (e) {
			return API.v1.failure(e);
		}
	},
});
