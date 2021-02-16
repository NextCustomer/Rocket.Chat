import { theme } from './server';
import { settings } from '../../settings';
import { Settings } from '/app/models';
// TODO: Define registers/getters/setters for packages to work with established
// 			heirarchy of colors instead of making duplicate definitions
// TODO: Settings pages to show simple separation of major/minor/addon colors
// TODO: Add setting toggle to use defaults for minor colours and hide settings

// New colors, used for shades on solid backgrounds
// Defined range of transparencies reduces random colour variances
// Major colors form the core of the scheme
// Names changed to reflect usage, comments show pre-refactor names

const variablesContent = Assets.getText('client/imports/general/variables.css');

const regionRegex = /\/\*\s*#region\s+([^ ]*?)\s+(.*?)\s*\*\/((.|\s)*?)\/\*\s*#endregion\s*\*\//igm;

for (let matches = regionRegex.exec(variablesContent); matches; matches = regionRegex.exec(variablesContent)) {
	const [, type, section, content] = matches;
	[...content.match(/--(.*?):\s*(.*?);/igm)].forEach((entry) => {
		const matches = /--(.*?):\s*(.*?);/im.exec(entry);
		const [, name, value] = matches;

		if (type === 'fonts') {
			theme.addVariable('font', name, value, 'Fonts', true);
			return;
		}

		if (type === 'colors') {
			if (/var/.test(value)) {
				const [, variableName] = value.match(/var\(--(.*?)\)/i);
				theme.addVariable('color', name, variableName, section, true, 'expression', ['color', 'expression']);
				return;
			}

			theme.addVariable('color', name, value, section, true, 'color', ['color', 'expression']);
			return;
		}

		if (type === 'less-colors') {
			if (/var/.test(value)) {
				const [, variableName] = value.match(/var\(--(.*?)\)/i);
				theme.addVariable('color', name, `@${ variableName }`, section, true, 'expression', ['color', 'expression']);
				return;
			}

			theme.addVariable('color', name, value, section, true, 'color', ['color', 'expression']);
		}
	});
}

settings.add('theme-custom-css', '', {
	group: 'Layout',
	type: 'code',
	code: 'text/css',
	multiline: true,
	section: 'Custom CSS',
	public: true,
});

settings.addGroup('Event Management');

settings.add('event.events', '[{"name":"Grove", "slug": "grove"}]', {
	group: 'Event Management',
	type: 'code',
	code: 'application/json',
	multiline: true,
	public: false,
});

const events = Settings.findOneById('event.events');
for (const event of JSON.parse((events || {}).value || '')) {
	settings.add(`event-${ event.slug }.theme-css`, '', {
		group: 'Event Management',
		type: 'code',
		code: 'text/css',
		multiline: true,
		section: `${ event.name }`,
		public: false,
	});

	settings.add(`event-${ event.slug }.Site_Name`, '', {
		group: 'Event Management',
		type: 'string',
		public: false,
		i18nLabel: 'Site_Name',
		section: `${ event.name }`,
	});

	settings.add(`event-${ event.slug }.Layout_Home_Body`, '', {
		group: 'Event Management',
		type: 'code',
		code: 'text/html',
		multiline: true,
		public: false,
		i18nLabel: 'Layout_Home_Body',
		section: `${ event.name }`,
	});

	settings.add(`event-${ event.slug }.Layout_Terms_of_Service`, '', {
		group: 'Event Management',
		type: 'code',
		code: 'text/html',
		multiline: true,
		public: false,
		i18nLabel: 'Layout_Terms_of_Service',
		section: `${ event.name }`,
	});

	settings.add(`event-${ event.slug }.Layout_Sidenav_Footer`, '', {
		group: 'Event Management',
		type: 'code',
		code: 'text/html',
		public: false,
		i18nLabel: 'Layout_Sidenav_Footer',
		section: `${ event.name }`,
	});

	settings.add(`event-${ event.slug }.Layout_Privacy_Policy`, '', {
		group: 'Event Management',
		type: 'code',
		code: 'text/html',
		public: false,
		i18nLabel: 'Layout_Privacy_Policy',
		section: `${ event.name }`,
	});

	settings.add(`event-${ event.slug }.Layout_Login_Terms`, '', {
		group: 'Event Management',
		type: 'code',
		code: 'text/html',
		public: false,
		i18nLabel: 'Layout_Login_Terms',
		section: `${ event.name }`,
	});

	settings.add(`event-${ event.slug }.Assets_logo`, '', {
		group: 'Event Management',
		type: 'string',
		public: false,
		i18nLabel: 'Assets_logo',
		section: `${ event.name }`,
	});

	settings.add(`event-${ event.slug }.Assets_logo`, '', {
		group: 'Event Management',
		type: 'string',
		public: false,
		i18nLabel: 'Assets_logo',
		section: `${ event.name }`,
	});

	settings.add(`event-${ event.slug }.Assets_logo`, '', {
		group: 'Event Management',
		type: 'string',
		public: false,
		i18nLabel: 'Assets_logo',
		section: `${ event.name }`,
	});

	settings.add(`event-${ event.slug }.Assets_logo`, '', {
		group: 'Event Management',
		type: 'string',
		public: false,
		i18nLabel: 'Assets_logo',
		section: `${ event.name }`,
	});

	settings.add(`event-${ event.slug }.Assets_favicon_ico`, '', {
		group: 'Event Management',
		type: 'string',
		public: false,
		i18nLabel: 'Assets_favicon_ico',
		section: `${ event.name }`,
	});

	settings.add(`event-${ event.slug }.Assets_favicon`, '', {
		group: 'Event Management',
		type: 'string',
		public: false,
		i18nLabel: 'Assets_favicon_svg',
		section: `${ event.name }`,
	});

	settings.add(`event-${ event.slug }.Jitsi_Enabled`, '', {
		group: 'Event Management',
		type: 'boolean',
		i18nLabel: 'Jitsi Enabled',
		section: `${ event.name }`,
		public: false,
	});

	settings.add(`event-${ event.slug }.Jitsi_Domain`, '', {
		group: 'Event Management',
		type: 'string',
		i18nLabel: 'Jitsi Domain',
		section: `${ event.name }`,
		public: false,
	});

	// Private
	settings.add(`event-${ event.slug }.css`, '', {
		group: 'Event Management',
		type: 'code',
		code: 'text/css',
		multiline: true,
		public: false,
		hidden: true,
		section: `${ event.name }`,
	});
}
