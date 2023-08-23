import { useMemo } from 'react';
import {
    _cs,
    isNotDefined,
    noOp,
} from '@togglecorp/fujs';
import { gql, useQuery } from '@apollo/client';
import {
    RadioInput,
    TextOutput,
} from '@the-deep/deep-ui';

import {
    ChoiceCollectionsQuery,
    SingleOptionListQuery,
    SingleOptionListQueryVariables,
} from '#generated/types';

import styles from './index.module.css';

const SINGLE_OPTION_LIST = gql`
    query SingleOptionList(
        $projectId: ID!,
        $choiceCollectionId: ID!,
        $questionnaireId: ID!,
        ) {
        private {
            projectScope(pk: $projectId) {
                choiceCollection(pk: $choiceCollectionId) {
                    label
                    id
                    name
                    choices {
                        id
                        label
                        name
                    }
                    id
                }
                choiceCollections(filters: {questionnaire: {pk: $questionnaireId}}) {
                    limit
                    offset
                }
            }
        }
    }
`;

const choiceCollectionKeySelector = (d: { id: string }) => d.id;
const choiceCollectionLabelSelector = (d: { name: string }) => d.name;

interface Props {
    className?: string;
    label?: string;
    hint?: string | null;
    choiceCollectionId: string | undefined | null;
    projectId: string;
    questionnaireId: string;
}

function SelectOneQuestionPreview(props: Props) {
    const {
        className,
        label,
        hint,
        choiceCollectionId,
        projectId,
        questionnaireId,
    } = props;

    const optionListVariables = useMemo(() => {
        if (isNotDefined(projectId) || isNotDefined(choiceCollectionId) || isNotDefined(questionnaireId)) {
            return undefined;
        }
        return ({
            projectId,
            choiceCollectionId,
            questionnaireId
        });
    }, [
        projectId,
        choiceCollectionId,
        questionnaireId,
    ]);

    const {
        data: optionsListResponse,
    } = useQuery<SingleOptionListQuery, SingleOptionListQueryVariables>(
        SINGLE_OPTION_LIST,
        {
            skip: isNotDefined(optionListVariables),
            variables: optionListVariables,
        },
    );

    const optionsList = optionsListResponse?.private?.projectScope?.choiceCollection?.choices ?? [];

    return (
        <div className={_cs(styles.preview, className)}>
            <TextOutput
                value={label ?? 'Title'}
                description={hint ?? 'Choose One'}
                spacing="none"
                block
            />
            <RadioInput
                className={styles.questionList}
                keySelector={choiceCollectionKeySelector}
                label="Options"
                labelSelector={choiceCollectionLabelSelector}
                name="options"
                onChange={noOp}
                options={optionsList}
                value={optionsListResponse?.private?.projectScope?.choiceCollection?.name}
                readOnly
                disabled={false}
            />
        </div>
    );
}

export default SelectOneQuestionPreview;
