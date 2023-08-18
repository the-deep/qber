import {
    isNotDefined,
} from '@togglecorp/fujs';
import {
    TabPanel,
} from '@the-deep/deep-ui';

import {
    QuestionsByGroupQuery,
} from '#generated/types';
import TextQuestionPreview from '#components/questionPreviews/TextQuestionPreview';
import IntegerQuestionPreview from '#components/questionPreviews/IntegerQuestionPreview';
import RankQuestionPreview from '#components/questionPreviews/RankQuestionPreview';

import styles from './index.module.css';

type Question = NonNullable<NonNullable<NonNullable<NonNullable<QuestionsByGroupQuery['private']>['projectScope']>['questions']>['items']>[number];

interface QuestionProps {
    question: Question;
}

function QuestionPreview(props: QuestionProps) {
    const {
        question,
    } = props;

    if (isNotDefined(question.groupId)) {
        return null;
    }

    return (
        <TabPanel
            name={question.groupId}
            className={styles.preview}
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
        </TabPanel>
    );
}

export default QuestionPreview;
