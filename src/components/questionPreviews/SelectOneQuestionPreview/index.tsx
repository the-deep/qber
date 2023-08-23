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
    SingleOptionListQuery,
    SingleOptionListQueryVariables,
} from '#generated/types';

import styles from './index.module.css';

const SINGLE_OPTION_LIST = gql`
    query SingleOptionList(
        $projectId: ID!,
        $choiceCollectionId: ID!,
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
                }
            }
        }
    }
`;

type ChoiceType = NonNullable<NonNullable<NonNullable<NonNullable<SingleOptionListQuery['private']>['projectScope']>['choiceCollection']>['choices']>[number];

const choiceCollectionKeySelector = (d: ChoiceType) => d.id;
const choiceCollectionLabelSelector = (d: ChoiceType) => d.label;

interface Props {
    className?: string;
    label?: string;
    hint?: string | null;
    choiceCollectionId: string | undefined | null;
    projectId: string;
}

function SelectOneQuestionPreview(props: Props) {
    const {
        className,
        label,
        hint,
        choiceCollectionId,
        projectId,
    } = props;

    const optionListVariables = useMemo(() => {
        if (isNotDefined(projectId) || isNotDefined(choiceCollectionId)) {
            return undefined;
        }
        return ({
            projectId,
            choiceCollectionId,
        });
    }, [
        projectId,
        choiceCollectionId,
    ]);

    const {
        data: optionsListResponse,
        loading: optionListLoading,
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
                disabled={optionListLoading}
            />
        </div>
    );
}

export default SelectOneQuestionPreview;
