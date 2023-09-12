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
        choiceCollection {
            id
            name
            label
            questionnaireId
        }
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
                    required
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
