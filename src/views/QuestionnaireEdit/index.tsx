import { useMemo, useCallback, useState } from 'react';
import {
    useParams,
} from 'react-router-dom';
import {
    IoAdd,
    IoCameraOutline,
    IoCloseOutline,
    IoDocumentTextOutline,
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
    isNotDefined,
    isDefined,
    listToGroupList,
    mapToList,
} from '@togglecorp/fujs';
import {
    gql,
    useQuery,
} from '@apollo/client';
import {
    Button,
    Container,
    Header,
    ListView,
    QuickActionButton,
    Tab,
    Tabs,
    TextOutput,
    useModalState,
} from '@the-deep/deep-ui';

import SubNavbar from '#components/SubNavbar';
import SortableList from '#components/SortableList';
import TocList from '#components/TocList';
import { flatten } from '#utils/common';
import {
    QuestionnaireQuery,
    QuestionnaireQueryVariables,
    QuestionsByGroupQuery,
    QuestionsByGroupQueryVariables,
    QuestionLeafGroupCategory1TypeEnum,
    QuestionLeafGroupCategory2TypeEnum,
    QuestionLeafGroupCategory3TypeEnum,
    QuestionLeafGroupCategory4TypeEnum,
    QuestionLeafGroupTypeEnum,
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

import {
    QUESTION_FRAGMENT,
} from './queries.ts';
import QuestionTypeItem, { QuestionType } from './QuestionTypeItem';
import QuestionPreview from './QuestionPreview';

import styles from './index.module.css';

const QUESTIONNAIRE = gql`
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
                        id
                        name
                        order
                        category1
                        category1Display
                        category2
                        category2Display
                        category3
                        category3Display
                        category4
                        category4Display
                        type
                        typeDisplay
                    }
                }
            }
        }
    }
`;

const QUESTIONS_BY_GROUP = gql`
    ${QUESTION_FRAGMENT}
    query QuestionsByGroup(
        $projectId: ID!,
        $questionnaireId: ID!,
        $leafGroupId: ID!,
    ) {
        private {
            projectScope(pk: $projectId) {
                id
                questions(
                    filters: {
                        questionnaire: {
                            pk: $questionnaireId,
                        },
                        leafGroup: {
                            pk: $leafGroupId,
                        },
                    }
                    order: {
                        createdAt: ASC
                    }
                ) {
                    count
                    limit
                    offset
                    items {
                        ...QuestionResponse
                    }
                }
            }
        }
    }
`;

type Question = NonNullable<NonNullable<NonNullable<NonNullable<QuestionsByGroupQuery['private']>['projectScope']>['questions']>['items']>[number];
type QuestionGroup = NonNullable<NonNullable<NonNullable<NonNullable<QuestionnaireQuery['private']>['projectScope']>['questionnaire']>['leafGroups']>[number];
const questionKeySelector = (q: Question) => q.id;
const groupTabKeySelector = (g: QuestionGroup) => g.id;

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
}

type TocItem = {
    key: string;
    parentKeys: string[];
    label: string;
    nodes: TocItem[];
};

function getNodes(input: Node[], parentKeys: string[]): TocItem[] {
    if (input.length <= 1) {
        return [];
    }
    const grouped = listToGroupList(
        input,
        (groupItem) => groupItem.category[0].key,
        (groupItem) => ({
            category: groupItem.category.slice(1),
            parentLabel: groupItem.category[0].label,
            parentKey: groupItem.category[0].key,
            type: groupItem.type,
        }),
    );

    return mapToList(
        grouped,
        (item, key) => ({
            key,
            label: item[0].parentLabel,
            parentKeys: [...parentKeys, item[0].parentKey],
            nodes: getNodes(item, [...parentKeys, item[0].parentKey]),
        }),
    );
}

interface TransformedGroupType {
    category: {
        key: QuestionLeafGroupCategory1TypeEnum
        | QuestionLeafGroupCategory2TypeEnum
        | QuestionLeafGroupCategory3TypeEnum
        | QuestionLeafGroupCategory4TypeEnum;
        label: string;
    }[];
    type: QuestionLeafGroupTypeEnum;
}

