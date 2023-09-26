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
    QberEnumeratorSkillTypeEnum,
    QberMetaDataPriorityLevelTypeEnum,
    QberDataCollectionMethodTypeEnum,
} from '#generated/types';
import {
    enumKeySelector,
    enumLabelSelector,
} from '#utils/common';

const METADATA_OPTIONS = gql`
    query MetaDataOptions{
        enums {
            QuestionnaireEnumeratorSkill {
                key
                label
            }
            QuestionnairePriorityLevel {
                key
                label
            }
            QuestionnaireDataCollectionMethod {
                key
                label
            }
        }
    }
`;

type Input = {
    priorityLevel: QberMetaDataPriorityLevelTypeEnum | null | undefined;
    enumeratorSkill: QberEnumeratorSkillTypeEnum | null | undefined;
    dataCollectionMethod: QberDataCollectionMethodTypeEnum | null | undefined;
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

    const priorityLevelOptions = metaDataOptions?.enums.QuestionnairePriorityLevel;

    const skillOptions = metaDataOptions?.enums.QuestionnaireEnumeratorSkill;

    const collectionMethodOptions = metaDataOptions?.enums.QuestionnaireDataCollectionMethod;

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
