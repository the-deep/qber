import {
    _cs, isNotDefined
} from '@togglecorp/fujs';
import { useMemo } from 'react';
import { gql, useQuery } from '@apollo/client';
import {
    RadioInput,
    TextOutput,
} from '@the-deep/deep-ui';

import {
    ChoiceCollectionsQuery,
    OptionListQuery,
    OptionListQueryVariables,
    QuestionChoiceCollectionType,
} from '#generated/types';

import styles from './index.module.css';

const OPTION_LIST = gql`
    query OptionList(
        $projectId: ID!,
        $choiceCollectionId: ID!,
        ) {
        private {
            projectScope(pk: $projectId) {
                choiceCollection(pk: $choiceCollectionId) {
                    label
                    name
                    choices {
                        id
                        label
                        name
                    }
                    id
                }
            }
        }
    }
`;

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

    type ChoiceCollection = NonNullable<ChoiceCollectionsQuery['private']['projectScope']>['choiceCollections']['items'][number];

    const choiceCollectionKeySelector = (d: ChoiceCollection) => d.id;
    const choiceCollectionLabelSelector = (d: ChoiceCollection) => d.label;

    const optionListVariables = useMemo(() => {
        if (isNotDefined(projectId) || isNotDefined(choiceCollectionId)) {
            return undefined;
        }
        return ({
            projectId: projectId,
            choiceCollectionId: choiceCollectionId,
        });
    }, [
        projectId,
        choiceCollectionId,
    ]);

    const {
        data: optionsListResponse,
    } = useQuery<OptionListQuery, OptionListQueryVariables>(
        OPTION_LIST,
        {
            skip: isNotDefined(optionListVariables),
            variables: optionListVariables,
        }
    );

    const optionsList = optionsListResponse?.private?.projectScope?.choiceCollection?.choices || [];

    return (
        <div className={_cs(styles.preview, className)}>
            <TextOutput
                value={label ?? 'Which Country needs the assistance quickest?'}
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
                onChange={() => { }}
                options={optionsList as QuestionChoiceCollectionType[]}
                value={optionsListResponse?.private?.projectScope?.choiceCollection?.name}
            />
        </div>
    );
}

export default SelectOneQuestionPreview;
