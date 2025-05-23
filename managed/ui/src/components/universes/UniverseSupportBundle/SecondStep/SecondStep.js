import { useRef, useState } from 'react';
import { useQuery } from 'react-query';
import { useSelector } from 'react-redux';
import { useEffectOnce } from 'react-use';
import { Box, Collapse, makeStyles, Typography, useTheme } from '@material-ui/core';
import { Alert, DropdownButton, MenuItem } from 'react-bootstrap';
import moment from 'moment';
import momentLocalizer from 'react-widgets-moment';

import { YBLoading } from '../../../common/indicators';
import { YBButton, YBCheckBox } from '../../../common/forms/fields';
import { YBButton as YBRedesignedButton } from '../../../../redesign/components';
import { YBInput, YBLabel } from '../../../../redesign/components';
import { DateTimePicker } from 'react-widgets';
import { CustomDateRangePicker } from '../DateRangePicker/DateRangePicker';
import { convertToISODateString } from '../../../../redesign/helpers/DateUtils';
import { fetchGlobalRunTimeConfigs } from '../../../../api/admin';
import { UniverseState } from '../../helpers/universeHelpers';
import { DATE_FORMAT } from '../../../backupv2/common/BackupUtils';
import YBInfoTip from '../../../common/descriptors/YBInfoTip';
import { ReactComponent as AddIcon } from '../../../../redesign/assets/add2.svg';
import { ReactComponent as EditIcon } from '../../../../redesign/assets/edit2.svg';
import { EditCustomPrometheusQueriesModal } from '../../../../redesign/features/universe/universe-actions/support-bundle/EditCustomPrometheusQueriesModal';
import { formatBytes } from '../../../xcluster/ReplicationUtils';
import { fetchEstimatedSupportBundleSize } from '../UniverseSupportBundleModal';
import { handleServerError } from '../../../../utils/errorHandlingUtils';

momentLocalizer(moment);

const useStyles = makeStyles((theme) => ({
  componentCheckBox: {
    display: 'flex',
    alignItems: 'center'
  },
  estimatedComponentSize: {
    marginLeft: theme.spacing(0.5)
  },
  editIcon: {
    color: theme.palette.primary[600]
  },
  openCustomPrometheusQueriesButton: {
    color: theme.palette.primary[600]
  },
  customPrometheusQueriesSection: {
    display: 'flex',

    marginTop: theme.spacing(2)
  },
  loadingIcon: {
    margin: 0
  }
}));

const CUSTOM = 'custom';
const CUSTOM_WITH_VALUE = 'customWithValue';

const filterTypes = [
  { label: 'Last 24 hrs', type: 'days', value: '1' },
  { label: 'Last 3 days', type: 'days', value: '3' },
  { label: 'Last 7 days', type: 'days', value: '7' },
  { type: 'divider' },
  { label: 'Custom', type: CUSTOM, value: CUSTOM }
];

const filterTypePromDump = [
  { label: 'Last 15 mins', type: 'minutes', value: '15' },
  { label: 'Last 1 hour', type: 'hours', value: '1' },
  { label: 'Last 3 hours', type: 'hours', value: '3' },
  { type: 'divider' },
  { label: 'Custom', type: CUSTOM, value: CUSTOM }
];

export const selectionOptions = [
  { label: 'All', value: 'All' },
  { label: 'Application logs', value: 'ApplicationLogs' },
  { label: 'System Logs', value: 'SystemLogs' },
  { label: 'YBA Metadata', value: 'YbaMetadata' },
  { label: 'Universe logs', value: 'UniverseLogs' },
  { label: 'Output files', value: 'OutputFiles' },
  { label: 'Error files', value: 'ErrorFiles' },
  { label: 'G-Flag configurations', value: 'GFlags' },
  { label: 'Instance files', value: 'Instance' },
  { label: 'Consensus meta files', value: 'ConsensusMeta' },
  { label: 'Tablet meta files', value: 'TabletMeta' },
  { label: 'Tablet Report', value: 'TabletReport' },
  { label: 'Node agent logs', value: 'NodeAgent' },
  { label: 'Core Files', value: 'CoreFiles' },
  { label: 'YB-Controller logs', value: 'YbcLogs' },
  { label: 'Kubernetes Info', value: 'K8sInfo' },
  { label: 'Prometheus metrics', value: 'PrometheusMetrics' }
];

