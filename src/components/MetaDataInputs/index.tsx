import {
    SelectInput,
    NumberInput,
} from '@the-deep/deep-ui';
import { gql, useQuery } from '@apollo/client';
import {
    type Error,
    getErrorObject,
    type PartialForm,
    type EntriesAsList,
} from '@togglecorp/toggle-form';

import {
    MetaDataOptionsQuery,
    MetaDataOptionsQueryVariables,
    QuestionnairePriorityLevelTypeEnum,
    QuestionnaireDataCollectionMethodTypeEnum,
    QuestionnaireEnumeratorSkillTypeEnum,
} from '#generated/types';
import {
    enumKeySelector,
    EnumOptions,
    enumLabelSelector,
} from '#utils/common';

const METADATA_OPTIONS = gql`
    query MetaDataOptions{
        questionnairePriorityLevelTypeOptions: __type(name: "QuestionnairePriorityLevelTypeEnum") {
            enumValues {
                name
                description
            }
        }
        questionnaireEnumeratorSkillTypeOptions: __type(name: "QuestionnaireEnumeratorSkillTypeEnum") {
            enumValues {
                name
                description
            }
        }
        questionnaireDataCollectionMethodTypeOptions: __type(name: "QuestionnaireDataCollectionMethodTypeEnum") {
            enumValues {
                name
                description
            }
        }
    }
`;

type Input = {
    priorityLevel: QuestionnairePriorityLevelTypeEnum | undefined | null;
    enumeratorSkill: QuestionnaireEnumeratorSkillTypeEnum| undefined | null;
    dataCollectionMethod: QuestionnaireDataCollectionMethodTypeEnum| undefined | null;
    requiredDuration: number | undefined | null;
};

type FormType = PartialForm<Input>;

interface Props {
    className?: string;
    value: FormType | undefined;
    error?: Error<FormType>;
    onChange: (...entries: EntriesAsList<FormType>) => void;
}

function MetaDataInputs(props: Props) {
    const {
        className,
        value,
        error: riskyError,
        onChange,
    } = props;

    const {
        data: metaDataOptions,
        loading: metaDataOptionsPending,
    } = useQuery<MetaDataOptionsQuery, MetaDataOptionsQueryVariables>(
        METADATA_OPTIONS,
    );

    const error = getErrorObject(riskyError);

    const priorityLevelOptions = metaDataOptions
        ?.questionnairePriorityLevelTypeOptions
        ?.enumValues as EnumOptions<QuestionnairePriorityLevelTypeEnum>;

    const skillOptions = metaDataOptions
        ?.questionnaireEnumeratorSkillTypeOptions
        ?.enumValues as EnumOptions<QuestionnaireEnumeratorSkillTypeEnum>;

    const collectionMethodOptions = metaDataOptions
        ?.questionnaireDataCollectionMethodTypeOptions
        ?.enumValues as EnumOptions<QuestionnaireDataCollectionMethodTypeEnum>;

    return (
        <>
            <SelectInput
                className={className}
                name="priorityLevel"
                value={value?.priorityLevel}
                onChange={onChange}
                error={error?.priorityLevel}
                label="Priority Levels"
                options={priorityLevelOptions}
                keySelector={enumKeySelector}
                labelSelector={enumLabelSelector}
                optionsPending={metaDataOptionsPending}
            />
            <SelectInput
                className={className}
                name="dataCollectionMethod"
                value={value?.dataCollectionMethod}
                onChange={onChange}
                error={error?.dataCollectionMethod}
                label="Data Collection Method"
                options={collectionMethodOptions}
                keySelector={enumKeySelector}
                labelSelector={enumLabelSelector}
                optionsPending={metaDataOptionsPending}
            />
            <SelectInput
                className={className}
                name="enumeratorSkill"
                value={value?.enumeratorSkill}
                onChange={onChange}
                error={error?.enumeratorSkill}
                label="Enumerator Skills"
                options={skillOptions}
                keySelector={enumKeySelector}
                labelSelector={enumLabelSelector}
                optionsPending={metaDataOptionsPending}
            />
            <NumberInput
                className={className}
                label="Maximum duration (in minutes)"
                name="requiredDuration"
                value={value?.requiredDuration}
                error={error?.requiredDuration}
                onChange={onChange}
            />
        </>
    );
}

export default MetaDataInputs;
