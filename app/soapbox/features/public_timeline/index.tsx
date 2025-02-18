import React, { useEffect } from 'react';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';
import { Link } from 'react-router-dom';

import { changeSetting } from 'soapbox/actions/settings';
import { connectPublicStream } from 'soapbox/actions/streaming';
import { expandPublicTimeline } from 'soapbox/actions/timelines';
import PullToRefresh from 'soapbox/components/pull-to-refresh';
import SubNavigation from 'soapbox/components/sub_navigation';
import { Button, Column, Text } from 'soapbox/components/ui';
import { useAppDispatch, useAppSelector, useSettings } from 'soapbox/hooks';

import Timeline from '../ui/components/timeline';

const messages = defineMessages({
  title: { id: 'column.public', defaultMessage: 'Explore' },
});

const CommunityTimeline = () => {
  const intl = useIntl();
  const dispatch = useAppDispatch();

  const settings = useSettings();
  const onlyMedia = settings.getIn(['public', 'other', 'onlyMedia']);

  const siteTitle = useAppSelector((state) => state.instance.title);
  const showExplanationBox = settings.get('showExplanationBox');


  const dismissExplanationBox = React.useCallback(() => {
    dispatch(changeSetting(['showExplanationBox'], false));
  }, [dispatch]);

  const handleLoadMore = React.useCallback((maxId: string) => {
    dispatch(expandPublicTimeline({ maxId, onlyMedia }));
  }, [dispatch, onlyMedia]);

  const handleRefresh = React.useCallback(() => {
    return dispatch(expandPublicTimeline({ onlyMedia } as any));
  }, [dispatch, onlyMedia]);

  useEffect(() => {
    dispatch(expandPublicTimeline({ onlyMedia } as any));
    const disconnect = dispatch(connectPublicStream({ onlyMedia }));

    return () => {
      disconnect();
    };
  }, [onlyMedia]);

  return (
    <Column label={intl.formatMessage(messages.title)} transparent withHeader={false}>
      <div className='px-4 pt-4 sm:p-0'>
        <SubNavigation message={intl.formatMessage(messages.title)} />
      </div>
      {showExplanationBox && <div className='mb-4'>
        <Text size='lg' weight='bold' className='mb-2'>
          <FormattedMessage id='fediverse_tab.explanation_box.title' defaultMessage='What is the Fediverse?' />
        </Text>
        <FormattedMessage
          id='fediverse_tab.explanation_box.explanation'
          defaultMessage='{site_title} is part of the Fediverse, a social network made up of thousands of independent social media sites (aka "servers"). The posts you see here are from 3rd-party servers. You have the freedom to engage with them, or to block any server you don&apos;t like. Pay attention to the full username after the second @ symbol to know which server a post is from. To see only {site_title} posts, visit {local}.'
          values={{
            site_title: siteTitle,
            local: (
              <Link to='/timeline/local'>
                <FormattedMessage
                  id='empty_column.home.local_tab'
                  defaultMessage='the {site_title} tab'
                  values={{ site_title: siteTitle }}
                />
              </Link>
            ),
          }}
        />
        <div className='text-right'>
          <Button theme='link' onClick={dismissExplanationBox}>
            <FormattedMessage id='fediverse_tab.explanation_box.dismiss' defaultMessage="Don\'t show again" />
          </Button>
        </div>
      </div>}
      <PullToRefresh onRefresh={handleRefresh}>
        <Timeline
          scrollKey={'public_timeline'}
          timelineId={`public${onlyMedia ? ':media' : ''}`}
          onLoadMore={handleLoadMore}
          emptyMessage={<FormattedMessage id='empty_column.public' defaultMessage='There is nothing here! Write something publicly, or manually follow users from other servers to fill it up' />}
          divideType='space'
        />
      </PullToRefresh>
    </Column>
  );
};

export default CommunityTimeline;
