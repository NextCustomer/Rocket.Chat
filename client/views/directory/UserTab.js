import React, { useMemo, useState, useCallback, useEffect } from 'react';
import { Box, Table, Flex, TextInput, Icon } from '@rocket.chat/fuselage';
import { useMediaQuery } from '@rocket.chat/fuselage-hooks';

import { GenericTable, Th } from '../../components/GenericTable';
import { useTranslation } from '../../contexts/TranslationContext';
import { useRoute } from '../../contexts/RouterContext';
import { usePermission } from '../../contexts/AuthorizationContext';
import { useQuery } from './hooks';
import { useEndpointData } from '../../hooks/useEndpointData';
import { useFormatDate } from '../../hooks/useFormatDate';
import UserAvatar from '../../components/basic/avatar/UserAvatar';
import NotAuthorizedPage from '../../components/NotAuthorizedPage';
import MarkdownText from '../../components/basic/MarkdownText';

const FilterByText = ({ setFilter, ...props }) => {
	const t = useTranslation();
	const [text, setText] = useState('');
	const handleChange = useCallback((event) => setText(event.currentTarget.value), []);

	useEffect(() => {
		setFilter({ text });
	}, [text, setFilter]);

	return <Box mb='x16' is='form' display='flex' flexDirection='column' {...props}>
		<TextInput flexShrink={0} placeholder={t('Search_Users')} addon={<Icon name='magnifier' size='x20'/>} onChange={handleChange} value={text} />
	</Box>;
};

function UserTable({
	workspace = 'local',
}) {
	const [params, setParams] = useState({ current: 0, itemsPerPage: 25 });
	const [sort, setSort] = useState(['name', 'asc']);
	const canViewFullOtherUserInfo = usePermission('view-full-other-user-info');
	const t = useTranslation();

	const federation = workspace === 'external';

	const query = useQuery(params, sort, 'users', workspace);

	const mediaQuery = useMediaQuery('(min-width: 1024px)');

	const onHeaderClick = useCallback((id) => {
		const [sortBy, sortDirection] = sort;

		if (sortBy === id) {
			setSort([id, sortDirection === 'asc' ? 'desc' : 'asc']);
			return;
		}
		setSort([id, 'asc']);
	}, [sort]);

	const header = useMemo(() => [
		<Th key={'name'} direction={sort[1]} active={sort[0] === 'name'} onClick={onHeaderClick} sort='name'>{t('Name')}</Th>,
		federation && <Th key={'origin'} direction={sort[1]} active={sort[0] === 'origin'} onClick={onHeaderClick} sort='origin' style={{ width: '200px' }} >{t('Domain')}</Th>,
		mediaQuery && <Th key={'createdAt'} direction={sort[1]} active={sort[0] === 'createdAt'} onClick={onHeaderClick} sort='createdAt' style={{ width: '200px' }}>{t('Joined_at')}</Th>,
	].filter(Boolean), [sort, onHeaderClick, t, mediaQuery, canViewFullOtherUserInfo, federation]);

	const directRoute = useRoute('direct');

	const data = useEndpointData('directory', query) || {};

	const onClick = useCallback((username) => (e) => {
		if (e.type === 'click' || e.key === 'Enter') {
			directRoute.push({ rid: username });
		}
	}, [directRoute]);


	const formatDate = useFormatDate();

	const renderRow = useCallback(({ createdAt, emails, _id, username, name, domain, bio, avatarETag, nickname }) => <Table.Row key={_id} onKeyDown={onClick(username)} onClick={onClick(username)} tabIndex={0} role='link' action>
		<Table.Cell>
			<Flex.Container>
				<Box>
					<Flex.Item>
						<UserAvatar size='x40' title={username} username={username} etag={avatarETag} />
					</Flex.Item>
					<Box withTruncatedText grow={1} mi='x8'>
						<Box display='flex'>
							<Box fontScale='p2' withTruncatedText>{name || username}{nickname && ` (${ nickname })`}</Box> <Box mi='x4'/> <Box fontScale='p1' color='hint' withTruncatedText>{username}</Box>
						</Box>
						<MarkdownText fontScale='p1' color='hint' content={bio}/>
					</Box>
				</Box>
			</Flex.Container>
		</Table.Cell>

		{mediaQuery && canViewFullOtherUserInfo
			&& <Table.Cell withTruncatedText >
				{emails && emails[0].address}
			</Table.Cell>}
		{federation
		&& <Table.Cell withTruncatedText>
			{domain}
		</Table.Cell>}
		{mediaQuery && <Table.Cell fontScale='p1' color='hint' withTruncatedText>
			{formatDate(createdAt)}
		</Table.Cell>}
	</Table.Row>, [mediaQuery, federation, canViewFullOtherUserInfo, formatDate, onClick]);

	return <GenericTable FilterComponent={FilterByText} header={header} renderRow={renderRow} results={data.result} total={data.total} setParams={setParams} />;
}

export default function UserTab(props) {
	const canViewOutsideRoom = usePermission('view-outside-room');
	const canViewDM = usePermission('view-d-room');

	if (canViewOutsideRoom && canViewDM) {
		return <UserTable {...props} />;
	}

	return <NotAuthorizedPage />;
}
