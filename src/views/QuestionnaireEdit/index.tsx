import {
    useMemo,
    useCallback,
    useState,
    useEffect,
    useContext,
} from 'react';
import {
    useParams,
} from 'react-router-dom';
import {
    IoCameraOutline,
    IoCloseOutline,
    IoDocumentTextOutline,
    IoEyeSharp,
    IoRadioButtonOn,
    IoSwapVertical,
} from 'react-icons/io5';
import {
    MdOutline123,
    MdOutlineAbc,
    MdOutlineCalendarMonth,
    MdOutlineChecklist,
    MdOutlineEditNote,
    MdOutlineSchedule,
} from 'react-icons/md';
import {
    compareNumber,
    isNotDefined,
    isDefined,
    listToGroupList,
    mapToList,
} from '@togglecorp/fujs';
import {
    gql,
    useQuery,
    useMutation,
} from '@apollo/client';
import { getOperationName } from 'apollo-link';
import {
    AlertContext,
    Container,
    Header,
    ListView,
    QuickActionButton,
    Tab,
    Tabs,
    TextOutput,
    useModalState,
    useAlert,
} from '@the-deep/deep-ui';
import { removeNull } from '@togglecorp/toggle-form';

import SubNavbar from '#components/SubNavbar';
import TocList from '#components/TocList';
import {
    NonLeafTocItem,
    LeafTocItem,
    TocItem,
    getChildren,
    flatten,
} from '#utils/common';
import {
    QUESTIONS_FOR_LEAF_GROUP,
} from '#views/QuestionnaireEdit/QuestionList/LeafNode/queries';
import { apolloClient } from '#configs/apollo';
import QuestionnairePreviewModal from '#components/QuestionnairePreviewModal';
import {
    OrderQuestionGroupMutation,
    OrderQuestionGroupMutationVariables,
    PreviewQuestionnaireMutation,
    PreviewQuestionnaireMutationVariables,
    PreviewDetailsQuery,
    PreviewDetailsQueryVariables,
    QuestionnaireQuery,
    QuestionnaireQueryVariables,
    QuestionGroupVisibilityMutation,
    QuestionGroupVisibilityMutationVariables,
    VisibilityActionEnum,
} from '#generated/types';

import TextQuestionForm from './TextQuestionForm';
import IntegerQuestionForm from './IntegerQuestionForm';
import RankQuestionForm from './RankQuestionForm';
import DateQuestionForm from './DateQuestionForm';
import TimeQuestionForm from './TimeQuestionForm';
import NoteQuestionForm from './NoteQuestionForm';
import FileQuestionForm from './FileQuestionForm';
import ImageQuestionForm from './ImageQuestionForm';
import SelectOneQuestionForm from './SelectOneQuestionForm';
import SelectMultipleQuestionForm from './SelectMultipleQuestionForm';

import QuestionList from './QuestionList';
import {
    LEAF_GROUPS_FRAGMENT,
    CHOICE_COLLECTION_FRAGMENT,
} from './queries';
import QuestionTypeItem, { QuestionType } from './QuestionTypeItem';

import styles from './index.module.css';

export type QuestionTabType = 'general' | 'metadata';

const QUESTIONNAIRE = gql`
    ${LEAF_GROUPS_FRAGMENT}
    ${CHOICE_COLLECTION_FRAGMENT}
    query Questionnaire(
        $projectId: ID!,
        $questionnaireId: ID!,
    ) {
        private {
            projectScope(pk: $projectId) {
                id
                project {
                    title
                    id
                }
                questionnaire(pk: $questionnaireId) {
                    id
                    title
                    leafGroups {
                        ...LeafGroups
                    }
                    choiceCollections {
                        ...ChoiceCollections
                    }
                }
            }
        }
    }
`;

const ORDER_QUESTION_GROUP = gql`
    ${LEAF_GROUPS_FRAGMENT}
    mutation OrderQuestionGroup(
        $projectId: ID!,
        $groupList: [QuestionLeafGroupOrderInputType!]!,
        $questionnaireId: ID!,
    ){
        private {
            projectScope(pk: $projectId){
                bulkUpdateQuestionnaireQuestionGroupsLeafOrder(
                data: $groupList
                questionnaireId: $questionnaireId
                ) {
                    errors
                    results {
                        ...LeafGroups
                    }
                }
            }
        }
    }
`;