export const prometheusMetricsOptions = [
  { label: 'Master Export', value: 'MASTER_EXPORT' },
  { label: 'Node Export', value: 'NODE_EXPORT' },
  { label: 'Platform', value: 'PLATFORM' },
  { label: 'Prometheus', value: 'PROMETHEUS' },
  { label: 'TServer Export', value: 'TSERVER_EXPORT' },
  { label: 'YCQL Export', value: 'CQL_EXPORT' },
  { label: 'YSQL Export', value: 'YSQL_EXPORT' }
];

const ONE_GB_IN_BYTES = 1_07_37_41_824;

const CoreFilesProps = {
  maxNumRecentCores: 1,
  maxCoreFileSize: 25 * ONE_GB_IN_BYTES
};

const getBackDate = (amount, type) => {
  return moment().subtract(amount, type).toDate();
};

const getBackDateBeforeDate = (amount, type, date) => {
  return moment(date).subtract(amount, type).toDate();
};

export const DEFAULT_PROMETHEUS_METRICS_PARAMS = {
  promDumpStartDate: getBackDate(15, 'minutes'),
  promDumpEndDate: new Date(),
  prometheusMetricsOptionsValue: prometheusMetricsOptions.map(() => true),
  isPromDumpDateTypeCustom: false,
  promDumpDateType: filterTypePromDump[0],
  prometheusQueries: []
};

export const updateOptions = (
  dateType,
  selectionOptionsValue,
  setIsDateTypeCustom,
  coreFileParams,
  prometheusMetricsParams,
  startDate = new Date(),
  endDate = new Date()
) => {
  let payloadObj = {};
  if (dateType.value === CUSTOM) {
    setIsDateTypeCustom(true);
    return;
  }

  if (dateType.value !== CUSTOM_WITH_VALUE && dateType.value !== CUSTOM) {
    startDate = getBackDate(+dateType.value, dateType.type);
    setIsDateTypeCustom(false);
  }

  const components = [];
  selectionOptionsValue.forEach((selectionOption, index) => {
    if (index !== 0 && selectionOption) {
      components.push(selectionOptions[index].value);
    }
  });
  payloadObj = {
    startDate: convertToISODateString(startDate),

    endDate: convertToISODateString(endDate),
    components: components
  };
  components.forEach((component) => {
    if (component === 'CoreFiles') {
      payloadObj = { ...payloadObj, ...coreFileParams };
    }

    if (component === 'PrometheusMetrics') {
      // if promDumpDateType: custom
      if (prometheusMetricsParams.promDumpDateType.value === CUSTOM) {
        prometheusMetricsParams.promDumpStartDate = startDate;
        prometheusMetricsParams.promDumpEndDate = endDate;
      }

      // if promDumpDateType: not-custom
      if (!prometheusMetricsParams.isPromDumpDateTypeCustom) {
        prometheusMetricsParams.promDumpStartDate = getBackDateBeforeDate(
          +prometheusMetricsParams.promDumpDateType.value,
          prometheusMetricsParams.promDumpDateType.type,
          endDate
        );
        prometheusMetricsParams.promDumpEndDate = endDate;
      }

      // if promDumpDateType: customWithValue -or custom
      payloadObj = {
        ...payloadObj,
        promDumpStartDate: convertToISODateString(prometheusMetricsParams.promDumpStartDate)
      };
      payloadObj = {
        ...payloadObj,
        promDumpEndDate: convertToISODateString(prometheusMetricsParams.promDumpEndDate)
      };

      const prometheusMetricsTypes = [];
      prometheusMetricsParams.prometheusMetricsOptionsValue.forEach((selectionOption, index) => {
        if (selectionOption) {
          prometheusMetricsTypes.push(prometheusMetricsOptions[index].value);
        }
      });
      const promQueries = {};
      prometheusMetricsParams.prometheusQueries.forEach((prometheusQuery) => {
        const folderName = prometheusQuery.folderName;
        const query = prometheusQuery.query;
        if (folderName && query) {
          promQueries[folderName] = query;
        }
      });
      payloadObj = {
        ...payloadObj,
        prometheusMetricsTypes: prometheusMetricsTypes,
        promQueries: promQueries
      };
    }
  });
  return payloadObj;
};

