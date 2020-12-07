import React, { Component } from 'react';
import { defineMessages, injectIntl } from 'react-intl';
import queryString from 'query-string';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import { ControlGroup, Divider } from '@blueprintjs/core';

import Query from 'app/Query';
import Screen from 'components/Screen/Screen';
import CollectionManageMenu from 'components/Collection/CollectionManageMenu';
import CollectionContextLoader from 'components/Collection/CollectionContextLoader';
import CollectionHeading from 'components/Collection/CollectionHeading';
import CollectionViews from 'components/Collection/CollectionViews';
import ErrorScreen from 'components/Screen/ErrorScreen';
import DocumentDropzone from 'components/Document/DocumentDropzone';
import collectionViewIds from 'components/Collection/collectionViewIds';
import { Breadcrumbs, Collection, SearchBox, SinglePane,  } from 'components/common';
import { queryCollectionEntities } from 'queries';
import { selectCollection, selectCollectionStatus } from 'selectors';


const messages = defineMessages({
  searchPlaceholder: {
    id: 'collection.navbar.search',
    defaultMessage: 'Search {collection}',
  }
});


export class CollectionScreen extends Component {
  constructor(props) {
    super(props);

    this.onUploadSuccess = this.onUploadSuccess.bind(this);
    this.onSearch = this.onSearch.bind(this);
  }

  onSearch(queryText) {
    const { history, collection, location, query } = this.props;

    const newQuery = query.set('q', queryText);

    history.push({
      pathname: location.pathname,
      hash: queryString.stringify({mode: 'search'}),
      search: newQuery.toLocation()
    });

  }

  onUploadSuccess() {
    const { history, location } = this.props;
    const parsedHash = queryString.parse(location.hash);

    parsedHash.mode = collectionViewIds.DOCUMENTS;
    delete parsedHash.type;

    history.push({
      pathname: location.pathname,
      search: location.search,
      hash: queryString.stringify(parsedHash),
    });
  }

  render() {
    const {
      collection, collectionId, activeMode, query, intl, extraBreadcrumbs,
    } = this.props;

    if (collection.isError) {
      return <ErrorScreen error={collection.error} />;
    }

    const searchScope = {
      listItem: <Collection.Label collection={collection} icon truncate={30} />,
      label: collection.label,
      onSearch: this.onSearch,
    };

    const operation = (
      <ControlGroup>
        <SearchBox
          onSearch={this.onSearch}
          placeholder={intl.formatMessage(messages.searchPlaceholder, { collection: collection.label })}
          query={query}
        />
        <Divider />
        <CollectionManageMenu collection={collection} view="collapsed" />
      </ControlGroup>
    );

    const breadcrumbs = (
      <Breadcrumbs operation={operation}>
        <Breadcrumbs.Collection key="collection" collection={collection} showCategory active />
        {extraBreadcrumbs}
      </Breadcrumbs>
    );

    return (
      <CollectionContextLoader collectionId={collectionId}>
        <Screen
          title={collection.label}
          description={collection.summary}
          searchScopes={[searchScope]}
        >
          {breadcrumbs}
          <DocumentDropzone
            canDrop={collection.writeable}
            collection={collection}
            onUploadSuccess={this.onUploadSuccess}
          >
            <SinglePane>
              <CollectionHeading collection={collection} />
              <div>
                <CollectionViews
                  collection={collection}
                  activeMode={activeMode}
                  isPreview={false}
                />
              </div>
            </SinglePane>
          </DocumentDropzone>
        </Screen>
      </CollectionContextLoader>
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  const { collectionId } = ownProps.match.params;
  const { location } = ownProps;
  const hashQuery = queryString.parse(location.hash);
  const query = queryCollectionEntities(location, collectionId);

  return {
    collectionId,
    collection: selectCollection(state, collectionId),
    query,
    status: selectCollectionStatus(state, collectionId),
    activeMode: hashQuery.mode || collectionViewIds.OVERVIEW,
  };
};


export default compose(
  withRouter,
  connect(mapStateToProps),
  injectIntl,
)(CollectionScreen);
