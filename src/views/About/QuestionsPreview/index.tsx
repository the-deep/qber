import { useCallback } from 'react';
import { gql, useQuery } from '@apollo/client';
import {
    isDefined,
} from '@togglecorp/fujs';
import {
    ListView,
} from '@the-deep/deep-ui';

import {
    QuestionsFromBankQuery,
    QuestionsFromBankQueryVariables,
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
import {
    ChoiceCollectionType,
} from '#types/common';

import styles from './index.module.css';

const QUESTIONS_FROM_BANK = gql`
    query QuestionsFromBank (
        $questionBankId: ID!,
        $leafGroupId: ID!,
    ) {
        private {
            id
            qbQuestions(
                filters: {
                    qbank: {pk: $questionBankId}
                    leafGroup: {pk: $leafGroupId}
                },
                pagination: {
                    offset: 0,
                    limit: 50,
                },
            ) {
                count
                items {
                    id
                    label
                    name
                    type
                    hint
                    leafGroupId
                    qbankId
                    choiceCollectionId
                }
            }
        }
    }
`;

type Question = NonNullable<NonNullable<NonNullable<QuestionsFromBankQuery['private']>['qbQuestions']>['items']>[number];

const questionKeySelector = (question: Question) => question.id;

interface QuestionProps {
    question: Question;
    choiceCollection: ChoiceCollectionType | undefined;
}

function QuestionRenderer(props: QuestionProps) {
    const {
        question,
        choiceCollection,
    } = props;

    return (
        <div className={styles.preview}>
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
            {(question.type === 'RANK') && isDefined(choiceCollection) && (
                <RankQuestionPreview
                    className={styles.questionItem}
                    label={question.label}
                    hint={question.hint}
                    choiceCollection={choiceCollection}
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
            {(question.type === 'SELECT_ONE') && isDefined(choiceCollection) && (
                <SelectOneQuestionPreview
                    className={styles.questionItem}
                    label={question.label}
                    hint={question.hint}
                    choiceCollection={choiceCollection}
                />
            )}
            {(question.type === 'SELECT_MULTIPLE') && isDefined(choiceCollection) && (
                <SelectMultipleQuestionPreview
                    className={styles.questionItem}
                    label={question.label}
                    hint={question.hint}
                    choiceCollection={choiceCollection}
                />
            )}
        </div>
    );
}

interface Props {
    questionBankId: string;
    leafGroupId: string;
    choiceCollections: ChoiceCollectionType[] | undefined;
}

function QuestionsPreview(props: Props) {
    const {
        leafGroupId,
        questionBankId,
        choiceCollections,
    } = props;

    const {
        data: questionsResponse,
        loading: questionsPending,
    } = useQuery<QuestionsFromBankQuery, QuestionsFromBankQueryVariables>(
        QUESTIONS_FROM_BANK,
        {
            variables: {
                questionBankId,
                leafGroupId,
            },
        },
    );

    const questions = questionsResponse?.private?.qbQuestions?.items;
    const questionRendererParams = useCallback((_: string, datum: Question) => ({
        question: datum,
        choiceCollection: choiceCollections?.find(
            (collection) => collection.id === datum.choiceCollectionId,
        ),
    }), [
        choiceCollections,
    ]);

    return (
        <ListView
            className={styles.questionList}
            data={questions}
            keySelector={questionKeySelector}
            renderer={QuestionRenderer}
            rendererParams={questionRendererParams}
            borderBetweenItem
            errored={false}
            filtered={false}
            pending={questionsPending}
        />
    );
}

export default QuestionsPreview;
