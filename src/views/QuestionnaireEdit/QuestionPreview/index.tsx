import { useCallback } from 'react';
import {
    IoEllipsisVertical,
} from 'react-icons/io5';
import {
    GrDrag,
} from 'react-icons/gr';
import {
    gql,
    useMutation,
} from '@apollo/client';
import {
    isNotDefined,
    isDefined,
} from '@togglecorp/fujs';
import {
    Element,
    Checkbox,
    QuickActionDropdownMenu,
    QuickActionButton,
    DropdownMenuItem,
    useAlert,
    useConfirmation,
} from '@the-deep/deep-ui';

import TextQuestionPreview from '#components/questionPreviews/TextQuestionPreview';
import IntegerQuestionPreview from '#components/questionPreviews/IntegerQuestionPreview';
import RankQuestionPreview from '#components/questionPreviews/RankQuestionPreview';
import DateQuestionPreview from '#components/questionPreviews/DateQuestionPreview';
import TimeQuestionPreview from '#components/questionPreviews/TimeQuestionPreview';
import NoteQuestionPreview from '#components/questionPreviews/NoteQuestionPreview';
import ImageQuestionPreview from '#components/questionPreviews/ImageQuestionPreview';
import FileQuestionPreview from '#components/questionPreviews/FileQuestionPreview';
import SelectOneQuestionPreview from '#components/questionPreviews/SelectOneQuestionPreview';
import SelectMultipleQuestionPreview from '#components/questionPreviews/SelectMultipleQuestionPreview';
import { Attributes, Listeners } from '#components/SortableList';
import {
    QuestionsByGroupQuery,
    DeleteQuestionMutation,
    DeleteQuestionMutationVariables,
} from '#generated/types';

import {
    QUESTION_FRAGMENT,
} from '../queries';

import styles from './index.module.css';

type Question = NonNullable<NonNullable<NonNullable<NonNullable<QuestionsByGroupQuery['private']>['projectScope']>['questions']>['items']>[number];

const DELETE_QUESTION = gql`
    ${QUESTION_FRAGMENT}
    mutation DeleteQuestion (
        $projectId: ID!,
        $questionId: ID!,
    ) {
        private {
            projectScope(pk: $projectId) {
                deleteQuestion(id: $questionId) {
                    errors
                    ok
                    result {
                        ...QuestionResponse
                    }
                }
            }
        }
    }
`;

interface QuestionProps {
    question: Question;
    showAddQuestionPane: (val?: string | undefined) => void;
    setSelectedQuestionType: React.Dispatch<React.SetStateAction<string | undefined>>;
    projectId: string | undefined;
    setActiveQuestionId: React.Dispatch<React.SetStateAction<string | undefined>>;
    onSelectedQuestionsChange: (val: boolean, id: string) => void;
    setSelectedLeafGroupId : React.Dispatch<React.SetStateAction<string | undefined>>;
    refetchQuestionList: () => void;
    attributes?: Attributes;
    listeners?: Listeners;
}

