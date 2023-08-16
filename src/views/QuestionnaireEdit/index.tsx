import { useMemo, useCallback, useState } from 'react';
import {
    useParams,
} from 'react-router-dom';
import {
    IoAdd,
    IoCloseOutline,
    IoRadioButtonOn,
} from 'react-icons/io5';
import {
    MdOutline123,
    MdOutlineAbc,
    MdOutlineChecklist,
} from 'react-icons/md';
import { GrDrag } from 'react-icons/gr';
import {
    isNotDefined,
    isDefined,
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
    TextOutput,
    useModalState,
} from '@the-deep/deep-ui';

import SubNavbar from '#components/SubNavbar';
import SortableList, { Attributes, Listeners } from '#components/SortableList';
import TocList from '#components/TocList';
import {
    QuestionnaireQuery,
    QuestionnaireQueryVariables,
} from '#generated/types';

import TextQuestionForm from './TextQuestionForm';
import IntegerQuestionForm from './IntegerQuestionForm';
import RankQuestionForm from './RankQuestionForm';
import SelectOneQuestionForm from './SelectOneQuestionForm';
import QuestionTypeItem, { QuestionType } from './QuestionTypeItem';
import QuestionPreview from './QuestionPreview';
import SelectMultipleQuestionForm from './SelectMultipleQuestionForm';

import styles from './index.module.css';

const QUESTIONNAIRE = gql`
    query Questionnaire(
        $projectId: ID!,
        $questionnaireId: ID!,
        $limit: Int,
        $offset: Int,
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
                }
                questions(
                    filters: {
                        questionnaire: {
                            pk: $questionnaireId,
                        }
                    }
                    order: {
                        createdAt: ASC
                    }
                    pagination: {
                        limit: $limit,
                        offset: $offset,
                    }
                ) {
                    count
                    limit
                    offset
                    items {
                        createdAt
                        hint
                        id
                        label
                        name
                        type
                        questionnaireId
                    }
                }
                groups(filters: {
                    questionnaire: {
                        pk: $questionnaireId
                    }
                }) {
                    items {
                        id
                        parentId
                        relevant
                        questionnaireId
                        label
                        name
                    }
                }
            }
        }
    }
`;

type Question = NonNullable<NonNullable<NonNullable<NonNullable<QuestionnaireQuery['private']>['projectScope']>['questions']>['items']>[number];
type QuestionGroup = NonNullable<NonNullable<NonNullable<NonNullable<QuestionnaireQuery['private']>['projectScope']>['groups']>['items']>[number];
const questionKeySelector = (q: Question) => q.id;
const questionGroupKeySelector = (g: QuestionGroup) => g.id;

interface QuestionGroupProps {
    id: string;
    item: QuestionGroup;
    attributes?: Attributes;
    listeners?: Listeners;
    options: QuestionGroup[];
}

function QuestionGroupItem(props: QuestionGroupProps) {
    const {
        id,
        item,
        attributes,
        listeners,
        options,
    } = props;

    const rendererParams = useCallback((key: string, datum: QuestionGroup) => ({
        id: key,
        item: datum,
        options,
    }), [options]);

    return (
        <Container
            headerIcons={(
                <QuickActionButton
                    name={id}
                    // FIXME: use translation
                    title="Drag"
                    // eslint-disable-next-line react/jsx-props-no-spreading
                    {...attributes}
                    // eslint-disable-next-line react/jsx-props-no-spreading
                    {...listeners}
                >
                    <GrDrag />
                </QuickActionButton>
            )}
            className={styles.groupItem}
            heading={item.label}
            headingSize="extraSmall"
        >
            <TocList
                parentId={item.id}
                options={options}
                renderer={QuestionGroupItem}
                rendererParams={rendererParams}
            />
        </Container>
    );
}

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
        icon: <MdOutlineChecklist />,
    },
];

const questionTypeKeySelector = (q: QuestionType) => q.key;
const PAGE_SIZE = 15;

// FIXME: The type is not right
interface QuestionnaireParams {
    projectId: string | undefined;
    questionnaireId: string | undefined;
}

// eslint-disable-next-line import/prefer-default-export
export function Component() {
    const {
        projectId,
        questionnaireId,
    } = useParams<QuestionnaireParams>();

    const [
        addQuestionPaneShown,
        showAddQuestionPane,
        hideAddQuestionPane,
    ] = useModalState(false);

    const [
        selectedQuestionType,
        setSelectedQuestionType,
    ] = useState<string | undefined>();

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

    const {
        data: questionnaireResponse,
    } = useQuery<QuestionnaireQuery, QuestionnaireQueryVariables>(
        QUESTIONNAIRE,
        {
            skip: isNotDefined(questionnaireVariables),
            variables: questionnaireVariables,
        },
    );

    const questionnaireTitle = questionnaireResponse?.private.projectScope?.questionnaire?.title;
    const projectTitle = questionnaireResponse?.private.projectScope?.project.title;
    const questionsData = questionnaireResponse?.private.projectScope?.questions?.items;

    const questionGroups = questionnaireResponse?.private.projectScope?.groups.items;

    const questionTypeRendererParams = useCallback((key: string, data: QuestionType) => ({
        questionType: data,
        name: key,
        onQuestionClick: setSelectedQuestionType,
    }), []);

    const questionRendererParams = useCallback((_: string, data: Question) => ({
        question: data,
    }), [
    ]);

    const tocRendererParams = useCallback((key: string, data: QuestionGroup) => ({
        id: key,
        item: data,
    }), []);

    if (isNotDefined(projectId) || isNotDefined(questionnaireId)) {
        return undefined;
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
                        options={questionGroups}
                        renderer={QuestionGroupItem}
                        rendererParams={tocRendererParams}
                        parentId={null}
                    />
                </Container>
                <div className={styles.content}>
                    <Header
                        className={styles.header}
                        heading="My Questionnaire"
                        actions={(
                            <Button
                                name={undefined}
                                onClick={showAddQuestionPane}
                                icons={<IoAdd />}
                                disabled={addQuestionPaneShown}
                            >
                                Add Question
                            </Button>
                        )}
                    />
                    <ListView
                        className={styles.questionList}
                        data={questionsData}
                        keySelector={questionKeySelector}
                        renderer={QuestionPreview}
                        rendererParams={questionRendererParams}
                        borderBetweenItem
                        emptyMessage="There are no questions in this questionnaire yet."
                        messageShown
                        filtered={false}
                        errored={false}
                        pending={false}
                    />
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
                                />
                            )}
                            {(selectedQuestionType === 'INTEGER') && (
                                <IntegerQuestionForm
                                    projectId={projectId}
                                    questionnaireId={questionnaireId}
                                />
                            )}
                            {(selectedQuestionType === 'RANK') && (
                                <RankQuestionForm
                                    projectId={projectId}
                                    questionnaireId={questionnaireId}
                                />
                            )}
                            {(selectedQuestionType === 'SELECT_ONE') && (
                                <SelectOneQuestionForm
                                    projectId={projectId}
                                    questionnaireId={questionnaireId}
                                />
                            )}
                            {(selectedQuestionType === 'SELECT_MULTIPLE') && (
                                <SelectMultipleQuestionForm
                                    projectId={projectId}
                                    questionnaireId={questionnaireId}
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
