import { gql } from '@apollo/client';

import {
    QUESTION_FRAGMENT,
} from '../../queries';

export const QUESTIONS_FOR_LEAF_GROUP = gql`
    ${QUESTION_FRAGMENT}
    query QuestionsForLeafGroup(
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
                        order: ASC
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

export const UPDATE_QUESTIONS_ORDER = gql`
    ${QUESTION_FRAGMENT}
    mutation UpdateQuestionsOrder(
        $projectId: ID!,
        $questionnaireId: ID!,
        $leafGroupId: ID!,
        $data: [QuestionOrderInputType!]!
    ) {
        private {
            projectScope(pk: $projectId) {
                bulkUpdateQuestionsOrder(
                data: $data
                leafGroupId: $leafGroupId
                questionnaireId: $questionnaireId
                ) {
                    errors
                    results {
                        ...QuestionResponse
                    }
                }
            }
        }
    }
`;

export const UPDATE_QUESTIONS_VISIBILITY = gql`
    ${QUESTION_FRAGMENT}
    mutation UpdateQuestionsVisibility(
    $projectId: ID!,
    $questionIds: [ID!]!,
    $questionnaireId: ID!,
    $visibility: VisibilityActionEnum!,
    ){
        private {
            projectScope(pk: $projectId) {
                updateQuestionsVisibility(
                ids: $questionIds,
                questionnaireId: $questionnaireId,
                visibility: $visibility,
                ) {
                    errors
                    results {
                        ...QuestionResponse
                    }
                }
            }
        }
    }
`;
