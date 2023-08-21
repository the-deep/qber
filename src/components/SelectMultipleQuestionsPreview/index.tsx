import { useCallback, useMemo } from 'react';
import { gql, useQuery } from '@apollo/client';
import {
    _cs,
    isNotDefined,
    noOp,
} from '@togglecorp/fujs';
import {
    Checkbox,
    ListView,
    TextOutput,
} from '@the-deep/deep-ui';

import { OptionListQuery, OptionListQueryVariables } from '#generated/types';

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

type CheckboxType = NonNullable<NonNullable<OptionListQuery['private']['projectScope']>['choiceCollection']>['choices'][number];
const checkboxKeySelector = (d: CheckboxType) => d.id;

interface Props {
    className?: string;
    label?: string;
    hint?: string | null;
    choiceCollectionId: string | undefined | null;
    projectId: string;
}

function SelectMultipleQuestionsPreview(props: Props) {
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
    } = useQuery<OptionListQuery, OptionListQueryVariables>(
        OPTION_LIST,
        {
            skip: isNotDefined(optionListVariables),
            variables: optionListVariables,
        },
    );

    const checkboxListRendererParams = useCallback((_: string, datum: CheckboxType) => ({
        label: datum?.label,
        name: 'choiceCollection',
        value: false,
        readOnly: true,
        onChange: noOp,
    }), []);

    return (
        <div className={_cs(styles.preview, className)}>
            <TextOutput
                value={label ?? 'Which Country needs the assistance quickest?'}
                description={hint ?? 'Choose One'}
                spacing="none"
                block
            />
            <ListView
                className={styles.questionList}
                data={optionsListResponse?.private?.projectScope?.choiceCollection?.choices}
                keySelector={checkboxKeySelector}
                renderer={Checkbox}
                rendererParams={checkboxListRendererParams}
                filtered={false}
                errored={false}
                pending={false}
            />
        </div>
    );
}

export default SelectMultipleQuestionsPreview;
