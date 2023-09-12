import { useState } from 'react';
import {
    SearchSelectInput,
    SearchSelectInputProps,
} from '@the-deep/deep-ui';
import { gql, useQuery } from '@apollo/client';

import {
    QuestionnareEnumeratorSkillTypeEnum,
    EnumeratorSkillOptionsQuery,
    EnumeratorSkillOptionsQueryVariables,
} from '#generated/types';
import {
    EnumOptions,
    EnumEntity,
    enumKeySelector,
    enumLabelSelector,
} from '#utils/common';

const ENUMERATOR_SKILL_OPTIONS = gql`
    query enumeratorSkillOptions {
        questionnareEnumeratorSkillTypeOptions: __type(name: "QuestionnareEnumeratorSkillTypeEnum") {
            enumValues {
                name
                description
            }
        }
    }
`;

type Def = { containerClassName?: string };
type EnumeratorSkillSelectInputProps<
    K extends string,
    GK extends string,
> = SearchSelectInputProps<
    string,
    K,
    GK,
    EnumEntity<QuestionnareEnumeratorSkillTypeEnum>,
    Def,
    'searchOptions' | 'optionsPending' | 'keySelector' | 'labelSelector' | 'totalOptionsCount' | 'onShowDropdownChange'
>;

function EnumeratorSkillSelectInput<
    K extends string,
    GK extends string
>(props: EnumeratorSkillSelectInputProps<K, GK>) {
    const {
        className,
        ...otherProps
    } = props;

    const [opened, setOpened] = useState(false);

    const {
        data: enumeratorSkills,
        loading: enumeratorSkillsPending,
    } = useQuery<EnumeratorSkillOptionsQuery, EnumeratorSkillOptionsQueryVariables>(
        ENUMERATOR_SKILL_OPTIONS,
        {
            skip: !opened,
        },
    );

    const enumeratorSkillOptions = enumeratorSkills?.questionnareEnumeratorSkillTypeOptions?.enumValues;

    return (
        <SearchSelectInput
            // eslint-disable-next-line react/jsx-props-no-spreading
            {...otherProps}
            className={className}
            label="Enumerator Skill"
            searchOptions={enumeratorSkillOptions as EnumOptions<QuestionnareEnumeratorSkillTypeEnum>}
            keySelector={enumKeySelector}
            labelSelector={enumLabelSelector}
            onShowDropdownChange={setOpened}
            optionsPending={enumeratorSkillsPending}
        />
    );
}

export default EnumeratorSkillSelectInput;
