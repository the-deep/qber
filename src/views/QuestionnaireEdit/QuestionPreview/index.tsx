import {
    QuestionnaireQuery,
} from '#generated/types';
import TextQuestionPreview from '#components/questionPreviews/TextQuestionPreview';
import IntegerQuestionPreview from '#components/questionPreviews/IntegerQuestionPreview';
import RankQuestionPreview from '#components/questionPreviews/RankQuestionPreview';

import styles from './index.module.css';

type Question = NonNullable<NonNullable<NonNullable<NonNullable<QuestionnaireQuery['private']>['projectScope']>['questions']>['items']>[number];

interface QuestionProps {
    question: Question;
}

function QuestionPreview(props: QuestionProps) {
    const {
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
            {(question.type === 'RANK') && (
                <RankQuestionPreview
                    className={styles.questionItem}
                    label={question.label}
                    hint={question.hint}
                />
            )}
        </div>
    );
}

export default QuestionPreview;
