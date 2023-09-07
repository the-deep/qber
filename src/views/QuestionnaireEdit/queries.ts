import { gql } from '@apollo/client';

import {
    QuestionInfoQuery,
} from '#generated/types';

export type ChoiceCollectionType = NonNullable<NonNullable<NonNullable<NonNullable<QuestionInfoQuery['private']>['projectScope']>['question']>['choiceCollection']>;

export const QUESTION_FRAGMENT = gql`
    fragment QuestionResponse on QuestionType {
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
`;

export const QUESTION_INFO = gql`
    query QuestionInfo (
        $projectId: ID!,
        $questionId: ID!,
    ) {
        private {
            projectScope(pk: $projectId) {
                question(pk: $questionId) {
                    id
                    label
                    name
                    type
                    hint
                    leafGroupId
                    questionnaireId
                    choiceCollection {
                        id
                        label
                        name
                        questionnaireId
                    }
                }
            }
        }
    }
`;

export default QUESTION_INFO;