/**
 * The estimated sizes returned by the backend is:
 * private Map<String, Map<String, Long>> data;
 * Source: managed/src/main/java/com/yugabyte/yw/forms/SupportBundleSizeEstimateResponse.java
 *
 * The outer map keys correspond to universe node names. An additional key `YBA` is added
 * to the outer map to store the global component sizes.
 * The inner map uses component names as keys and stores the estimated size for each component.
 *
 * This function will return a flattened map of component name to estimated component size.
 */
const getPerComponentEstimatedSize = (supportBundleSizeEstimateResponse) => {
  const supportBundleSizeEstimates = supportBundleSizeEstimateResponse?.data;
  if (typeof supportBundleSizeEstimates !== 'object' || supportBundleSizeEstimates === null) {
    return {};
  }

  return Object.values(supportBundleSizeEstimates).reduce(
    (estimatedSupportBundleSizes, componentSizeMap) => {
      for (const [component, estimatedSizeBytes] of Object.entries(componentSizeMap)) {
        estimatedSupportBundleSizes[component] =
          (estimatedSupportBundleSizes[component] ?? 0) + estimatedSizeBytes;
      }
      return estimatedSupportBundleSizes;
    },
    {}
  );
};

/**
 * Returns a list of selected component values. These values correspond to the value field in
 * `selectionOptions` and the component name used in the backend.
 */
const getSelectedComponents = (selectionOptions, selectionOptionsValue) =>
  selectionOptions.reduce((selectedComponents, component, index) => {
    if (selectionOptionsValue[index]) {
      selectedComponents.push(component.value);
    }
    return selectedComponents;
  }, []);

const getTotalSupportBundleEstimatedSize = (selectedComponents, perComponentEstimatedSize) =>
  selectedComponents.reduce(
    (totalSupportBundleEstimatedSize, componentName) =>
      totalSupportBundleEstimatedSize + (perComponentEstimatedSize[componentName] ?? 0),
    0
  );

