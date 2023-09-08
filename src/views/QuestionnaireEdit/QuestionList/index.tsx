import { useCallback, useMemo, useState } from 'react';
import {
    IoAdd,
} from 'react-icons/io5';
import {
    isNotDefined,
    _cs,
} from '@togglecorp/fujs';
import {
    ListView,
    ExpandableContainer,
    QuickActionButton,
} from '@the-deep/deep-ui';
import {
    useQuery,
    gql,
} from '@apollo/client';

import SortableList from '#components/SortableList';
import {
    QuestionsByGroupQuery,
    QuestionsByGroupQueryVariables,
} from '#generated/types';
import {
    TocItem,
    getChildren,
} from '#utils/common';

import QuestionPreview from '../QuestionPreview';
import {
    QUESTION_FRAGMENT,
} from '../queries';

import styles from './index.module.css';

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

const questionKeySelector = (q: Question) => q.id;

interface QuestionRendererProps {
    item: TocItem,
    onEditQuestionClick: (val?: string | undefined) => void;
    projectId: string;
    questionnaireId: string;
    setActiveQuestionId: React.Dispatch<React.SetStateAction<string | undefined>>;
    setSelectedQuestionType: React.Dispatch<React.SetStateAction<string | undefined>>;
    level: number;
    handleQuestionAdd: (groupId: string) => void;
    addQuestionPaneShown: boolean;
    selectedGroups: string[];
    setSelectedLeafGroupId: React.Dispatch<React.SetStateAction<string | undefined>>;
}

