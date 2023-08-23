import { useCallback } from 'react';
import {
    IoEllipsisVertical,
} from 'react-icons/io5';
import {
    isNotDefined,
    isDefined,
} from '@togglecorp/fujs';
import {
    TabPanel,
    Element,
    QuickActionDropdownMenu,
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

import styles from './index.module.css';

type Question = NonNullable<NonNullable<NonNullable<NonNullable<QuestionsByGroupQuery['private']>['projectScope']>['questions']>['items']>[number];

interface QuestionProps {
    question: Question;
    showAddQuestionPane: (val?: string | undefined) => void;
    setSelectedQuestionType: React.Dispatch<React.SetStateAction<string | undefined>>;
    projectId: string | undefined;
    setActiveQuestionId: React.Dispatch<React.SetStateAction<string | undefined>>;
}

function QuestionPreview(props: QuestionProps) {
    const {
        question,
        showAddQuestionPane,
        setSelectedQuestionType,
        setActiveQuestionId,
        projectId,
    } = props;

    const handleEditQuestionClick = useCallback((val: string) => {
        showAddQuestionPane();
        setSelectedQuestionType(question.type);
        setActiveQuestionId(val);
    }, [
        showAddQuestionPane,
        setSelectedQuestionType,
        question.type,
        setActiveQuestionId,
    ]);

    if (isNotDefined(question.groupId)) {
        return null;
    }

    return (
        <TabPanel
            name={question.groupId}
            className={styles.preview}
        >
            <Element
                className={styles.questionWrapper}
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
                {(question.type === 'RANK') && (
                    <RankQuestionPreview
                        className={styles.questionItem}
                        label={question.label}
                        hint={question.hint}
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
        </TabPanel>
    );
}

export default QuestionPreview;
