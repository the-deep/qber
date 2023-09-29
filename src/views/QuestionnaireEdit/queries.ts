import { gql } from '@apollo/client';

export const QUESTION_FRAGMENT = gql`
    fragment QuestionResponse on QuestionType {
        id
        label
        name
        type
        hint
        required
        order
        isHidden
        leafGroupId
        questionnaireId
        requiredDuration
        priorityLevel
        dataCollectionMethod
        enumeratorSkill
        constraint
        choiceCollectionId
    }
`;

export const LEAF_GROUPS_FRAGMENT = gql`
    fragment LeafGroups on QuestionLeafGroupType {
        id
        name
        order
        category1
        category1Display
        category2
        category2Display
        category3
        category3Display
        category4
        category4Display
        type
        typeDisplay
        isHidden
    }
`;

export const CHOICE_COLLECTION_FRAGMENT = gql`
    fragment ChoiceCollections on QuestionChoiceCollectionType {
        id
        name
        label
        questionnaireId
        choices {
            id
            clientId
            name
            label
            collectionId
        }
    }
`;

export const QUESTION_INFO = gql`
    ${QUESTION_FRAGMENT}
    query QuestionInfo (
        $projectId: ID!,
        $questionId: ID!,
    ) {
        private {
            id
            projectScope(pk: $projectId) {
                id
                question(pk: $questionId) {
                    ...QuestionResponse
                }
            }
        }
    }
`;

export const QUESTIONNAIRE = gql`
    ${LEAF_GROUPS_FRAGMENT}
    ${CHOICE_COLLECTION_FRAGMENT}
    query Questionnaire(
        $projectId: ID!,
        $questionnaireId: ID!,
    ) {
        private {
            id
            projectScope(pk: $projectId) {
                id
                project {
                    title
                    id
                }
                questionnaire(pk: $questionnaireId) {
                    id
                    title
                    leafGroups {
                        ...LeafGroups
                    }
                    choiceCollections {
                        ...ChoiceCollections
                    }
                    requiredDuration
                    totalRequiredDuration
                    totalQuestions {
                        visible
                    }
                }
            }
        }
    }
`;
