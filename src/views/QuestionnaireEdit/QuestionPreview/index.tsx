import { useCallback } from 'react';
import {
    IoEllipsisVertical,
} from 'react-icons/io5';
import {
    GrDrag,
} from 'react-icons/gr';
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
} from '@the-deep/deep-ui';

import {
    QuestionsByGroupQuery,
} from '#generated/types';
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

import styles from './index.module.css';

type Question = NonNullable<NonNullable<NonNullable<NonNullable<QuestionsByGroupQuery['private']>['projectScope']>['questions']>['items']>[number];

interface QuestionProps {
    question: Question;
    showAddQuestionPane: (val?: string | undefined) => void;
    setSelectedQuestionType: React.Dispatch<React.SetStateAction<string | undefined>>;
    projectId: string | undefined;
    setActiveQuestionId: React.Dispatch<React.SetStateAction<string | undefined>>;
    selectedQuestions: string[] | undefined;
    onSelectedQuestionsChange: (val: boolean, id: string) => void;
    setSelectedLeafGroupId : React.Dispatch<React.SetStateAction<string | undefined>>;
    attributes?: Attributes;
    listeners?: Listeners;
}

function QuestionPreview(props: QuestionProps) {
    const {
        question,
        showAddQuestionPane,
        setSelectedQuestionType,
        setActiveQuestionId,
        selectedQuestions,
        onSelectedQuestionsChange,
        setSelectedLeafGroupId,
        projectId,
        attributes,
        listeners,
    } = props;

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
                        value={selectedQuestions?.includes(question.id)}
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
        </Element>
    );
}

export default QuestionPreview;
