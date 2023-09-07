import { useCallback, useMemo } from 'react';
import {
    MdOutlineChecklist,
} from 'react-icons/md';
import { gql, useQuery } from '@apollo/client';
import {
    _cs,
    isNotDefined,
    noOp,
} from '@togglecorp/fujs';
import {
    Checkbox,
    Element,
    ListView,
    TextOutput,
} from '@the-deep/deep-ui';

import { MultipleOptionListQuery, MultipleOptionListQueryVariables } from '#generated/types';

import styles from './index.module.css';

const MULTIPLE_OPTION_LIST = gql`
    query MultipleOptionList(
        $projectId: ID!,
        $choiceCollectionId: ID!,
        ) {
        private {
            projectScope(pk: $projectId) {
                choiceCollection(pk: $choiceCollectionId) {
                    id
                    label
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

type CheckboxType = NonNullable<NonNullable<MultipleOptionListQuery['private']['projectScope']>['choiceCollection']>['choices'][number];
const checkboxKeySelector = (d: CheckboxType) => d.id;

interface Props {
    className?: string;
    label?: string;
    hint?: string | null;
    choiceCollectionId: string | undefined | null;
    projectId: string;
}

function SelectMultipleQuestionPreview(props: Props) {
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
        loading: OptionsListLoading,
    } = useQuery<MultipleOptionListQuery, MultipleOptionListQueryVariables>(
        MULTIPLE_OPTION_LIST,
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
                value={label ?? 'Title'}
                description={hint ?? 'Choose One'}
                spacing="none"
                block
            />
            <Element
                className={styles.choicesPreview}
                icons={<MdOutlineChecklist />}
                iconsContainerClassName={styles.icon}
            >
                <ListView
                    className={styles.choices}
                    data={optionsListResponse?.private?.projectScope?.choiceCollection?.choices}
                    keySelector={checkboxKeySelector}
                    renderer={Checkbox}
                    rendererParams={checkboxListRendererParams}
                    filtered={false}
                    errored={false}
                    pending={OptionsListLoading}
                />
            </Element>
        </div>
    );
}

export default SelectMultipleQuestionPreview;
