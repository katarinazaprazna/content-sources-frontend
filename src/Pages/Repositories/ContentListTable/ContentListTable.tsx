import {
  DataViewToolbar,
  DataViewTable,
  DataViewTh,
  DataView,
  DataViewState,
  useDataViewSort,
  useDataViewSelection,
  DataViewTextFilter,
  DataViewCheckboxFilter,
  DataViewTd,
} from '@patternfly/react-data-view';
import { ThProps, Td, Tr, Tbody, ActionsColumn, IAction } from '@patternfly/react-table';
import {
  useContentListQuery,
  useIntrospectRepositoryMutate,
  useTriggerSnapshot,
  useBulkDeleteContentItemMutate,
} from '../../../services/Content/ContentQueries';
import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  ContentItem,
  ContentOrigin,
  FilterData,
  IntrospectRepositoryRequestItem,
} from '../../../services/Content/ContentApi';
import { useAppContext } from '../../../middleware/AppContext';
import {
  Pagination,
  Button,
  EmptyState,
  EmptyStateActions,
  EmptyStateBody,
  EmptyStateFooter,
  Flex,
  FlexItem,
  TooltipPosition,
} from '@patternfly/react-core';
import { RepositoryIcon, CubesIcon } from '@patternfly/react-icons';
import useArchVersion from 'Hooks/useArchVersion';
import dayjs from 'dayjs';
import { useSearchParams, useNavigate, Outlet, useOutletContext } from 'react-router-dom';
import Hide from 'components/Hide/Hide';
import { ADD_ROUTE, EDIT_ROUTE, UPLOAD_ROUTE, DELETE_ROUTE } from 'Routes/constants';
import ConditionalTooltip from 'components/ConditionalTooltip/ConditionalTooltip';
import {
  BulkSelect,
  BulkSelectValue,
} from '@patternfly/react-component-groups/dist/dynamic/BulkSelect';
import flex from '@patternfly/react-styles/css/utilities/Flex/flex';
import { useQueryClient } from 'react-query';
import StatusIcon from './components/StatusIcon';
import spacing from '@patternfly/react-styles/css/utilities/Spacing/spacing';
import { SkeletonTableBody } from '@patternfly/react-component-groups';
import UploadRepositoryLabel from 'components/RepositoryLabels/UploadRepositoryLabel';
import UrlWithExternalIcon from '../../../components/UrlWithLinkIcon/UrlWithLinkIcon';
import ChangedArrows from './components/SnapshotListModal/components/ChangedArrows';
import { createUseStyles } from 'react-jss';
import PackageCount from './components/PackageCount';
import DeleteKebab from '../../../components/DeleteKebab/DeleteKebab';
import { DataViewFilters } from '@patternfly/react-data-view/dist/dynamic/DataViewFilters';
import { useContentListFilters, FilterLabelsMap } from './hooks/useContentListFilters';
import ContentOriginFilter from './components/ContentOriginFilter';
import CommunityRepositoryLabel from '../../../components/RepositoryLabels/CommunityRepositoryLabel';
import { DataViewTr } from '@patternfly/react-data-view/src/DataViewTable';

type ActionRowData = Pick<
  ContentItem,
  'uuid' | 'origin' | 'status' | 'snapshot' | 'last_snapshot_uuid' | 'last_snapshot_task'
>;

const useStyles = createUseStyles({
  snapshotInfoText: {
    marginRight: '16px',
  },
  inline: {
    display: 'flex',
  },
  disabledButton: {
    pointerEvents: 'auto',
    cursor: 'default',
  },
});

export const perPageKey = 'contentListPerPage';