function QuestionPreview(props: QuestionProps) {
    const {
        question,
        showAddQuestionPane,
        setSelectedQuestionType,
        setActiveQuestionId,
        onSelectedQuestionsChange,
        setSelectedLeafGroupId,
        projectId,
        refetchQuestionList,
        attributes,
        listeners,
    } = props;

    const alert = useAlert();

    const [
        triggerQuestionDelete,
    ] = useMutation<DeleteQuestionMutation, DeleteQuestionMutationVariables>(
        DELETE_QUESTION,
        {
            onCompleted: (res) => {
                const questionResponse = res.private.projectScope?.deleteQuestion;
                if (!questionResponse?.ok) {
                    alert.show(
                        'Failed to delete question.',
                        { variant: 'error' },
                    );
                }
                alert.show(
                    'Successfully deleted question.',
                    { variant: 'success' },
                );
            },
            onError: () => {
                alert.show(
                    'Failed to delete question.',
                    { variant: 'error' },
                );
            },
        },
    );

    const handleEditQuestionClick = useCallback((val: string) => {
        if (isNotDefined(question.leafGroupId)) {
            return;
        }
        showAddQuestionPane();
        setSelectedQuestionType(question.type);
        setActiveQuestionId(val);
        setSelectedLeafGroupId(question.leafGroupId);
    }, [
        showAddQuestionPane,
        setSelectedQuestionType,
        setActiveQuestionId,
        setSelectedLeafGroupId,
        question,
    ]);

    const handleDeleteQuestionClick = useCallback(() => {
        if (isNotDefined(projectId)) {
            return;
        }
        triggerQuestionDelete({
            variables: {
                projectId,
                questionId: question.id,
            },
        });
        refetchQuestionList();
    }, [
        triggerQuestionDelete,
        projectId,
        question,
        refetchQuestionList,
    ]);

    const [
        modal,
        onDeleteQuestionClick,
    ] = useConfirmation({
        showConfirmationInitially: false,
        onConfirm: handleDeleteQuestionClick,
        message: 'Are you sure you wish to delete the question from this questionnaire? This cannot be undone.',
    });

    return (
        <Element
            className={styles.questionWrapper}
            icons={(
                <>
                    <QuickActionButton
                        name={question.id}
                        className={styles.dragIcon}
                        title="Drag"
                        variant="transparent"
                        // eslint-disable-next-line react/jsx-props-no-spreading
                        {...attributes}
                        // eslint-disable-next-line react/jsx-props-no-spreading
                        {...listeners}
                    >
                        <GrDrag />
                    </QuickActionButton>
                    { /* TODO: Fix the selection behavior */ }
                    <Checkbox
                        name={question.id}
                        value={!question.isHidden}
                        onChange={onSelectedQuestionsChange}
                    />
                </>
            )}
            actions={(
                <QuickActionDropdownMenu
                    label={<IoEllipsisVertical />}
                    variant="secondary"
                >
                    <DropdownMenuItem
                        name={question.id}
                        onClick={handleEditQuestionClick}
                    >
                        Edit question
                    </DropdownMenuItem>
                    <DropdownMenuItem
                        name={question.id}
                        onClick={onDeleteQuestionClick}
                    >
                        Delete Question
                    </DropdownMenuItem>
                </QuickActionDropdownMenu>
            )}
        >
            {(question.type === 'TEXT') && (
                <TextQuestionPreview
                    className={styles.questionItem}
                    label={question.label}
                    hint={question.hint}
                />
            )}
            {(question.type === 'INTEGER') && (
                <IntegerQuestionPreview
                    className={styles.questionItem}
                    label={question.label}
                    hint={question.hint}
                />
            )}
            {(question.type === 'RANK') && isDefined(projectId) && (
                <RankQuestionPreview
                    className={styles.questionItem}
                    label={question.label}
                    hint={question.hint}
                    projectId={projectId}
                    choiceCollectionId={question.choiceCollection?.id}
                />
            )}
            {(question.type === 'DATE') && (
                <DateQuestionPreview
                    className={styles.questionItem}
                    label={question.label}
                    hint={question.hint}
                />
            )}
            {(question.type === 'TIME') && (
                <TimeQuestionPreview
                    className={styles.questionItem}
                    label={question.label}
                    hint={question.hint}
                />
            )}
            {(question.type === 'NOTE') && (
                <NoteQuestionPreview
                    className={styles.questionItem}
                    label={question.label}
                />
            )}
            {(question.type === 'FILE') && (
                <FileQuestionPreview
                    className={styles.questionItem}
                    label={question.label}
                    hint={question.hint}
                />
            )}
            {(question.type === 'IMAGE') && (
                <ImageQuestionPreview
                    className={styles.questionItem}
                    label={question.label}
                    hint={question.hint}
                />
            )}
            {(question.type === 'SELECT_ONE') && isDefined(projectId) && (
                <SelectOneQuestionPreview
                    className={styles.questionItem}
                    label={question.label}
                    hint={question.hint}
                    projectId={projectId}
                    choiceCollectionId={question.choiceCollection?.id}
                />
            )}
            {(question.type === 'SELECT_MULTIPLE') && isDefined(projectId) && (
                <SelectMultipleQuestionPreview
                    className={styles.questionItem}
                    label={question.label}
                    hint={question.hint}
                    projectId={projectId}
                    choiceCollectionId={question.choiceCollection?.id}
                />
            )}
            {modal}
        </Element>
    );
}

export default QuestionPreview;
