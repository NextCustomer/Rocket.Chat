import { Meteor } from 'meteor/meteor';

import { Settings } from '../../../app/models/server';
import { hasAtLeastOnePermission, hasPermission } from '../../../app/authorization/server';
import { getSettingPermissionId } from '../../../app/authorization/lib';
import { SettingsEvents } from '../../../app/settings/server/functions/settings';

export const currentEventSlug = function() {
	const currentInvocation = DDP._CurrentMethodInvocation.get() || DDP._CurrentPublicationInvocation.get();
	return currentInvocation ? currentInvocation.connection.httpHeaders.host.split('.')[0] : undefined;
};

const eventAwareSettings = (settings) => {
	const slug = currentEventSlug();
	for (const setting of settings) {
		if (['Jitsi_Enabled', 'Jitsi_Domain', 'Layout_Home_Body', 'Layout_Terms_of_Service',
			'Layout_Sidenav_Footer', 'Assets_logo', 'Layout_Login_Terms',
			'Layout_Privacy_Policy', 'Layout_Login_Terms', 'Site_Name',
			'Assets_favicon_ico', 'Assets_favicon'].includes(setting._id)) {
			const current = Settings.findOneById(`event-${ slug }.${ setting._id }`);

			if (setting._id.startsWith('Assets_')) {
				setting.value = current ? { defaultUrl: current } : setting.value;
			} else {
				setting.value = current ? current.value : setting.value;
			}
		}
	}

	return settings;
};

Meteor.methods({
	'public-settings/get'(updatedAt) {
		if (updatedAt instanceof Date) {
			let records = Settings.findNotHiddenPublicUpdatedAfter(updatedAt).fetch();
			SettingsEvents.emit('fetch-settings', records);

			records = eventAwareSettings(records);

			return {
				update: records,
				remove: Settings.trashFindDeletedAfter(updatedAt, {
					hidden: {
						$ne: true,
					},
					public: true,
				}, {
					fields: {
						_id: 1,
						_deletedAt: 1,
					},
				}).fetch(),
			};
		}

		let publicSettings = Settings.findNotHiddenPublic().fetch();
		publicSettings = eventAwareSettings(publicSettings);
		SettingsEvents.emit('fetch-settings', publicSettings);

		return publicSettings;
	},
	'private-settings/get'(updatedAfter) {
		const uid = Meteor.userId();

		if (!uid) {
			return [];
		}

		const privilegedSetting = hasAtLeastOnePermission(uid, ['view-privileged-setting', 'edit-privileged-setting']);
		const manageSelectedSettings = privilegedSetting || hasPermission(uid, 'manage-selected-settings');

		if (!manageSelectedSettings) {
			return [];
		}

		const bypass = (settings) => settings;

		const applyFilter = (fn, args) => fn(args);

		const getAuthorizedSettingsFiltered = (settings) => settings.filter((record) => hasPermission(uid, getSettingPermissionId(record._id)));

		const getAuthorizedSettings = (updatedAfter, privilegedSetting) => applyFilter(privilegedSetting ? bypass : getAuthorizedSettingsFiltered, Settings.findNotHidden(updatedAfter && { updatedAfter }).fetch());

		if (!(updatedAfter instanceof Date)) {
			// this does not only imply an unfiltered setting range, it also identifies the caller's context:
			// If called *with* filter (see below), the user wants a collection as a result.
			// in this case, it shall only be a plain array
			return getAuthorizedSettings(updatedAfter, privilegedSetting);
		}

		return {
			update: getAuthorizedSettings(updatedAfter, privilegedSetting),
			remove: Settings.trashFindDeletedAfter(updatedAfter, {
				hidden: {
					$ne: true,
				},
			}, {
				fields: {
					_id: 1,
					_deletedAt: 1,
				},
			}).fetch(),
		};
	},
});