const ContentListTable = () => {
  const { contentOrigin, setContentOrigin, features, rbac } = useAppContext();
  const [urlSearchParams, setUrlSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const classes = useStyles();

  const {
    archesDisplay,
    versionDisplay,
    isError: repositoryParamsIsError,
    error: repositoryParamsError,
  } = useArchVersion();

  // Column configuration combining display names and sort attributes
  // Selection is handled by DataView selection system, not individual columns
  const columns = [
    { name: 'Name', sortAttribute: 'name' },
    { name: 'Architecture', sortAttribute: 'distribution_arch' },
    { name: 'OS versions', sortAttribute: 'distribution_versions' },
    { name: 'Packages', sortAttribute: 'package_count' },
    { name: 'Last Introspection', sortAttribute: 'last_introspection_time' },
    { name: 'Status', sortAttribute: null }, // Non-sortable column
  ];

  const { sortBy, direction, onSort } = useDataViewSort({
    defaultDirection: 'asc',
  });

  // Construct a sort string for the backend
  const sortString = useMemo(() => {
    if (!sortBy || !direction) return '';
    const column = columns.find((col) => col.name === sortBy);
    if (!column || !column.sortAttribute) return '';
    return `${column.sortAttribute}:${direction}`;
  }, [sortBy, direction]);

  const getSortParams = (columnIndex: number): ThProps['sort'] => {
    // Find the index of the currently active sort column
    const activeSortIndex = sortBy ? columns.findIndex((col) => col.name === sortBy) : -1;

    return {
      sortBy: {
        index: activeSortIndex,
        direction: direction,
      },
      onSort: (_event, index, direction) => onSort(_event, columns[index].name, direction),
      columnIndex,
    };
  };

  const dataViewColumns: DataViewTh[] = columns.map((column, index) => ({
    cell: column.name,
    props: column.sortAttribute === null ? {} : { sort: getSortParams(index) },
  }));

  const [polling, setPolling] = useState(false);
  const [pollCount, setPollCount] = useState(0);

  const [page, setPage] = useState(1);
  const storedPerPage = Number(localStorage.getItem(perPageKey)) || 20;
  const [perPage, setPerPage] = useState(storedPerPage);

  // Used to force-reset the active attribute of DataViewFilters back to the first item (Name/URL)
  const [filtersActiveAttributeResetKey, setFiltersActiveAttributeResetKey] = useState(0);

  const {
    filters,
    onSetFilters,
    clearAllFilters,
    osFilterOptions,
    archFilterOptions,
    statusFilterOptions,
    isFiltered,
  } = useContentListFilters(queryClient);

  const resetFiltersAndPagination = useCallback(() => {
    clearAllFilters();
    // Nudge DataViewFilters to reinitialize the active attribute menu to the first filter
    setFiltersActiveAttributeResetKey((current) => current + 1);
    // Reset pagination when filters are cleared to avoid empty pages
    setPage(1);
  }, [clearAllFilters, setFiltersActiveAttributeResetKey, setPage]);

  const originParam = urlSearchParams.get('origin');

  const isRedHatRepository =
    contentOrigin.length === 1 && contentOrigin[0] === ContentOrigin.REDHAT;
  const isCommunityRepository =
    contentOrigin.length === 1 && contentOrigin[0] === ContentOrigin.COMMUNITY;
  const isRedHatOrCommunity =
    contentOrigin.length === 2 &&
    contentOrigin.includes(ContentOrigin.COMMUNITY) &&
    contentOrigin.includes(ContentOrigin.REDHAT);

  const hasReadOnlyAccess =
    !rbac?.repoWrite || isRedHatRepository || isCommunityRepository || isRedHatOrCommunity;

  useEffect(() => {
    if (!features?.snapshots?.accessible) return;

    if (originParam === ContentOrigin.REDHAT) setContentOrigin([ContentOrigin.REDHAT]);
  }, [originParam, features?.snapshots?.accessible, setContentOrigin]);

  useEffect(() => {
    if (!features?.snapshots?.accessible) return;

    if (isRedHatRepository && originParam !== ContentOrigin.REDHAT) {
      setUrlSearchParams({ origin: ContentOrigin.REDHAT });
    } else if (!isRedHatRepository && originParam) {
      setUrlSearchParams({});
    }
  }, [
    contentOrigin,
    features?.snapshots?.accessible,
    isRedHatRepository,
    originParam,
    setUrlSearchParams,
  ]);

  const {
    isLoading,
    isFetching,
    error,
    isError,
    data = { data: [], meta: { count: 0, limit: 20, offset: 0 } },
  } = useContentListQuery(page, perPage, filters, sortString, contentOrigin, true, polling);

  useEffect(() => {
    if (isError) {
      setPolling(false);
      setPollCount(0);
      return;
    }
    const containsPending = data?.data?.some(({ status }) => status === 'Pending' || status === '');
    if (polling && containsPending) {
      // Count each consecutive time polling occurs
      setPollCount(pollCount + 1);
    }
    if (polling && !containsPending) {
      // We were polling, but now the data is valid, we stop the count.
      setPollCount(0);
    }
    if (pollCount > 40) {
      // If polling occurs 40 times in a row, we stop it. Likely a data/kafka issue has occurred with the API.
      return setPolling(false);
    }
    // This sets the polling state based whether the data contains any "Pending" status
    return setPolling(containsPending);
  }, [data?.data]);

  // Error is caught in the wrapper component
  if (isError) throw error;
  if (repositoryParamsIsError) throw repositoryParamsError;

  const {
    data: contentList = [],
    meta: { count = 0 },
  } = data;

  // When Red Hat repositories return 0 without filters, raise an error
  if (!isFiltered && count === 0 && !isFetching && isRedHatRepository) {
    throw new Error('Unable to load Red Hat repositories');
  }

  const onSetPage = (_, newPage: number) => setPage(newPage);

  const onPerPageSelect = (_, newPerPage: number, newPage: number) => {
    localStorage.setItem(perPageKey, newPerPage.toString());
    setPerPage(newPerPage);
    setPage(newPage);
  };

  // Common pagination props to avoid duplication
  const paginationProps = {
    isDisabled: isLoading,
    itemCount: count,
    perPage,
    page,
    onSetPage,
    onPerPageSelect,
  };

  const lastIntrospectionDisplay = (time?: string): string =>
    time === '' || time === undefined ? 'Never' : dayjs(time).fromNow();

  // Repository introspection status
  const { mutateAsync: introspectRepository } = useIntrospectRepositoryMutate(
    queryClient,
    page,
    perPage,
    contentOrigin,
    filters,
    sortString,
  );

  // Ensure that repository statuses are properly displayed
  const introspectRepoForUuid = (uuid: string): Promise<void> =>
    introspectRepository({ uuid: uuid, reset_count: true } as IntrospectRepositoryRequestItem);

  const selection = useDataViewSelection({ matchOption: (a, b) => a.id === b.id });
  const { selected, onSelect, isSelected } = selection;

  // Convert selected rows to selected repositories (required by Outlet context)
  const selectedRepositories = useMemo(() => {
    const selectedMap = new Map<string, ContentItem>();
    selected.forEach((selectedRow) => {
      const contentItem = contentList.find((item) => item.uuid === selectedRow.id);
      if (contentItem) {
        selectedMap.set(contentItem.uuid, contentItem);
      }
    });
    return selectedMap;
  }, [selected, contentList]);

  // Function to clear selected repositories (required by Outlet context)
  const clearSelectedRepositories = useMemo(() => () => onSelect(false), [onSelect]);

  useBulkDeleteContentItemMutate(
    queryClient,
    selectedRepositories,
    page,
    perPage,
    contentOrigin,
    filters,
    sortString,
  );

  const showPendingTooltip = (
    snapshotStatus: string | undefined,
    introspectStatus: string | undefined,
  ) => {
    if (!snapshotStatus && !introspectStatus) {
      return 'Introspection or snapshotting is in progress';
    } else if (snapshotStatus === 'running' || snapshotStatus === 'pending') {
      return 'Snapshotting is in progress';
    } else if (introspectStatus === 'Pending') {
      return 'Introspection is in progress';
    }
  };

  const ContentInformationCell = ({
    rowData: { name, url, last_snapshot, origin },
  }: {
    rowData: Pick<ContentItem, 'name' | 'url' | 'last_snapshot' | 'origin'>;
  }) => (
    <>
      {name}
      <Hide hide={origin !== ContentOrigin.UPLOAD}>
        <UploadRepositoryLabel />
      </Hide>
      <Hide hide={origin !== ContentOrigin.COMMUNITY}>
        <CommunityRepositoryLabel />
      </Hide>
      <Hide hide={origin === ContentOrigin.UPLOAD}>
        <UrlWithExternalIcon href={url} />
      </Hide>
      <Hide hide={!features?.snapshots?.accessible}>
        <Flex>
          <FlexItem className={classes.snapshotInfoText}>
            {last_snapshot
              ? `Last snapshot ${dayjs(last_snapshot?.created_at).fromNow()}`
              : 'No snapshot yet'}
          </FlexItem>
          <Hide hide={!last_snapshot}>
            <FlexItem className={classes.inline}>
              <FlexItem className={classes.snapshotInfoText}>Changes:</FlexItem>
              <ChangedArrows
                addedCount={last_snapshot?.added_counts?.['rpm.package'] || 0}
                removedCount={last_snapshot?.removed_counts?.['rpm.package'] || 0}
              />
            </FlexItem>
          </Hide>
        </Flex>
      </Hide>
    </>
  );

  const { mutateAsync: triggerSnapshotMutation } = useTriggerSnapshot(queryClient);

  const triggerSnapshot = async (uuid: string): Promise<void> => {
    await triggerSnapshotMutation(uuid);
  };

  const triggerIntrospectionAndSnapshot = async (repoUuid: string): Promise<void> => {
    clearSelectedRepositories();
    await introspectRepoForUuid(repoUuid);
    await triggerSnapshot(repoUuid);
  };

  const rowActions = useCallback(
    (rowData: ActionRowData): IAction[] =>
      isRedHatRepository ||
      rowData.origin === ContentOrigin.REDHAT ||
      rowData.origin === ContentOrigin.COMMUNITY
        ? features?.snapshots?.accessible
          ? [
              {
                isDisabled:
                  isFetching ||
                  !rowData.snapshot ||
                  !(rowData.snapshot && rowData.last_snapshot_uuid),

                ouiaId: 'kebab_view_snapshots',
                title:
                  rowData.snapshot && rowData.last_snapshot_uuid
                    ? 'View all snapshots'
                    : 'No snapshots yet',
                onClick: () => {
                  navigate(`${rowData.uuid}/snapshots`);
                },
              },
            ]
          : []
        : [
            ...(rbac?.repoWrite
              ? [
                  {
                    isDisabled: isFetching || rowData?.status === 'Pending',
                    title: 'Edit',
                    ouiaId: 'kebab_edit',
                    onClick: () => {
                      navigate(`${rowData.uuid}/${EDIT_ROUTE}`);
                    },
                  },
                  ...(rowData.origin === ContentOrigin.UPLOAD
                    ? [
                        {
                          isDisabled: isFetching || rowData?.status === 'Pending',
                          title: 'Upload content',
                          ouiaId: 'kebab_upload_content',
                          onClick: () => {
                            navigate(`${rowData.uuid}/${UPLOAD_ROUTE}`);
                          },
                        },
                      ]
                    : []),
                ]
              : []),
            ...(features?.snapshots?.accessible
              ? [
                  {
                    isDisabled: isFetching || !rowData.last_snapshot_uuid,
                    title: rowData.last_snapshot_uuid ? 'View all snapshots' : 'No snapshots yet',
                    ouiaId: 'kebab_view_snapshots',
                    onClick: () => {
                      navigate(`${rowData.uuid}/snapshots`);
                    },
                  },
                  ...(rbac?.repoWrite && rowData.origin !== ContentOrigin.UPLOAD
                    ? [
                        {
                          id: 'actions-column-snapshot',
                          className:
                            isFetching || rowData?.status === 'Pending' || !rowData.snapshot
                              ? classes.disabledButton
                              : '',
                          isDisabled:
                            isFetching || rowData?.status === 'Pending' || !rowData.snapshot,
                          title: 'Trigger snapshot',
                          ouiaId: 'kebab_trigger_snapshots',
                          onClick: () => {
                            triggerIntrospectionAndSnapshot(rowData?.uuid);
                          },
                          tooltipProps: !rowData.snapshot
                            ? {
                                content: 'Snapshots disabled for this repository.',
                                position: TooltipPosition.left,
                                triggerRef: () =>
                                  document.getElementById('actions-column-snapshot') ||
                                  document.body,
                              }
                            : undefined,
                        },
                      ]
                    : []),
                ]
              : []),
            ...(rbac?.repoWrite && !rowData?.snapshot
              ? [
                  {
                    isDisabled: isFetching || rowData?.status == 'Pending',
                    title: 'Introspect now',
                    ouiaId: 'kebab_introspect_now',
                    onClick: () =>
                      introspectRepoForUuid(rowData?.uuid).then(clearSelectedRepositories),
                  },
                ]
              : []),
            ...(rbac?.repoWrite
              ? [
                  { isSeparator: true },
                  {
                    title: 'Delete',
                    ouiaId: 'kebab_delete',
                    onClick: () => navigate(`${DELETE_ROUTE}?repoUUID=${rowData.uuid}`),
                  },
                ]
              : []),
          ],
    [isFetching, selectedRepositories, isRedHatRepository],
  );

  const ContentListActionRow = ({ rowData }: { rowData: ActionRowData }) => (
    <Hide hide={!rowActions(rowData)?.length}>
      <ConditionalTooltip
        content={showPendingTooltip(rowData?.last_snapshot_task?.status, rowData.status)}
        show={!isRedHatRepository && rowData?.status === 'Pending'}
      >
        <ActionsColumn items={rowActions(rowData)} />
      </ConditionalTooltip>
    </Hide>
  );

  // Format rows for DataView using DataViewTd objects
  // Selection is handled by DataView selection system using id and isSelected
  const rows: DataViewTr[] = contentList.map(
    ({
      uuid,
      name,
      url,
      origin,
      last_snapshot,
      snapshot,
      last_snapshot_uuid,
      distribution_arch,
      distribution_versions,
      last_introspection_time,
      failed_introspections_count,
      last_introspection_error,
      last_snapshot_task,
      package_count,
      status,
    }: ContentItem) => ({
      id: uuid, // Used by useDataViewSelection for matching
      origin: origin, // Used to determine if a repo is deletable
      row: [
        { cell: <ContentInformationCell rowData={{ name, url, last_snapshot, origin }} /> },
        { cell: archesDisplay(distribution_arch) },
        { cell: versionDisplay(distribution_versions) },
        { cell: <PackageCount rowData={{ uuid, status, package_count }} /> },
        { cell: lastIntrospectionDisplay(last_introspection_time) },
        {
          cell: (
            <StatusIcon
              rowData={{
                uuid,
                status,
                failed_introspections_count,
                last_introspection_time,
                last_introspection_error,
                last_snapshot_task,
              }}
              retryHandler={introspectRepoForUuid}
            />
          ),
        },
        {
          cell: (
            <ContentListActionRow
              rowData={{
                uuid,
                origin,
                status,
                snapshot,
                last_snapshot_uuid,
                last_snapshot_task,
              }}
            />
          ),
          props: { isActionCell: true },
        },
      ] as DataViewTd[],
    }),
  );

  const handleBulkSelect = (value: BulkSelectValue) => {
    if (value === BulkSelectValue.none) {
      onSelect(false);
    } else if (value === BulkSelectValue.page) {
      onSelect(
        true,
        contentList.map(({ uuid, origin }) => ({ id: uuid, origin })),
      );
    } else if (value === BulkSelectValue.nonePage) {
      onSelect(
        false,
        contentList.map(({ uuid, origin }) => ({ id: uuid, origin })),
      );
    }
  };

  const pageSelected = rows.length > 0 && rows.every(isSelected);

  const ouiaId = 'custom_repositories_table';

  // We do not reuse the shared EmptyTableState component here. The DataView
  // implementation needs slightly different behavior. EmptyTableState is also used by
  // other tables that are not DataView-based, so changing it now would risk
  // breaking existing logic in those components
  const EmptyTable = () => {
    const itemName =
      contentOrigin.length >= 2 &&
      contentOrigin.includes(ContentOrigin.EXTERNAL) &&
      contentOrigin.includes(ContentOrigin.UPLOAD)
        ? 'custom repositories'
        : 'Red Hat repositories';

    const titleText = isFiltered ? `No ${itemName} match the filter criteria` : `No ${itemName}`;

    return (
      <Tbody>
        <Tr key='empty' ouiaId={`${ouiaId}-tr-empty`}>
          <Td colSpan={columns.length}>
            <EmptyState
              icon={isFiltered ? CubesIcon : RepositoryIcon}
              titleText={titleText}
              headingLevel='h4'
            >
              <EmptyStateBody>
                {isFiltered
                  ? 'Clear all filters to show more results.'
                  : 'To get started, create a custom repository.'}
              </EmptyStateBody>
              <EmptyStateFooter>
                <EmptyStateActions>
                  {isFiltered ? (
                    <Button
                      variant='primary'
                      ouiaId='clear_filters'
                      onClick={resetFiltersAndPagination}
                    >
                      Clear all filters
                    </Button>
                  ) : (
                    <ConditionalTooltip
                      content='You do not have the required permissions to perform this action.'
                      show={!rbac?.repoWrite}
                      setDisabled
                    >
                      <Button
                        variant='primary'
                        onClick={() => navigate(ADD_ROUTE)}
                        isDisabled={isLoading || isRedHatOrCommunity}
                      >
                        Add repositories
                      </Button>
                    </ConditionalTooltip>
                  )}
                </EmptyStateActions>
              </EmptyStateFooter>
            </EmptyState>
          </Td>
        </Tr>
      </Tbody>
    );
  };

  const [activeState, setActiveState] = useState<DataViewState | undefined>(DataViewState.loading);

  useEffect(() => {
    if (isLoading) {
      setActiveState(DataViewState.loading);
    } else {
      setActiveState(count === 0 ? DataViewState.empty : undefined);
    }
  }, [count, isLoading]);

  const shouldEnableSelection =
    !hasReadOnlyAccess &&
    activeState !== DataViewState.empty &&
    activeState !== DataViewState.loading;

  const isPartialSelection = rows.some(isSelected);

  const allSelectedReposDeletable = [...selected.values()].every(
    (repo) => repo.origin !== ContentOrigin.REDHAT && repo.origin !== ContentOrigin.COMMUNITY,
  );

  // Synchronize selection with the origin filter via targeted deselection (non-destructive)
  useEffect(() => {
    // Do nothing when nothing is selected or when no origin constraint is applied
    if (!selected.length || contentOrigin.length === 0) return;

    const isRedHatOnlySelected =
      contentOrigin.includes(ContentOrigin.REDHAT) && contentOrigin.length === 1;

    // If only Red Hat origin is active, don't modify selection
    // Preserving selection avoids surprising clears of custom repositories the user may have selected previously
    if (isRedHatOnlySelected) return;

    // Remove only repositories whose origin does not match the active filter (keep valid selections)
    const invalidSelections = selected.filter(
      (selectedRepo) => !contentOrigin.includes(selectedRepo.origin),
    );
    if (invalidSelections.length) {
      onSelect(false, invalidSelections);
    }
  }, [contentOrigin, selected, onSelect]);

  return (
    <>
      <DataView
        data-ouia-component-id='content_list_page'
        activeState={activeState}
        {...(shouldEnableSelection && { selection })}
        className={`${spacing.pxLg} ${spacing.ptMd} ${flex.flexDirectionColumn}`}
      >
        <DataViewToolbar
          clearAllFilters={resetFiltersAndPagination}
          filters={
            <>
              <DataViewFilters
                onChange={(key, newValues) => {
                  // Apply filters and reset to the first page to reflect a new result set
                  onSetFilters(newValues);
                  setPage(1);
                }}
                values={filters}
              >
                <DataViewTextFilter
                  key={`search-${filtersActiveAttributeResetKey}`}
                  filterId='search'
                  ouiaId='filter_search'
                  title={FilterLabelsMap.Search}
                  placeholder='Filter by name/url'
                  isDisabled={isLoading}
                />
                <DataViewCheckboxFilter
                  filterId='versions'
                  ouiaId='filter_version'
                  aria-label='filter OS version'
                  title={FilterLabelsMap.Versions}
                  placeholder='Filter by OS version'
                  options={osFilterOptions}
                />
                <DataViewCheckboxFilter
                  filterId='arches'
                  ouiaId='filter_arch'
                  aria-label='filter architecture'
                  title={FilterLabelsMap.Arches}
                  placeholder='Filter by architecture'
                  options={archFilterOptions}
                />
                <DataViewCheckboxFilter
                  filterId='statuses'
                  ouiaId='filter_status'
                  aria-label='filter status'
                  title={FilterLabelsMap.Statuses}
                  placeholder='Filter by status'
                  options={statusFilterOptions}
                />
              </DataViewFilters>
              <ContentOriginFilter
                contentOrigin={contentOrigin}
                setContentOrigin={setContentOrigin}
              />
            </>
          }
          bulkSelect={
            <Hide hide={hasReadOnlyAccess}>
              <BulkSelect
                isDataPaginated
                pageCount={contentList.length}
                totalCount={count}
                selectedCount={selected.length}
                pageSelected={pageSelected}
                pagePartiallySelected={!pageSelected && isPartialSelection}
                onSelect={handleBulkSelect}
                menuToggleCheckboxProps={{
                  id: 'bulk-select-checkbox',
                  isDisabled:
                    activeState == DataViewState.empty || activeState == DataViewState.loading,
                }}
              />
            </Hide>
          }
          actions={
            <Flex>
              <FlexItem>
                <ConditionalTooltip
                  content='You do not have the required permissions to perform this action.'
                  show={!rbac?.repoWrite}
                  setDisabled
                >
                  <Button
                    id='createContentSourceButton'
                    ouiaId='create_content_source'
                    variant='primary'
                    isDisabled={
                      isLoading ||
                      isRedHatRepository ||
                      isCommunityRepository ||
                      isRedHatOrCommunity
                    }
                    onClick={() => navigate(ADD_ROUTE)}
                  >
                    Add repositories
                  </Button>
                </ConditionalTooltip>
              </FlexItem>
              <FlexItem>
                <ConditionalTooltip
                  content={
                    !rbac?.repoWrite
                      ? 'You do not have the required permissions to perform this action.'
                      : 'Some selected repositories (Red Hat or EPEL) cannot be deleted.'
                  }
                  show={!rbac?.repoWrite || !allSelectedReposDeletable}
                  setDisabled
                >
                  <DeleteKebab
                    isDisabled={!rbac?.repoWrite || !allSelectedReposDeletable}
                    atLeastOneRepoChecked={isPartialSelection}
                    numberOfReposChecked={selected.length}
                    toggleOuiaId='custom_repositories_kebab_toggle'
                  />
                </ConditionalTooltip>
              </FlexItem>
            </Flex>
          }
          pagination={
            <Pagination
              id='top-pagination-id'
              widgetId='topPaginationWidgetId'
              {...paginationProps}
              isCompact
            />
          }
        />
        <DataViewTable
          aria-label='Custom repositories table'
          ouiaId={ouiaId}
          variant='compact'
          columns={dataViewColumns}
          rows={rows}
          bodyStates={{
            empty: <EmptyTable />,
            loading: <SkeletonTableBody rowsCount={perPage} columnsCount={columns.length} />,
          }}
        />
        <DataViewToolbar
          pagination={
            <Pagination
              id='bottom-pagination-id'
              widgetId='bottomPaginationWidgetId'
              {...paginationProps}
              variant='bottom'
            />
          }
        />
      </DataView>
      {/* This ensures that the modal doesn't temporarily flash on the initial render */}
      <Hide hide={isLoading}>
        <Outlet
          context={{
            clearCheckedRepositories: clearSelectedRepositories,
            deletionContext: {
              page: page,
              perPage: perPage,
              filterData: filters,
              contentOrigin: contentOrigin,
              sortString: sortString,
              checkedRepositories: selectedRepositories,
            },
          }}
        />
      </Hide>
    </>
  );
};

export const useContentListOutletContext = () =>
  useOutletContext<{
    clearCheckedRepositories: () => void;
    deletionContext: {
      page: number;
      perPage: number;
      filterData: FilterData;
      contentOrigin: ContentOrigin[];
      sortString: string;
      checkedRepositories: Map<string, ContentItem>;
    };
  }>();

export default ContentListTable;