function QuestionListRenderer(props: QuestionRendererProps) {
    const {
        item,
        onEditQuestionClick,
        projectId,
        selectedGroups,
        questionnaireId,
        setActiveQuestionId,
        setSelectedQuestionType,
        level,
        handleQuestionAdd,
        addQuestionPaneShown,
        setSelectedLeafGroupId,
    } = props;

    const questionsVariables = useMemo(() => {
        if (isNotDefined(projectId)
            || isNotDefined(questionnaireId)
            || !item.leafNode) {
            return undefined;
        }

        return ({
            projectId,
            questionnaireId,
            leafGroupId: item.id,
        });
    }, [
        projectId,
        questionnaireId,
        item,
    ]);

    const [
        orderedQuestions,
        setOrderedQuestions,
    ] = useState<Question[] | undefined>();

    const {
        loading: questionsPending,
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

    const [
        selectedQuestions,
        setSelectedQuestions,
    ] = useState<string[]>([]);

    const handleSelectedQuestionsChange = useCallback((val: boolean, id: string) => {
        setSelectedQuestions((prevVal: string[]) => {
            if (val) {
                return [...prevVal, id];
            }
            return prevVal.filter((question) => id !== question);
        });
    }, []);

    const questionRendererParams = useCallback((_: string, datum: Question) => ({
        question: datum,
        showAddQuestionPane: onEditQuestionClick,
        setSelectedQuestionType,
        projectId,
        setActiveQuestionId,
        selectedQuestions,
        onSelectedQuestionsChange: handleSelectedQuestionsChange,
        setSelectedLeafGroupId,
    }), [
        onEditQuestionClick,
        projectId,
        setActiveQuestionId,
        setSelectedQuestionType,
        selectedQuestions,
        handleSelectedQuestionsChange,
        setSelectedLeafGroupId,
    ]);

    return (
        <ExpandableContainer
            className={_cs(
                styles.item,
                item.leafNode && styles.child,
                (level === 2 && !item.leafNode) && styles.first,
                (level === 3 && !item.leafNode) && styles.second,
                (level === 4) && styles.third,
            )}
            heading={item.label}
            headingSize="extraSmall"
            headingClassName={styles.heading}
            headerClassName={styles.header}
            contentClassName={styles.content}
            headerActionsContainerClassName={styles.headerActions}
            headerActions={item.leafNode && (
                <QuickActionButton
                    name={item.id}
                    title="Add questions"
                    onClick={handleQuestionAdd}
                    disabled={addQuestionPaneShown}
                >
                    <IoAdd />
                </QuickActionButton>
            )}
            expansionTriggerArea="header"
            withoutBorder
            spacing="none"
            defaultVisibility={!item.leafNode}
            disabled={!item.leafNode}
        >
            {item.leafNode
                ? (
                    <SortableList
                        name="questions"
                        className={styles.questionList}
                        data={orderedQuestions}
                        direction="vertical"
                        keySelector={questionKeySelector}
                        renderer={QuestionPreview}
                        rendererParams={questionRendererParams}
                        onChange={setOrderedQuestions}
                        borderBetweenItem
                        emptyMessage="There are no questions in this questionnaire yet."
                        pending={questionsPending}
                        messageShown
                        filtered={false}
                        errored={false}
                    />
                )
                : (
                    // eslint-disable-next-line @typescript-eslint/no-use-before-define
                    <QuestionList
                        data={item}
                        projectId={projectId}
                        selectedGroups={selectedGroups}
                        questionnaireId={questionnaireId}
                        onEditQuestionClick={onEditQuestionClick}
                        setActiveQuestionId={setActiveQuestionId}
                        setSelectedQuestionType={setSelectedQuestionType}
                        level={level + 1}
                        handleQuestionAdd={handleQuestionAdd}
                        addQuestionPaneShown={addQuestionPaneShown}
                        setSelectedLeafGroupId={setSelectedLeafGroupId}
                    />
                )}
        </ExpandableContainer>
    );
}

const questionListKeySelector = (q: TocItem) => q.key;

interface Props{
    data: TocItem | undefined;
    onEditQuestionClick: (val?: string | undefined) => void;
    projectId: string;
    questionnaireId: string;
    setActiveQuestionId: React.Dispatch<React.SetStateAction<string | undefined>>;
    setSelectedQuestionType: React.Dispatch<React.SetStateAction<string | undefined>>;
    level: number;
    handleQuestionAdd: (groupId: string) => void;
    addQuestionPaneShown: boolean;
    selectedGroups: string[];
    setSelectedLeafGroupId: React.Dispatch<React.SetStateAction<string | undefined>>;
}

function QuestionList(props: Props) {
    const {
        data,
        selectedGroups,
        onEditQuestionClick,
        projectId,
        questionnaireId,
        setActiveQuestionId,
        setSelectedQuestionType,
        level,
        handleQuestionAdd,
        addQuestionPaneShown,
        setSelectedLeafGroupId,
    } = props;

    const questionListRendererParams = useCallback((_: string, datum: TocItem) => ({
        item: datum,
        projectId,
        questionnaireId,
        onEditQuestionClick,
        setActiveQuestionId,
        selectedGroups,
        setSelectedQuestionType,
        level,
        handleQuestionAdd,
        addQuestionPaneShown,
        setSelectedLeafGroupId,
    }), [
        projectId,
        questionnaireId,
        selectedGroups,
        onEditQuestionClick,
        setActiveQuestionId,
        setSelectedQuestionType,
        level,
        addQuestionPaneShown,
        handleQuestionAdd,
        setSelectedLeafGroupId,
    ]);

    const finalNodes = useMemo(() => (
        !data?.leafNode ? (
            data?.nodes?.map((item) => {
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
        ) : undefined
    ), [
        data,
        selectedGroups,
    ]);

    if (data?.leafNode) {
        return (
            <QuestionListRenderer
                item={data}
                projectId={projectId}
                questionnaireId={questionnaireId}
                onEditQuestionClick={onEditQuestionClick}
                setActiveQuestionId={setActiveQuestionId}
                setSelectedQuestionType={setSelectedQuestionType}
                level={level}
                handleQuestionAdd={handleQuestionAdd}
                addQuestionPaneShown={addQuestionPaneShown}
                selectedGroups={selectedGroups}
                setSelectedLeafGroupId={setSelectedLeafGroupId}
            />
        );
    }

    return (
        <ListView
            className={styles.list}
            data={finalNodes}
            keySelector={questionListKeySelector}
            rendererParams={questionListRendererParams}
            renderer={QuestionListRenderer}
            filtered={false}
            errored={false}
            pending={false}
        />
    );
}
export default QuestionList;
