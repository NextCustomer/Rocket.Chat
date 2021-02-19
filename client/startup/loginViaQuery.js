import { Meteor } from 'meteor/meteor';
import { FlowRouter } from 'meteor/kadira:flow-router';
import { Accounts } from 'meteor/accounts-base';

Meteor.startup(() => {
	const resumeToken = FlowRouter.getQueryParam('resumeToken');
	if (!resumeToken) {
		return;
	}

	Meteor.loginWithToken(resumeToken, () => {
		if (FlowRouter.getRouteName()) {
			FlowRouter.setQueryParams({
				resumeToken: null,
				userId: null,
			});
			return;
		}
		FlowRouter.go('/home');
	});
});

Meteor.startup(() => {
	const eventToken = FlowRouter.getQueryParam('eventToken');
	if (!eventToken) {
		return;
	}

	const callback = () => {
		if (FlowRouter.getRouteName()) {
			FlowRouter.setQueryParams({
				userId: null,
			});

			return;
		}
		FlowRouter.go('/home');
	};

	Accounts.callLoginMethod({
		methodArguments: [{
			eventToken,
		}],
		userCallback: callback,
	});
});