const questionTypeKeySelector = (q: QuestionType) => q.key;
const PAGE_SIZE = 15;

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
    ] = useState<QuestionGroup[]>([]);

    const {
        data: questionnaireResponse,
    } = useQuery<QuestionnaireQuery, QuestionnaireQueryVariables>(
        QUESTIONNAIRE,
        {
            skip: isNotDefined(questionnaireVariables),
            variables: questionnaireVariables,
            onCompleted: (response) => {
                const questionGroups = response?.private.projectScope?.questionnaire?.leafGroups;
                setOrderedOptions(questionGroups ?? []);
            },
        },
    );

    const questionnaireTitle = questionnaireResponse?.private.projectScope?.questionnaire?.title;
    const projectTitle = questionnaireResponse?.private.projectScope?.project.title;

    const selectedParentQuestionGroups = orderedOptions?.filter(
        (group) => selectedGroups.includes(group.id),
    );

    const transformedGroups: TransformedGroupType[] = useMemo(() => (
        orderedOptions.map((g) => {
            if (isDefined(g.category3) && isDefined(g.category4)) {
                return ({
                    category: [
                        {
                            key: g.category1,
                            label: String(g.category1Display),
                        },
                        {
                            key: g.category2,
                            label: String(g.category2Display),
                        },
                        {
                            key: g.category3,
                            label: String(g.category3Display),
                        },
                        {
                            key: g.category4,
                            label: String(g.category4Display),
                        },
                    ],
                    type: g.type,
                });
            }
            return ({
                category: [
                    {
                        key: g.category1,
                        label: String(g.category1Display),
                    },
                    {
                        key: g.category2,
                        label: String(g.category2Display),
                    },
                ],
                type: g.type,
            });
        })
    ), [
        orderedOptions,
    ]);

    const groupOptionsSafe = getNodes(transformedGroups, []);

    const flatList = useMemo(() => {
        const a = flatten(
            groupOptionsSafe,
            (item) => ({
                key: item.parentKeys.join('-'),
            }),
            (item) => item.nodes,
        );
        return a;
    }, [groupOptionsSafe]);

    const handleGroupOptionsChange = useCallback((newVal: TocItem[] | undefined) => {
        // FIXME: Add handler
        console.log('aditya', newVal, flatList);
    }, [
        flatList,
    ]);

    const [activeGroupTab, setActiveGroupTab] = useState<string | undefined>(
        selectedParentQuestionGroups?.[0]?.name,
    );

    // NOTE: If none of the tabs are selected, 1st group should be selected
    const finalSelectedTab = activeGroupTab ?? selectedGroups[0];

    const questionsVariables = useMemo(() => {
        if (isNotDefined(projectId)
            || isNotDefined(questionnaireId)
            || isNotDefined(finalSelectedTab)) {
            return undefined;
        }

        return ({
            projectId,
            questionnaireId,
            leafGroupId: finalSelectedTab,
        });
    }, [
        projectId,
        questionnaireId,
        finalSelectedTab,
    ]);

    const [
        orderedQuestions,
        setOrderedQuestions,
    ] = useState<Question[] | undefined>();

    const {
        refetch: retriggerQuestions,
    } = useQuery<QuestionsByGroupQuery, QuestionsByGroupQueryVariables>(
        QUESTIONS_BY_GROUP,
        {
            skip: isNotDefined(questionsVariables),
            variables: questionsVariables,
            onCompleted: (response) => {
                const questions = response?.private?.projectScope?.questions?.items;
                setOrderedQuestions(questions);
            },
        },
    );

    const handleQuestionCreateSuccess = useCallback(() => {
        hideAddQuestionPane();
        retriggerQuestions();
    }, [
        hideAddQuestionPane,
        retriggerQuestions,
    ]);

    const questionTypeRendererParams = useCallback((key: string, data: QuestionType) => ({
        questionType: data,
        name: key,
        onQuestionClick: setSelectedQuestionType,
    }), []);

    const questionRendererParams = useCallback((_: string, data: Question) => ({
        question: data,
        showAddQuestionPane,
        setSelectedQuestionType,
        projectId,
        setActiveQuestionId,
    }), [
        showAddQuestionPane,
        projectId,
    ]);

    const handleQuestionAdd = useCallback(() => {
        showAddQuestionPane();
        setActiveQuestionId(undefined);
    }, [
        showAddQuestionPane,
    ]);

    const groupTabRenderParams = useCallback((_: string, datum: QuestionGroup) => ({
        children: datum.name,
        name: datum.id,
    }), []);

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
                    heading="Select Questions"
                    contentClassName={styles.leftContent}
                >
                    <TocList
                        orderedOptions={groupOptionsSafe}
                        onOrderedOptionsChange={handleGroupOptionsChange}
                        onSelectedGroupsChange={setSelectedGroups}
                        selectedGroups={selectedGroups}
                        onActiveTabChange={setActiveGroupTab}
                    />
                </Container>
                <div className={styles.content}>
                    <Header
                        className={styles.header}
                        heading="My Questionnaire"
                        actions={(
                            <Button
                                name={undefined}
                                onClick={handleQuestionAdd}
                                icons={<IoAdd />}
                                disabled={addQuestionPaneShown}
                            >
                                Add Question
                            </Button>
                        )}
                    />
                    <Tabs
                        onChange={setActiveGroupTab}
                        value={finalSelectedTab}
                        variant="secondary"
                    >
                        <ListView
                            className={styles.tabs}
                            data={selectedParentQuestionGroups}
                            keySelector={groupTabKeySelector}
                            renderer={Tab}
                            rendererParams={groupTabRenderParams}
                            filtered={false}
                            errored={false}
                            pending={false}
                        />
                        <SortableList
                            className={styles.questionList}
                            data={orderedQuestions}
                            direction="vertical"
                            keySelector={questionKeySelector}
                            // TODO: check this error
                            renderer={QuestionPreview}
                            rendererParams={questionRendererParams}
                            onChange={setOrderedQuestions}
                            borderBetweenItem
                            emptyMessage="There are no questions in this questionnaire yet."
                            messageShown
                            filtered={false}
                            errored={false}
                            pending={false}
                        />
                    </Tabs>
                </div>
                {addQuestionPaneShown && (
                    <div className={styles.rightPane}>
                        <Header
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
                        <div className={styles.question}>
                            {(selectedQuestionType === 'TEXT') && (
                                <TextQuestionForm
                                    projectId={projectId}
                                    questionnaireId={questionnaireId}
                                    questionId={activeQuestionId}
                                    onSuccess={handleQuestionCreateSuccess}
                                />
                            )}
                            {(selectedQuestionType === 'INTEGER') && (
                                <IntegerQuestionForm
                                    projectId={projectId}
                                    questionnaireId={questionnaireId}
                                    questionId={activeQuestionId}
                                    onSuccess={handleQuestionCreateSuccess}
                                />
                            )}
                            {(selectedQuestionType === 'RANK') && (
                                <RankQuestionForm
                                    projectId={projectId}
                                    questionnaireId={questionnaireId}
                                    questionId={activeQuestionId}
                                    onSuccess={handleQuestionCreateSuccess}
                                />
                            )}
                            {(selectedQuestionType === 'SELECT_ONE') && (
                                <SelectOneQuestionForm
                                    projectId={projectId}
                                    questionnaireId={questionnaireId}
                                    questionId={activeQuestionId}
                                    onSuccess={handleQuestionCreateSuccess}
                                />
                            )}
                            {(selectedQuestionType === 'SELECT_MULTIPLE') && (
                                <SelectMultipleQuestionForm
                                    projectId={projectId}
                                    questionnaireId={questionnaireId}
                                    questionId={activeQuestionId}
                                    onSuccess={handleQuestionCreateSuccess}
                                />
                            )}
                            {(selectedQuestionType === 'DATE') && (
                                <DateQuestionForm
                                    projectId={projectId}
                                    questionnaireId={questionnaireId}
                                    questionId={activeQuestionId}
                                    onSuccess={handleQuestionCreateSuccess}
                                />
                            )}
                            {(selectedQuestionType === 'TIME') && (
                                <TimeQuestionForm
                                    projectId={projectId}
                                    questionnaireId={questionnaireId}
                                    questionId={activeQuestionId}
                                    onSuccess={handleQuestionCreateSuccess}
                                />
                            )}
                            {(selectedQuestionType === 'NOTE') && (
                                <NoteQuestionForm
                                    projectId={projectId}
                                    questionnaireId={questionnaireId}
                                    questionId={activeQuestionId}
                                    onSuccess={handleQuestionCreateSuccess}
                                />
                            )}
                            {(selectedQuestionType === 'FILE') && (
                                <FileQuestionForm
                                    projectId={projectId}
                                    questionnaireId={questionnaireId}
                                    questionId={activeQuestionId}
                                    onSuccess={handleQuestionCreateSuccess}
                                />
                            )}
                            {(selectedQuestionType === 'IMAGE') && (
                                <ImageQuestionForm
                                    projectId={projectId}
                                    questionnaireId={questionnaireId}
                                    questionId={activeQuestionId}
                                    onSuccess={handleQuestionCreateSuccess}
                                />
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

Component.displayName = 'QuestionnaireEdit';