const QUESTION_GROUP_VISIBILITY = gql`
    ${LEAF_GROUPS_FRAGMENT}
    mutation QuestionGroupVisibility(
        $projectId: ID!,
        $questionnaireId: ID!,
        $groupIds: [ID!]!,
        $visibility: VisibilityActionEnum!,
    ) {
        private {
            projectScope(pk: $projectId) {
                updateQuestionGroupsLeafVisibility(
                    questionnaireId: $questionnaireId,
                    ids: $groupIds,
                    visibility: $visibility,
                ) {
                    results {
                        ...LeafGroups
                    }
                }
            }
        }
    }
`;

const PREVIEW_QUESTIONNAIRE = gql`
    mutation PreviewQuestionnaire (
        $projectId: ID!,
        $questionnaireId: ID!,
    ) {
        private {
            projectScope(pk: $projectId) {
                createQuestionnaireExport(
                    data: {
                        questionnaire: $questionnaireId
                    }
                ) {
                    errors
                    ok
                    result {
                        enketoPreviewUrl
                        id
                        questionnaireId
                        status
                        statusDisplay
                    }
                }
            }
        }
    }
`;

const PREVIEW_DETAILS = gql`
    query PreviewDetails (
        $projectId: ID!,
        $exportId: ID!,
    ) {
        private {
            projectScope(pk: $projectId) {
                questionnaireExport(pk: $exportId) {
                    enketoPreviewUrl
                    status
                    statusDisplay
                    startedAt
                    endedAt
                }
            }
        }
    }
`;

type QuestionGroup = NonNullable<NonNullable<NonNullable<NonNullable<QuestionnaireQuery['private']>['projectScope']>['questionnaire']>['leafGroups']>[number];
const groupTabKeySelector = (g: TocItem) => g.key;

const questionTypes: QuestionType[] = [
    {
        key: 'INTEGER',
        name: 'Integer',
        icon: <MdOutline123 />,
    },
    {
        key: 'TEXT',
        name: 'Text',
        icon: <MdOutlineAbc />,
    },
    {
        key: 'SELECT_ONE',
        name: 'Select One',
        icon: <IoRadioButtonOn />,
    },
    {
        key: 'SELECT_MULTIPLE',
        name: 'Select Multiple',
        icon: <MdOutlineChecklist />,
    },
    {
        key: 'RANK',
        name: 'Rank',
        icon: <IoSwapVertical />,
    },
    {
        key: 'DATE',
        name: 'Date',
        icon: <MdOutlineCalendarMonth />,
    },
    {
        key: 'TIME',
        name: 'Time',
        icon: <MdOutlineSchedule />,
    },
    {
        key: 'IMAGE',
        name: 'Image',
        icon: <IoCameraOutline />,
    },
    {
        key: 'FILE',
        name: 'File',
        icon: <IoDocumentTextOutline />,
    },
    {
        key: 'NOTE',
        name: 'Note',
        icon: <MdOutlineEditNote />,
    },
];

interface Node {
    category: {
        key: string;
        label: string;
    }[];
    type?: string;
    id: string;
    isHidden: boolean;
}

function getNodes(
    input: Node[],
    parentKeys: string[],
): TocItem[] {
    const nonLeafNodes = input.filter((item) => item.category.length > 1);
    const groupedNonLeafNodes = listToGroupList(
        nonLeafNodes,
        (groupItem) => groupItem.category[0].key,
        (groupItem) => ({
            category: groupItem.category.slice(1),
            parentLabel: groupItem.category[0].label,
            parentKey: groupItem.category[0].key,
            type: groupItem.type,
            id: groupItem.id,
            isHidden: groupItem.isHidden,
        }),
    );
    const nonLeafNodesResponse = mapToList(
        groupedNonLeafNodes,
        (item, key): NonLeafTocItem => ({
            key,
            // type: item[0].type,
            label: item[0].parentLabel,
            parentKeys: [...parentKeys, item[0].parentKey],
            nodes: getNodes(
                item,
                [...parentKeys, item[0].parentKey],
            ),
        }),
    );

    const leafNodes = input.filter((item) => item.category.length <= 1);
    const leafNodesResponse = leafNodes.map((item): LeafTocItem => ({
        key: item.category[0].key,
        // type: item.type,
        label: item.category[0].label,
        parentKeys: [...parentKeys, item.category[0].key],
        leafNode: true,
        isHidden: item.isHidden,
        id: item.id,
    }));

    return [
        ...leafNodesResponse,
        ...nonLeafNodesResponse,
    ];
}

