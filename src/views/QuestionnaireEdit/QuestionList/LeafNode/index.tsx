import {
    useState,
    useCallback,
    useMemo,
} from 'react';
import {
    useQuery,
    useMutation,
} from '@apollo/client';
import { getOperationName } from 'apollo-link';
import {
    compareNumber,
    isNotDefined,
    isDefined,
} from '@togglecorp/fujs';
import {
    useAlert,
} from '@the-deep/deep-ui';

import { apolloClient } from '#configs/apollo';
import SortableList from '#components/SortableList';
import {
    QUESTIONNAIRE,
} from '#views/QuestionnaireEdit/queries';
import {
    QuestionsForLeafGroupQuery,
    QuestionsForLeafGroupQueryVariables,
    UpdateQuestionsVisibilityMutation,
    UpdateQuestionsVisibilityMutationVariables,
    UpdateQuestionsOrderMutation,
    UpdateQuestionsOrderMutationVariables,
    VisibilityActionEnum,
} from '#generated/types';
import {
    type ProjectScope,
} from '#utils/common';
import {
    ChoiceCollectionType,
} from '#types/common';

import QuestionPreview from './QuestionPreview';
import {
    QUESTIONS_FOR_LEAF_GROUP,
    UPDATE_QUESTIONS_ORDER,
    UPDATE_QUESTIONS_VISIBILITY,
} from './queries';

type Question = NonNullable<NonNullable<ProjectScope<QuestionsForLeafGroupQuery>['questions']>['items']>[number];
const questionKeySelector = (q: Question) => q.id;

interface Props {
    className?: string;
    projectId: string;
    questionnaireId: string;
    leafGroupId: string;
    onEditQuestionClick: (val?: string | undefined) => void;
    setSelectedQuestionType: React.Dispatch<React.SetStateAction<string | undefined>>;
    setActiveQuestionId: React.Dispatch<React.SetStateAction<string | undefined>>;
    setSelectedLeafGroupId: React.Dispatch<React.SetStateAction<string | undefined>>;
    choiceCollections: ChoiceCollectionType[] | undefined;
}

function LeafNode(props: Props) {
    const {
        className,
        projectId,
        questionnaireId,
        leafGroupId,
        onEditQuestionClick,
        setSelectedQuestionType,
        setActiveQuestionId,
        setSelectedLeafGroupId,
        choiceCollections,
    } = props;

    const alert = useAlert();

    const questionsVariables = useMemo(() => {
        if (isNotDefined(projectId)
            || isNotDefined(questionnaireId)
            || isNotDefined(leafGroupId)) {
            return undefined;
        }

        return ({
            projectId,
            questionnaireId,
            leafGroupId,
        });
    }, [
        projectId,
        questionnaireId,
        leafGroupId,
    ]);

    const [
        orderedQuestions,
        setOrderedQuestions,
    ] = useState<Question[] | undefined>();

    const {
        loading: questionsPending,
        refetch: retriggerQuestionsFetch,
    } = useQuery<QuestionsForLeafGroupQuery, QuestionsForLeafGroupQueryVariables>(
        QUESTIONS_FOR_LEAF_GROUP,
        {
            skip: isNotDefined(questionsVariables),
            variables: questionsVariables,
            onCompleted: (response) => {
                const questions = response?.private?.projectScope?.questions?.items;
                const sortedQuestions = [...(questions ?? [])];
                sortedQuestions.sort((a, b) => compareNumber(a.order, b.order));
                setOrderedQuestions(sortedQuestions);
            },
        },
    );

    const [
        triggerQuestionsOrderUpdate,
        { loading: questionsOrderUpdatePending },
    ] = useMutation<UpdateQuestionsOrderMutation, UpdateQuestionsOrderMutationVariables>(
        UPDATE_QUESTIONS_ORDER,
        {
            onCompleted: (response) => {
                const questionOrderResponse = response?.private
                    ?.projectScope?.bulkUpdateQuestionsOrder;
                if (questionOrderResponse?.errors) {
                    alert.show(
                        'Failed to update questions order',
                        { variant: 'error' },
                    );
                }
            },
            onError: () => {
                alert.show(
                    'Failed to update questions order',
                    { variant: 'error' },
                );
            },
        },
    );

    const [
        triggerQuestionsVisibilityUpdate,
    ] = useMutation<UpdateQuestionsVisibilityMutation, UpdateQuestionsVisibilityMutationVariables>(
        UPDATE_QUESTIONS_VISIBILITY,
        {
            onCompleted: (response) => {
                const questionsResponse = response?.private
                    ?.projectScope?.updateQuestionsVisibility;
                if (questionsResponse?.errors) {
                    alert.show(
                        'Failed to update questions visibility',
                    );
                }
                apolloClient.refetchQueries({
                    include: [
                        getOperationName(QUESTIONNAIRE),
                    ].filter(isDefined),
                });
            },
            onError: () => {
                alert.show(
                    'Failed to update questions visibility',
                );
            },
        },
    );

    const handleQuestionOrderChange = useCallback((val: Question[]) => {
        if (!val || !leafGroupId) {
            return;
        }
        const orderedQuestionsToSend = val.map(
            (question, index) => ({
                id: question.id,
                order: index + 1,
            }),
        );
        setOrderedQuestions(val);

        triggerQuestionsOrderUpdate({
            variables: {
                projectId,
                questionnaireId,
                leafGroupId,
                data: orderedQuestionsToSend,
            },
        });
    }, [
        projectId,
        questionnaireId,
        leafGroupId,
        triggerQuestionsOrderUpdate,
    ]);

    const handleSelectedQuestionsChange = useCallback((val: boolean, id: string) => {
        triggerQuestionsVisibilityUpdate({
            variables: {
                projectId,
                questionnaireId,
                questionIds: [id],
                visibility: val
                    ? 'SHOW' as VisibilityActionEnum
                    : 'HIDE' as VisibilityActionEnum,
            },
        });
    }, [
        triggerQuestionsVisibilityUpdate,
        projectId,
        questionnaireId,
    ]);

    const questionRendererParams = useCallback((_: string, datum: Question) => ({
        question: datum,
        showAddQuestionPane: onEditQuestionClick,
        setSelectedQuestionType,
        projectId,
        setActiveQuestionId,
        onSelectedQuestionsChange: handleSelectedQuestionsChange,
        setSelectedLeafGroupId,
        refetchQuestionList: retriggerQuestionsFetch,
        choiceCollection: choiceCollections?.find(
            (collection) => collection.id === datum.choiceCollectionId,
        ),
    }), [
        onEditQuestionClick,
        projectId,
        setActiveQuestionId,
        setSelectedQuestionType,
        handleSelectedQuestionsChange,
        setSelectedLeafGroupId,
        retriggerQuestionsFetch,
        choiceCollections,
    ]);

    return (
        <SortableList
            name="questions"
            className={className}
            data={orderedQuestions}
            direction="vertical"
            keySelector={questionKeySelector}
            renderer={QuestionPreview}
            rendererParams={questionRendererParams}
            onChange={handleQuestionOrderChange}
            borderBetweenItem
            emptyMessage="There are no questions in this questionnaire yet."
            pending={questionsPending || questionsOrderUpdatePending}
            messageShown
            filtered={false}
            errored={false}
        />
    );
}

export default LeafNode;