export const SecondStep = ({
  onOptionsChange,
  isK8sUniverse,
  universeStatus,
  payload,
  universeUUID
}) => {
  const [selectedFilterType, setSelectedFilterType] = useState(filterTypes[0]);
  const [selectedFilterTypePromDump, setSelectedFilterTypePromDump] = useState(
    filterTypePromDump[0]
  );
  const [selectionOptionsValue, setSelectionOptionsValue] = useState(
    selectionOptions.map(() => true)
  );
  const [prometheusMetricsOptionsValue, setPrometheusMetricsOptionsValue] = useState(
    // prometheus export is not required by default
    prometheusMetricsOptions.map(() => true)
  );
  const [coreFileParams, setCoreFileParams] = useState(CoreFilesProps);
  const [prometheusMetricsParams, setPrometheusMetricsParams] = useState(
    DEFAULT_PROMETHEUS_METRICS_PARAMS
  );
  const [isDateTypeCustom, setIsDateTypeCustom] = useState(false);
  const [isPromDumpDateTypeCustom, setIsPromDumpDateTypeCustom] = useState(false);
  const [startDate, setStartDate] = useState(getBackDate(1, 'days'));
  const [endDate, setEndDate] = useState(new Date());
  const [promDumpStartDate, setPromDumpStartDate] = useState(
    getBackDateBeforeDate(15, 'minutes', endDate)
  );
  const [promDumpEndDate, setPromDumpEndDate] = useState(endDate);
  const outerRefs = useRef([]);
  const innerRefs = useRef([]);
  const featureFlags = useSelector((state) => state.featureFlags);
  const { data: globalRuntimeConfigs, isLoading } = useQuery(['globalRuntimeConfigs'], () =>
    fetchGlobalRunTimeConfigs(true).then((res) => res.data)
  );
  const [isExpandedCoreFiles, setIsExpandedCoreFiles] = useState(false);
  const [isExpandedPromMetrics, setIsExpandedPromMetrics] = useState(false);
  const [
    isEditCustomPrometheusQueriesModalOpen,
    setIsEditCustomPrometheusQueriesModalOpen
  ] = useState(false);
  const [isEstimatedSupportBundleSizeStale, setIsEstimatedSupportBundleSizeStale] = useState(false);
  const theme = useTheme();
  const classes = useStyles();

  const estimateSupportBundleSizeQuery = useQuery(
    'estimatedSupportBundleSize',
    () => fetchEstimatedSupportBundleSize(universeUUID, payload),
    {
      // We set enabled to false so the only time this query fires is when we
      // explicitly call estimatedSupportBundleSizeQuery.refetch().
      // We set cacheTime to 0 because we prefer to get a fresh estimate with the
      // current payload every time the user asks for one.
      enabled: false,
      cacheTime: 0,
      onSuccess: () => {
        setIsEstimatedSupportBundleSizeStale(false);
      },
      onError: (error) => {
        handleServerError(error, {
          customErrorLabel: 'Failed fetch estimated support bundle size.'
        });
      }
    }
  );

  const getIndex = (key) => selectionOptions.findIndex((e) => e.value === key);
  const isSelected = (key) => selectionOptionsValue[getIndex(key)];

  const handleOptionsChange = (changedOptions) => {
    setIsEstimatedSupportBundleSizeStale(true);
    onOptionsChange(changedOptions);
  };

  useEffectOnce(() => {
    //This is to just check if selectiedOptions is intact with payload in universe Support bundle file
    const changedOptions = updateOptions(
      selectedFilterType,
      selectionOptionsValue,
      setIsDateTypeCustom,
      coreFileParams,
      prometheusMetricsParams
    );
    handleOptionsChange(changedOptions);
  });

  if (isLoading)
    return (
      <Box height="620px" display="flex" alignItems={'center'} justifyContent={'center'}>
        <YBLoading />
      </Box>
    );
  const isCoreFileEnabled =
    globalRuntimeConfigs?.configEntries?.find(
      (c) => c.key === 'yb.support_bundle.allow_cores_collection'
    )?.value === 'true';

  const coreFilesIndex = getIndex('CoreFiles');
  if (!isCoreFileEnabled && coreFilesIndex > -1) {
    selectionOptions.splice(coreFilesIndex, 1);
    selectionOptionsValue.splice(coreFilesIndex, 1);
    const changedOptions = updateOptions(
      selectedFilterType,
      selectionOptionsValue,
      setIsDateTypeCustom,
      coreFileParams,
      prometheusMetricsParams
    );
    handleOptionsChange(changedOptions);
  }

  const ybcLogsIndex = getIndex('YbcLogs');
  if (!featureFlags.test.enableYbc && !featureFlags.released.enableYbc && ybcLogsIndex > -1) {
    selectionOptions.splice(ybcLogsIndex, 1);
    selectionOptionsValue.splice(ybcLogsIndex, 1);
    const changedOptions = updateOptions(
      selectedFilterType,
      selectionOptionsValue,
      setIsDateTypeCustom,
      coreFileParams,
      prometheusMetricsParams
    );
    handleOptionsChange(changedOptions);
  }

  const K8sInfoIndex = getIndex('K8sInfo');
  if (!isK8sUniverse && K8sInfoIndex > -1) {
    selectionOptions.splice(K8sInfoIndex, 1);
    selectionOptionsValue.splice(K8sInfoIndex, 1);
    const changedOptions = updateOptions(
      selectedFilterType,
      selectionOptionsValue,
      setIsDateTypeCustom,
      coreFileParams,
      prometheusMetricsParams
    );
    handleOptionsChange(changedOptions);
  }

  const isCoreFileSelected = isSelected('CoreFiles');
  const isPrometheusMetricsSelected = isSelected('PrometheusMetrics');

  const ExpandableButton = ({ isExpanded, onClick, text }) => (
    <YBButton
      btnText={
        <>
          {text}
          <span>
            <i
              className={`fa ${isExpanded ? 'fa-caret-up' : 'fa-caret-down'}`}
              aria-hidden="true"
            />
          </span>
        </>
      }
      onClick={onClick}
    />
  );

  const openEditCustomPrometheusQueriesModal = () => {
    setIsEditCustomPrometheusQueriesModalOpen(true);
  };
  const closeEditCustomPrometheusQueriesModal = () => {
    setIsEditCustomPrometheusQueriesModalOpen(false);
  };
  const updatePrometheusQueries = (updatedPrometheusQueries) => {
    const updatedPrometheusMetricsParams = {
      ...prometheusMetricsParams,
      prometheusQueries: updatedPrometheusQueries
    };
    setPrometheusMetricsParams(updatedPrometheusMetricsParams);

    const changedOptions = updateOptions(
      selectedFilterType,
      selectionOptionsValue,
      setIsDateTypeCustom,
      coreFileParams,
      updatedPrometheusMetricsParams
    );
    handleOptionsChange(changedOptions);
  };

  const getComponentLabel = (component, perComponentEstimatedSize) => {
    const estimatedComponentSizeBytes = perComponentEstimatedSize[component.value];
    return (
      <Box display="flex">
        <Typography variant="body1">{component.label}</Typography>
        {estimatedComponentSizeBytes !== undefined && (
          <Typography variant="body2" className={classes.estimatedComponentSize}>
            {`(${formatBytes(estimatedComponentSizeBytes)})`}
          </Typography>
        )}
      </Box>
    );
  };

  const perComponentEstimatedSize = getPerComponentEstimatedSize(
    estimateSupportBundleSizeQuery.data
  );
  const selectedComponents = getSelectedComponents(selectionOptions, selectionOptionsValue);
  const totalSupportBundleEstimatedSize = getTotalSupportBundleEstimatedSize(
    selectedComponents,
    perComponentEstimatedSize
  );

  return (
    <Box display="flex" flexDirection="column" gridGap={theme.spacing(2)}>
      <div className="universe-support-bundle-step-two">
        {universeStatus?.state !== UniverseState.GOOD && (
          <Alert bsStyle="warning">
            Support bundle creation may fail since universe is not in &ldquo;Ready&rdquo; state
          </Alert>
        )}

        <p className="subtitle-text">
          Support bundles contain the diagnostic information. This can include log files, config
          files, metadata and etc. You can analyze this information locally on your machine or send
          the bundle to Yugabyte Support team.
        </p>
        <div className="filters">
          {isDateTypeCustom && (
            <CustomDateRangePicker
              onRangeChange={(startEnd) => {
                setStartDate(startEnd.start);
                setEndDate(startEnd.end);
                if (selectedFilterTypePromDump.value !== CUSTOM) {
                  setPromDumpStartDate(
                    getBackDateBeforeDate(
                      +selectedFilterTypePromDump.value,
                      selectedFilterTypePromDump.type,
                      startEnd.end
                    )
                  );
                } else {
                  setPromDumpStartDate(startEnd.start);
                }
                setPromDumpEndDate(startEnd.end);
                const changedOptions = updateOptions(
                  { value: CUSTOM_WITH_VALUE },
                  selectionOptionsValue,
                  setIsDateTypeCustom,
                  coreFileParams,
                  prometheusMetricsParams,
                  startEnd.start,
                  startEnd.end
                );
                handleOptionsChange(changedOptions);
              }}
            />
          )}
          <DropdownButton
            title={
              <span className="dropdown-text">
                <i className="fa fa-calendar" />{' '}
                {filterTypes.find((type) => type.value === selectedFilterType.value).label}
              </span>
            }
            pullRight
          >
            {filterTypes.map((filterType, index) => {
              if (filterType.type === 'divider') {
                return <MenuItem divider key={filterType.type} />;
              }
              return (
                <MenuItem
                  key={filterType.label}
                  onClick={() => {
                    setSelectedFilterType(filterType);
                    const currentDate = new Date();
                    const isCustomFilterType = filterType.value === CUSTOM;
                    const defaultBackDate = isCustomFilterType
                      ? getBackDate(1, 'days')
                      : getBackDate(+filterType.value, filterType.type);
                    const promDumpStartBackDate =
                      selectedFilterTypePromDump.value === CUSTOM
                        ? defaultBackDate
                        : getBackDate(
                            +selectedFilterTypePromDump.value,
                            selectedFilterTypePromDump.type
                          );

                    // Set start and end dates
                    setStartDate(defaultBackDate);
                    setEndDate(currentDate);

                    // Set prom dump start and end dates
                    setPromDumpStartDate(promDumpStartBackDate);
                    setPromDumpEndDate(currentDate);
                    const changedOptions = updateOptions(
                      filterType,
                      selectionOptionsValue,
                      setIsDateTypeCustom,
                      coreFileParams,
                      prometheusMetricsParams
                    );
                    handleOptionsChange(changedOptions);
                  }}
                  value={filterType.value}
                >
                  {filterType.label}
                </MenuItem>
              );
            })}
          </DropdownButton>
        </div>
        <div className="selection-area">
          <span className="title">Select what you want to include in the support bundle</span>
          {selectionOptions.map((selectionOption, index) => (
            <>
              <div className="selection-option">
                <YBCheckBox
                  // eslint-disable-next-line react/no-array-index-key
                  key={`${selectionOptionsValue[index]}${index}selectionOption`}
                  className={classes.componentCheckBox}
                  onClick={() => {
                    if (index === 0) {
                      for (
                        let internalIndex = 1;
                        internalIndex < selectionOptions.length;
                        internalIndex++
                      ) {
                        selectionOptionsValue[internalIndex] = !selectionOptionsValue[index];
                        outerRefs.current[internalIndex].checked = !selectionOptionsValue[index];
                      }
                      selectionOptionsValue[index] = !selectionOptionsValue[index];
                      outerRefs.current[index].checked = selectionOptionsValue[index];
                    } else {
                      selectionOptionsValue[index] = !selectionOptionsValue[index];
                      outerRefs.current[index].checked = selectionOptionsValue[index];
                      let isAllSelected = true;
                      for (
                        let internalIndex = 1;
                        internalIndex < selectionOptions.length;
                        internalIndex++
                      ) {
                        if (!selectionOptionsValue[internalIndex]) {
                          isAllSelected = false;
                        }
                      }
                      outerRefs.current[0].checked = isAllSelected;
                    }
                    setSelectionOptionsValue([...selectionOptionsValue]);
                    const changedOptions = updateOptions(
                      selectedFilterType.value === CUSTOM
                        ? { value: CUSTOM_WITH_VALUE }
                        : selectedFilterType,
                      [...selectionOptionsValue],
                      setIsDateTypeCustom,
                      coreFileParams,
                      prometheusMetricsParams,
                      ...(selectedFilterType.value === CUSTOM ? [startDate, endDate] : [])
                    );
                    handleOptionsChange(changedOptions);
                  }}
                  checkState={selectionOptionsValue[index]}
                  input={{ ref: (ref) => (outerRefs.current[index] = ref) }}
                  label={getComponentLabel(selectionOption, perComponentEstimatedSize)}
                />
                {selectionOption.value === 'CoreFiles' && isCoreFileSelected && (
                  <ExpandableButton
                    isExpanded={isExpandedCoreFiles}
                    onClick={() => setIsExpandedCoreFiles(!isExpandedCoreFiles)}
                    text="Override properties (Optional)"
                  />
                )}
                {selectionOption.value === 'PrometheusMetrics' && isPrometheusMetricsSelected && (
                  <ExpandableButton
                    isExpanded={isExpandedPromMetrics}
                    onClick={() => setIsExpandedPromMetrics(!isExpandedPromMetrics)}
                    text="Override properties (Optional)"
                  />
                )}
              </div>
              {selectionOption.value === 'CoreFiles' && isCoreFileSelected && (
                <Collapse in={isExpandedCoreFiles}>
                  <Box className="core-file-container">
                    <Box display="flex" mt={1} flexDirection={'row'} width="100%">
                      <YBLabel width="225px">Maximum number of recent core files</YBLabel>
                      <YBInput
                        onChange={(e) => {
                          const updatedObj = {
                            maxCoreFileSize: coreFileParams.maxCoreFileSize,
                            maxNumRecentCores: e.target.value < 1 ? 1 : e.target.value
                          };
                          setCoreFileParams({ ...updatedObj });
                          const changedOptions = updateOptions(
                            selectedFilterType.value === CUSTOM
                              ? { value: CUSTOM_WITH_VALUE }
                              : selectedFilterType,
                            [...selectionOptionsValue],
                            setIsDateTypeCustom,
                            { ...updatedObj },
                            prometheusMetricsParams,
                            ...(selectedFilterType.value === CUSTOM ? [startDate, endDate] : [])
                          );
                          handleOptionsChange(changedOptions);
                        }}
                        value={coreFileParams.maxNumRecentCores}
                        type="number"
                        style={{ width: '250px' }}
                      />
                    </Box>
                    <Box display="flex" mt={1} flexDirection={'row'} width="100%">
                      <YBLabel width="225px">Maximum core file size (in GB)</YBLabel>
                      <YBInput
                        onChange={(e) => {
                          const updatedObj = {
                            maxCoreFileSize:
                              e.target.value < 1
                                ? 1 * ONE_GB_IN_BYTES
                                : e.target.value * ONE_GB_IN_BYTES,
                            maxNumRecentCores: coreFileParams.maxNumRecentCores
                          };
                          setCoreFileParams({ ...updatedObj });
                          const changedOptions = updateOptions(
                            selectedFilterType.value === CUSTOM
                              ? { value: CUSTOM_WITH_VALUE }
                              : selectedFilterType,
                            [...selectionOptionsValue],
                            setIsDateTypeCustom,
                            { ...updatedObj },
                            prometheusMetricsParams,
                            ...(selectedFilterType.value === CUSTOM ? [startDate, endDate] : [])
                          );
                          handleOptionsChange(changedOptions);
                        }}
                        value={coreFileParams.maxCoreFileSize / ONE_GB_IN_BYTES}
                        type="number"
                        style={{ width: '250px' }}
                      />
                    </Box>
                  </Box>
                </Collapse>
              )}
              {selectionOption.value === 'PrometheusMetrics' && isPrometheusMetricsSelected && (
                <Collapse in={isExpandedPromMetrics}>
                  <Box className="core-file-container">
                    <div className="filters">
                      {isPromDumpDateTypeCustom && (
                        <div className="date-time-picker">
                          <DateTimePicker
                            placeholder="Pick a start time"
                            step={10}
                            formats={DATE_FORMAT}
                            onChange={(timestamp) => {
                              setPromDumpStartDate(timestamp);
                              const updatedObj = {
                                ...prometheusMetricsParams,
                                promDumpDateType: { value: CUSTOM_WITH_VALUE },
                                promDumpStartDate: timestamp
                              };
                              setPrometheusMetricsParams({ ...updatedObj });
                              const changedOptions = updateOptions(
                                selectedFilterType.value === CUSTOM
                                  ? { value: CUSTOM_WITH_VALUE }
                                  : selectedFilterType,
                                selectionOptionsValue,
                                setIsDateTypeCustom,
                                coreFileParams,
                                { ...updatedObj },
                                ...(selectedFilterType.value === CUSTOM ? [startDate, endDate] : [])
                              );
                              handleOptionsChange(changedOptions);
                            }}
                            value={promDumpStartDate}
                            min={startDate}
                            max={endDate}
                          />
                          &ndash;
                          <DateTimePicker
                            placeholder="Pick an end time"
                            step={10}
                            formats={DATE_FORMAT}
                            onChange={(timestamp) => {
                              setPromDumpEndDate(timestamp);
                              const updatedObj = {
                                ...prometheusMetricsParams,
                                promDumpDateType: { value: CUSTOM_WITH_VALUE },
                                promDumpEndDate: timestamp
                              };
                              setPrometheusMetricsParams({ ...updatedObj });
                              const changedOptions = updateOptions(
                                selectedFilterType.value === CUSTOM
                                  ? { value: CUSTOM_WITH_VALUE }
                                  : selectedFilterType,
                                selectionOptionsValue,
                                setIsDateTypeCustom,
                                coreFileParams,
                                { ...updatedObj },
                                ...(selectedFilterType.value === CUSTOM ? [startDate, endDate] : [])
                              );
                              handleOptionsChange(changedOptions);
                            }}
                            value={promDumpEndDate}
                            min={promDumpStartDate}
                            max={endDate}
                          />
                        </div>
                      )}
                      <DropdownButton
                        title={
                          <span className="dropdown-text">
                            <i className="fa fa-calendar" />{' '}
                            {
                              filterTypePromDump.find(
                                (type) => type.value === selectedFilterTypePromDump.value
                              ).label
                            }
                          </span>
                        }
                        pullRight
                      >
                        {filterTypePromDump.map((filterType, index) => {
                          if (filterType.type === 'divider') {
                            return <MenuItem divider key={filterType.type} />;
                          }
                          return (
                            <MenuItem
                              key={filterType.label}
                              onClick={() => {
                                setSelectedFilterTypePromDump(filterType);
                                if (filterType.value !== CUSTOM) {
                                  setIsPromDumpDateTypeCustom(false);
                                  setPromDumpStartDate(
                                    getBackDateBeforeDate(
                                      +filterType.value,
                                      filterType.type,
                                      endDate
                                    )
                                  );
                                } else {
                                  setIsPromDumpDateTypeCustom(true);
                                  setPromDumpStartDate(startDate);
                                }
                                setPromDumpEndDate(endDate);
                                const updatedObj = {
                                  ...prometheusMetricsParams,
                                  promDumpDateType: filterType,
                                  isPromDumpDateTypeCustom: filterType.value === CUSTOM
                                };
                                setPrometheusMetricsParams({ ...updatedObj });
                                const changedOptions = updateOptions(
                                  selectedFilterType.value === CUSTOM
                                    ? { value: CUSTOM_WITH_VALUE }
                                    : selectedFilterType,
                                  selectionOptionsValue,
                                  setIsDateTypeCustom,
                                  coreFileParams,
                                  { ...updatedObj },
                                  ...(selectedFilterType.value === CUSTOM
                                    ? [startDate, endDate]
                                    : [])
                                );
                                handleOptionsChange(changedOptions);
                              }}
                              value={filterType.value}
                            >
                              {filterType.label}
                            </MenuItem>
                          );
                        })}
                      </DropdownButton>
                      &nbsp;&nbsp;
                      <YBInfoTip
                        content="Adjusts the global start and end times of the support bundle specifically for prometheus metrics dump"
                        title="Prometheus dump start & end points"
                      />
                    </div>
                    {prometheusMetricsOptions.map((prometheusMetricsOption, i) => (
                      // eslint-disable-next-line react/jsx-key
                      <div className="selection-option">
                        <YBCheckBox
                          // eslint-disable-next-line react/no-array-index-key
                          key={`${prometheusMetricsOptionsValue[i]}${i}prometheusMetricsOption`}
                          onClick={() => {
                            // Toggle the selected checkbox state
                            prometheusMetricsOptionsValue[i] = !prometheusMetricsOptionsValue[i];
                            innerRefs.current[i].checked = prometheusMetricsOptionsValue[i];

                            // Update the state to trigger re-render
                            setPrometheusMetricsOptionsValue([...prometheusMetricsOptionsValue]);
                            const updatedObj = {
                              ...prometheusMetricsParams,
                              prometheusMetricsOptionsValue: [...prometheusMetricsOptionsValue]
                            };
                            setPrometheusMetricsParams({ ...updatedObj });

                            // Update options and notify parent component
                            const changedOptions = updateOptions(
                              selectedFilterType.value === CUSTOM
                                ? { value: CUSTOM_WITH_VALUE }
                                : selectedFilterType,
                              selectionOptionsValue,
                              setIsDateTypeCustom,
                              coreFileParams,
                              { ...updatedObj },
                              ...(selectedFilterType.value === CUSTOM ? [startDate, endDate] : [])
                            );
                            handleOptionsChange(changedOptions);
                          }}
                          checkState={prometheusMetricsOptionsValue[i]}
                          input={{ ref: (ref) => (innerRefs.current[i] = ref) }}
                          label={prometheusMetricsOption.label}
                        />
                      </div>
                    ))}
                    <div className={classes.customPrometheusQueriesSection}>
                      <YBRedesignedButton
                        variant="ghost"
                        startIcon={
                          prometheusMetricsParams?.prometheusQueries?.length > 0 ? (
                            <EditIcon className={classes.editIcon} />
                          ) : (
                            <AddIcon />
                          )
                        }
                        className={classes.openCustomPrometheusQueriesButton}
                        onClick={openEditCustomPrometheusQueriesModal}
                      >
                        Custom Queries
                      </YBRedesignedButton>
                      {isEditCustomPrometheusQueriesModalOpen && (
                        <EditCustomPrometheusQueriesModal
                          customPrometheusQueries={prometheusMetricsParams?.prometheusQueries ?? []}
                          updateCustomPrometheusQueries={updatePrometheusQueries}
                          modalProps={{
                            open: isEditCustomPrometheusQueriesModalOpen,
                            onClose: closeEditCustomPrometheusQueriesModal
                          }}
                        />
                      )}
                    </div>
                  </Box>
                </Collapse>
              )}
            </>
          ))}
        </div>
      </div>
      <Box display="flex" gridGap={theme.spacing(2)}>
        <YBRedesignedButton
          variant="secondary"
          onClick={estimateSupportBundleSizeQuery.refetch}
          showSpinner={estimateSupportBundleSizeQuery.isFetching}
          disabled={estimateSupportBundleSizeQuery.isFetching}
          data-testid="GetEstimatedBundleSizeButton"
        >
          Estimate Uncompressed Support Bundle Size
        </YBRedesignedButton>
        <Box display="flex" alignItems="center">
          {estimateSupportBundleSizeQuery.data &&
            !estimateSupportBundleSizeQuery.isFetching &&
            !isEstimatedSupportBundleSizeStale && (
              <Typography variant="body2">{`Total Estimated Size: ${formatBytes(
                totalSupportBundleEstimatedSize
              )}`}</Typography>
            )}
        </Box>
      </Box>
    </Box>
  );
};
