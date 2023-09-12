import { useMemo, useCallback } from 'react';
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
    type ProjectScope,
} from '#utils/common';

import styles from './index.module.css';

const QUESTIONS_FROM_BANK = gql`
    query QuestionsFromBank (
        $leafGroupId: ID!,
        $questionnaireId: ID!,
        $projectId: ID!,
    ) {
        private {
            projectScope(pk: $projectId) {
                questions(filters: {
                    leafGroup: {
                        pk: $leafGroupId
                    }
                    questionnaire: { pk: $questionnaireId }
                }) {
                    items {
                        id
                        label
                        name
                        type
                        hint
                        leafGroupId
                        questionnaireId
                        choiceCollection {
                            id
                            name
                            label
                            questionnaireId
                        }
                    }
                }
            }
        }
    }
`;

type Question = NonNullable<NonNullable<ProjectScope<QuestionsFromBankQuery>['questions']>['items']>[number];

const questionKeySelector = (question: Question) => question.id;

interface QuestionProps {
    projectId: string;
    question: Question;
}

function QuestionRenderer(props: QuestionProps) {
    const {
        projectId,
        question,
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
        </div>
    );
}

interface Props {
    id: string;
    questionnaireId: string;
    projectId: string;
}

function QuestionsPreview(props: Props) {
    const {
        id,
        questionnaireId,
        projectId,
    } = props;

    const variables = useMemo(() => ({
        leafGroupId: id,
        questionnaireId,
        projectId,
    }), [
        id,
        questionnaireId,
        projectId,
    ]);

    const {
        data: questionsResponse,
        loading: questionsPending,
    } = useQuery<QuestionsFromBankQuery, QuestionsFromBankQueryVariables>(
        QUESTIONS_FROM_BANK,
        {
            variables,
        },
    );

    const questions = questionsResponse?.private?.projectScope?.questions?.items;
    const questionRendererParams = useCallback((_: string, datum: Question) => ({
        projectId,
        question: datum,
    }), [projectId]);

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