import { useState } from 'react';
import {
    SearchSelectInput,
    SearchSelectInputProps,
} from '@the-deep/deep-ui';
import { gql, useQuery } from '@apollo/client';

import {
    QuestionnarePriorityLevelTypeEnum,
    PriorityLevelOptionsQuery,
    PriorityLevelOptionsQueryVariables,
} from '#generated/types';
import {
    EnumOptions,
    EnumEntity,
    enumKeySelector,
    enumLabelSelector,
} from '#utils/common';

const PRIORITY_LEVEL_OPTIONS = gql`
    query priorityLevelOptions {
        questionnarePriorityLevelTypeOptions: __type(name: "QuestionnarePriorityLevelTypeEnum") {
            enumValues {
                name
                description
            }
        }
    }
`;

type Def = { containerClassName?: string };
type PriorityLevelSelectInputProps<
    K extends string,
    GK extends string,
> = SearchSelectInputProps<
    string,
    K,
    GK,
    EnumEntity<QuestionnarePriorityLevelTypeEnum>,
    Def,
    'searchOptions' | 'optionsPending' | 'keySelector' | 'labelSelector' | 'totalOptionsCount' | 'onShowDropdownChange'
>;

function PriorityLevelSelectInput<
    K extends string,
    GK extends string
>(props: PriorityLevelSelectInputProps<K, GK>) {
    const {
        className,
        ...otherProps
    } = props;

    const [opened, setOpened] = useState(false);

    const {
        data: priorityLevels,
        loading: priorityLevelsPending,
    } = useQuery<PriorityLevelOptionsQuery, PriorityLevelOptionsQueryVariables>(
        PRIORITY_LEVEL_OPTIONS,
        {
            skip: !opened,
        },
    );

    const priorityLevelOptions = priorityLevels?.questionnarePriorityLevelTypeOptions?.enumValues;

    return (
        <SearchSelectInput
            // eslint-disable-next-line react/jsx-props-no-spreading
            {...otherProps}
            className={className}
            label="Priority Levels"
            searchOptions={priorityLevelOptions as EnumOptions<QuestionnarePriorityLevelTypeEnum>}
            keySelector={enumKeySelector}
            labelSelector={enumLabelSelector}
            onShowDropdownChange={setOpened}
            optionsPending={priorityLevelsPending}
        />
    );
}

export default PriorityLevelSelectInput;