const questionTypeKeySelector = (q: QuestionType) => q.key;
const PAGE_SIZE = 15;

function transformOptionsByCategory(options: QuestionGroup[]): Node[] {
    const result = options
        .map((g) => ({
            category: [
                isDefined(g.category1) && isDefined(g.category1Display) ? {
                    key: g.category1,
                    label: g.category1Display,
                } : undefined,
                isDefined(g.category2) && isDefined(g.category2Display) ? {
                    key: g.category2,
                    label: g.category2Display,
                } : undefined,
                isDefined(g.category3) && isDefined(g.category3Display) ? {
                    key: g.category3,
                    label: g.category3Display,
                } : undefined,
                isDefined(g.category4) && isDefined(g.category4Display) ? {
                    key: g.category4,
                    label: g.category4Display,
                } : undefined,
            ].filter(isDefined),
            type: g.type,
            id: g.id,
            isHidden: g.isHidden,
        }));
    return result;
}

const PREVIEW_ALERT_NAME = 'questionnaire-preview';

// eslint-disable-next-line import/prefer-default-export
export function Component() {
    const {
        projectId,
        questionnaireId,
    } = useParams<{projectId: string, questionnaireId: string}>();

    const [
        addQuestionPaneShown,
        showAddQuestionPane,
        hideAddQuestionPane,
    ] = useModalState(false);

    const [
        selectedQuestionType,
        setSelectedQuestionType,
    ] = useState<string | undefined>();

    const [
        activeQuestionId,
        setActiveQuestionId,
    ] = useState<string | undefined>();

    const [
        selectedGroups,
        setSelectedGroups,
    ] = useState<string[]>([]);

    const alert = useAlert();

    const [
        enketoPreviewModalShown,
        showEnketoPreviewModal,
        hideEnketoPreviewModal,
    ] = useModalState(false);

    const {
        addAlert,
        removeAlert,
    } = useContext(AlertContext);

    const handleRightPaneClose = useCallback(() => {
        hideAddQuestionPane();
        setSelectedQuestionType(undefined);
    }, [
        hideAddQuestionPane,
    ]);

    const questionnaireVariables = useMemo(() => {
        if (isNotDefined(projectId) || isNotDefined(questionnaireId)) {
            return undefined;
        }

        return ({
            projectId,
            questionnaireId,
            limit: PAGE_SIZE,
            offset: 0,
        });
    }, [
        projectId,
        questionnaireId,
    ]);

    const [
        orderedOptions,
        setOrderedOptions,
    ] = useState<TocItem[] | undefined>([]);

    const {
        data: questionnaireResponse,
    } = useQuery<QuestionnaireQuery, QuestionnaireQueryVariables>(
        QUESTIONNAIRE,
        {
            skip: isNotDefined(questionnaireVariables),
            variables: questionnaireVariables,
            onCompleted: (response) => {
                const questionGroups = removeNull(
                    response?.private.projectScope?.questionnaire?.leafGroups,
                );
                if (!questionGroups) {
                    return;
                }
                const items = [...questionGroups];
                items.sort((a, b) => compareNumber(a.order, b.order));
                const transformedQuestionGroups = transformOptionsByCategory(items);
                const groupOptionsSafe = getNodes(transformedQuestionGroups, []);

                const visibleQuestionGroups = items.filter((group) => !group.isHidden);

                setOrderedOptions(groupOptionsSafe ?? []);
                setSelectedGroups(visibleQuestionGroups.map((item) => item.id));
            },
        },
    );

    const referenceList = useMemo(() => (
        questionnaireResponse?.private?.projectScope?.questionnaire?.leafGroups.map((g) => {
            if (isDefined(g.category3) && isDefined(g.category4)) {
                return ({
                    key: `${g.category1}-${g.category2}-${g.category3}-${g.category4}`,
                    id: g.id,
                });
            }
            return ({
                key: `${g.category1}-${g.category2}`,
                id: g.id,
            });
        })
    ), [
        questionnaireResponse,
    ]);

    const questionnaireTitle = questionnaireResponse?.private.projectScope?.questionnaire?.title;
    const projectTitle = questionnaireResponse?.private.projectScope?.project.title;

    const choiceCollections = questionnaireResponse?.private?.projectScope
        ?.questionnaire?.choiceCollections;

    const [
        triggerGroupOrderChange,
    ] = useMutation<OrderQuestionGroupMutation, OrderQuestionGroupMutationVariables>(
        ORDER_QUESTION_GROUP,
        {
            onCompleted: (response) => {
                const leafGroupsResponse = response?.private
                    ?.projectScope?.bulkUpdateQuestionnaireQuestionGroupsLeafOrder?.results;
                if (!leafGroupsResponse) {
                    return;
                }
                const items = [...leafGroupsResponse];
                items.sort((a, b) => compareNumber(a.order, b.order));

                const transformedGroups = transformOptionsByCategory(items);
                const groupOptionsSafe = getNodes(transformedGroups, []);
                setOrderedOptions(groupOptionsSafe);
            },
        },
    );

    const handleGroupOptionsChange = useCallback((newVal: TocItem[] | undefined) => {
        if (isNotDefined(projectId) || isNotDefined(questionnaireId)) {
            return;
        }
        setOrderedOptions(newVal);

        function getIdFromGroups(key: string) {
            const foundGroup = referenceList?.find((g) => g.key === key);
            if (isNotDefined(foundGroup)) {
                return null;
            }
            return foundGroup.id;
        }

        const flattenedNewList = flatten(
            newVal ?? [],
            (item) => ({
                key: item.parentKeys.join('-'),
            }),
            (item) => (item.leafNode ? [] : item.nodes),
        );
        const listToSend = flattenedNewList.map((g, index) => ({
            // FIXME: We should not send an empty string here
            id: getIdFromGroups(g.key) ?? '',
            order: index + 1,
        }));
        triggerGroupOrderChange({
            variables: {
                projectId,
                questionnaireId,
                groupList: listToSend,
            },
        });
    }, [
        referenceList,
        projectId,
        questionnaireId,
        triggerGroupOrderChange,
    ]);

    const [exportIdToPreview, setExportIdToPreview] = useState<string | undefined>();

    const [
        triggerQuestionnairePreview,
    ] = useMutation<PreviewQuestionnaireMutation, PreviewQuestionnaireMutationVariables>(
        PREVIEW_QUESTIONNAIRE,
        {
            onCompleted: (response) => {
                const exportResponse = response?.private?.projectScope?.createQuestionnaireExport;
                if (!exportResponse?.ok) {
                    alert.show(
                        'Some error occured during export.',
                        { variant: 'error' },
                    );
                }
                if (exportResponse?.ok && exportResponse.result?.id) {
                    setExportIdToPreview(exportResponse.result?.id);
                    addAlert({
                        variant: 'info',
                        duration: Infinity,
                        name: PREVIEW_ALERT_NAME,
                        children: 'Please wait while the export is being prepared.',
                    });
                }
            },
            onError: () => {
                alert.show(
                    'Some error occured during export.',
                    { variant: 'error' },
                );
            },
        },
    );

    const handleQuestionnairePreview = useCallback(() => {
        if (isNotDefined(projectId) || isNotDefined(questionnaireId)) {
            return;
        }
        triggerQuestionnairePreview({
            variables: {
                projectId,
                questionnaireId,
            },
        });
    }, [
        projectId,
        questionnaireId,
        triggerQuestionnairePreview,
    ]);

    const exportVariables = useMemo(() => {
        if (isNotDefined(projectId) || isNotDefined(exportIdToPreview)) {
            return undefined;
        }
        return {
            projectId,
            exportId: exportIdToPreview,
        };
    }, [
        projectId,
        exportIdToPreview,
    ]);

    const {
        data: previewDetailsResponse,
        startPolling,
        stopPolling,
    } = useQuery<PreviewDetailsQuery, PreviewDetailsQueryVariables>(
        PREVIEW_DETAILS,
        {
            skip: isNotDefined(exportVariables),
            variables: exportVariables,
            onCompleted: (response) => {
                const exportResponse = response.private.projectScope?.questionnaireExport;
                if (isNotDefined(exportResponse)) {
                    setExportIdToPreview(undefined);
                    removeAlert(PREVIEW_ALERT_NAME);
                    alert.show(
                        'There was some issue creating the export.',
                        { variant: 'error' },
                    );
                }
                if (exportResponse?.status === 'SUCCESS') {
                    removeAlert(PREVIEW_ALERT_NAME);
                    showEnketoPreviewModal();
                } else if (exportResponse?.status === 'FAILURE') {
                    removeAlert(PREVIEW_ALERT_NAME);
                    alert.show(
                        'There was some issue creating the export.',
                        { variant: 'error' },
                    );
                }
            },
        },
    );

    useEffect(
        () => {
            const shouldPoll = exportIdToPreview
                && previewDetailsResponse?.private?.projectScope?.questionnaireExport?.status !== 'SUCCESS'
                && previewDetailsResponse?.private?.projectScope?.questionnaireExport?.status !== 'FAILURE';

            if (shouldPoll) {
                startPolling(5000);
            } else {
                stopPolling();
            }
        },
        [
            previewDetailsResponse,
            exportIdToPreview,
            startPolling,
            stopPolling,
        ],
    );

    const [
        triggerQuestionGroupsVisibility,
    ] = useMutation<QuestionGroupVisibilityMutation, QuestionGroupVisibilityMutationVariables>(
        QUESTION_GROUP_VISIBILITY,
    );

    const handleQuestionGroupSelect = useCallback((val: boolean, ids: string[]) => {
        if (isNotDefined(projectId) || isNotDefined(questionnaireId)) {
            return;
        }
        setSelectedGroups((prevValue) => {
            if (val) {
                return [...prevValue, ...ids];
            }
            return prevValue.filter((item) => !ids.includes(item));
        });
        triggerQuestionGroupsVisibility({
            variables: {
                projectId,
                questionnaireId,
                groupIds: ids,
                visibility: val
                    ? 'SHOW' as VisibilityActionEnum
                    : 'HIDE' as VisibilityActionEnum,
            },
        });
    }, [
        triggerQuestionGroupsVisibility,
        projectId,
        questionnaireId,
    ]);

    const [activeGroupTab, setActiveGroupTab] = useState<string | undefined>();

    // NOTE: If none of the tabs are selected, 1st group should be selected
    const finalSelectedTab = activeGroupTab ?? selectedGroups[0];

    const [activeLeafGroupId, setActiveLeafGroupId] = useState<string | undefined>();

    const handleQuestionCreateSuccess = useCallback(() => {
        hideAddQuestionPane();
        setSelectedQuestionType(undefined);
        apolloClient.refetchQueries({
            include: [
                getOperationName(QUESTIONS_FOR_LEAF_GROUP),
            ].filter(isDefined),
        });
    }, [
        hideAddQuestionPane,
    ]);

    const questionTypeRendererParams = useCallback((key: string, data: QuestionType) => ({
        questionType: data,
        name: key,
        onQuestionClick: setSelectedQuestionType,
    }), []);

    const handleQuestionAdd = useCallback((groupId: string) => {
        showAddQuestionPane();
        setActiveQuestionId(undefined);
        setActiveLeafGroupId(groupId);
    }, [
        showAddQuestionPane,
    ]);

    const tabQuestions = useMemo(() => {
        const val = orderedOptions?.find((g) => g.key === finalSelectedTab);
        return val;
    }, [
        orderedOptions,
        finalSelectedTab,
    ]);

    const groupTabRenderParams = useCallback((_: string, datum: TocItem) => ({
        children: datum.label,
        name: datum.key,
        className: styles.tab,
        activeClassName: styles.active,
    }), []);

    const filtered1stLevel = useMemo(() => (
        orderedOptions?.map((item) => {
            const childIds = getChildren(item);
            const inputValue = item.leafNode
                ? selectedGroups.includes(item.id)
                : childIds.every((g) => selectedGroups.includes(g));

            const indeterminate = item.leafNode
                ? false
                : childIds.some((g) => selectedGroups.includes(g));

            return ({
                ...item,
                isSelected: inputValue || indeterminate,
            });
        }).filter((item) => item.isSelected)
    ), [
        orderedOptions,
        selectedGroups,
    ]);

    if (isNotDefined(projectId) || isNotDefined(questionnaireId)) {
        return null;
    }

    return (
        <div className={styles.page}>
            <SubNavbar
                className={styles.subNavbar}
                onCloseLink="/"
                header={(
                    <TextOutput
                        value={projectTitle}
                        valueContainerClassName={styles.title}
                        description={questionnaireTitle}
                        descriptionContainerClassName={styles.description}
                        spacing="none"
                        block
                    />
                )}
            />
            <div className={styles.pageContent}>
                <Container
                    className={styles.leftPane}
                    heading="Adapt Questionnaire structure and content"
                    headingSize="extraSmall"
                    contentClassName={styles.leftContent}
                >
                    <TocList
                        orderedOptions={orderedOptions}
                        onOrderedOptionsChange={handleGroupOptionsChange}
                        onSelectedGroupsChange={handleQuestionGroupSelect}
                        selectedGroups={selectedGroups}
                    />
                </Container>
                <div className={styles.content}>
                    <Header
                        className={styles.header}
                        headingSize="extraSmall"
                        heading="My Questionnaire"
                        actions={(
                            <QuickActionButton
                                name={undefined}
                                onClick={handleQuestionnairePreview}
                            >
                                <IoEyeSharp />
                            </QuickActionButton>
                        )}
                    />
                    <Tabs
                        onChange={setActiveGroupTab}
                        value={finalSelectedTab}
                        variant="secondary"
                    >
                        <ListView
                            className={styles.tabs}
                            // FIXME: pass filtered data here
                            data={filtered1stLevel}
                            keySelector={groupTabKeySelector}
                            renderer={Tab}
                            rendererParams={groupTabRenderParams}
                            filtered={false}
                            errored={false}
                            pending={false}
                        />
                        <QuestionList
                            className={styles.questionList}
                            data={tabQuestions}
                            projectId={projectId}
                            selectedGroups={selectedGroups}
                            questionnaireId={questionnaireId}
                            onEditQuestionClick={showAddQuestionPane}
                            setActiveQuestionId={setActiveQuestionId}
                            setSelectedQuestionType={setSelectedQuestionType}
                            level={2}
                            handleQuestionAdd={handleQuestionAdd}
                            addQuestionPaneShown={addQuestionPaneShown}
                            setSelectedLeafGroupId={setActiveLeafGroupId}
                            choiceCollections={choiceCollections}
                        />
                    </Tabs>
                </div>
                {addQuestionPaneShown && (
                    <div className={styles.rightPane}>
                        <Header
                            className={styles.header}
                            headingSize="extraSmall"
                            heading={isDefined(selectedQuestionType) ? 'Question Editor' : 'Add Question'}
                            actions={(
                                <QuickActionButton
                                    name={undefined}
                                    onClick={handleRightPaneClose}
                                    variant="transparent"
                                >
                                    <IoCloseOutline />
                                </QuickActionButton>
                            )}
                        />
                        {isNotDefined(selectedQuestionType) && (
                            <ListView
                                className={styles.questionTypes}
                                data={questionTypes}
                                keySelector={questionTypeKeySelector}
                                renderer={QuestionTypeItem}
                                rendererParams={questionTypeRendererParams}
                                filtered={false}
                                errored={false}
                                pending={false}
                            />
                        )}
                        {activeLeafGroupId && (
                            <div className={styles.question}>
                                {(selectedQuestionType === 'TEXT') && (
                                    <TextQuestionForm
                                        projectId={projectId}
                                        questionnaireId={questionnaireId}
                                        questionId={activeQuestionId}
                                        onSuccess={handleQuestionCreateSuccess}
                                        selectedLeafGroupId={activeLeafGroupId}
                                    />
                                )}
                                {(selectedQuestionType === 'INTEGER') && (
                                    <IntegerQuestionForm
                                        projectId={projectId}
                                        questionnaireId={questionnaireId}
                                        questionId={activeQuestionId}
                                        onSuccess={handleQuestionCreateSuccess}
                                        selectedLeafGroupId={activeLeafGroupId}
                                    />
                                )}
                                {(selectedQuestionType === 'RANK') && (
                                    <RankQuestionForm
                                        projectId={projectId}
                                        questionnaireId={questionnaireId}
                                        questionId={activeQuestionId}
                                        onSuccess={handleQuestionCreateSuccess}
                                        selectedLeafGroupId={activeLeafGroupId}
                                        choiceCollections={choiceCollections}
                                    />
                                )}
                                {(selectedQuestionType === 'SELECT_ONE') && (
                                    <SelectOneQuestionForm
                                        projectId={projectId}
                                        questionnaireId={questionnaireId}
                                        questionId={activeQuestionId}
                                        onSuccess={handleQuestionCreateSuccess}
                                        selectedLeafGroupId={activeLeafGroupId}
                                        choiceCollections={choiceCollections}
                                    />
                                )}
                                {(selectedQuestionType === 'SELECT_MULTIPLE') && (
                                    <SelectMultipleQuestionForm
                                        projectId={projectId}
                                        questionnaireId={questionnaireId}
                                        questionId={activeQuestionId}
                                        onSuccess={handleQuestionCreateSuccess}
                                        selectedLeafGroupId={activeLeafGroupId}
                                        choiceCollections={choiceCollections}
                                    />
                                )}
                                {(selectedQuestionType === 'DATE') && (
                                    <DateQuestionForm
                                        projectId={projectId}
                                        questionnaireId={questionnaireId}
                                        questionId={activeQuestionId}
                                        onSuccess={handleQuestionCreateSuccess}
                                        selectedLeafGroupId={activeLeafGroupId}
                                    />
                                )}
                                {(selectedQuestionType === 'TIME') && (
                                    <TimeQuestionForm
                                        projectId={projectId}
                                        questionnaireId={questionnaireId}
                                        questionId={activeQuestionId}
                                        onSuccess={handleQuestionCreateSuccess}
                                        selectedLeafGroupId={activeLeafGroupId}
                                    />
                                )}
                                {(selectedQuestionType === 'NOTE') && (
                                    <NoteQuestionForm
                                        projectId={projectId}
                                        questionnaireId={questionnaireId}
                                        questionId={activeQuestionId}
                                        onSuccess={handleQuestionCreateSuccess}
                                        selectedLeafGroupId={activeLeafGroupId}
                                    />
                                )}
                                {(selectedQuestionType === 'FILE') && (
                                    <FileQuestionForm
                                        projectId={projectId}
                                        questionnaireId={questionnaireId}
                                        questionId={activeQuestionId}
                                        onSuccess={handleQuestionCreateSuccess}
                                        selectedLeafGroupId={activeLeafGroupId}
                                    />
                                )}
                                {(selectedQuestionType === 'IMAGE') && (
                                    <ImageQuestionForm
                                        projectId={projectId}
                                        questionnaireId={questionnaireId}
                                        questionId={activeQuestionId}
                                        onSuccess={handleQuestionCreateSuccess}
                                        selectedLeafGroupId={activeLeafGroupId}
                                    />
                                )}
                            </div>
                        )}
                    </div>
                )}
                {enketoPreviewModalShown && (
                    <QuestionnairePreviewModal
                        onClose={hideEnketoPreviewModal}
                        previewUrl={previewDetailsResponse?.private
                            .projectScope?.questionnaireExport?.enketoPreviewUrl ?? ''}
                    />
                )}
            </div>
        </div>
    );
}

Component.displayName = 'QuestionnaireEdit';
