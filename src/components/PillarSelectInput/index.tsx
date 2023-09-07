import { useMemo } from 'react';
import { gql, useQuery } from '@apollo/client';
import { SelectInput } from '@the-deep/deep-ui';
import { isNotDefined } from '@togglecorp/fujs';

import { PillarsQuery, PillarsQueryVariables } from '#generated/types';

const PILLARS = gql`
    query Pillars (
        $projectId: ID!,
        $questionnaireId: ID!,
    ) {
        private {
            projectScope(pk: $projectId) {
                questionnaire(pk: $questionnaireId) {
                    leafGroups {
                        id
                        name
                        type
                        category1
                        category1Display
                        category2
                        category2Display
                        category3
                        category3Display
                        category4
                        category4Display
                        order
                    }
                }
            }
        }
    }
`;

type Pillar = NonNullable<NonNullable<NonNullable<PillarsQuery['private']>['projectScope']>['questionnaire']>['leafGroups'][number];

const pillarKeySelector = (data: Pillar) => data.id;
const pillarLabelSelector = (data: Pillar) => {
    if (data.type === 'MATRIX_1D') {
        return data.category2Display;
    }
    return data.category4Display ?? '??';
};

interface PillarProps<T>{
    projectId: string;
    name: T;
    questionnaireId: string | null;
    value: string | null | undefined;
    error: string | undefined;
    onChange: (value: string | undefined, name: T) => void;
    disabled?: boolean;
}

function PillarSelectInput<T extends string>(props: PillarProps<T>) {
    const {
        projectId,
        questionnaireId,
        value,
        error,
        onChange,
        name,
        disabled,
    } = props;

    const pillarsVariables = useMemo(() => {
        if (isNotDefined(projectId) || isNotDefined(questionnaireId)) {
            return undefined;
        }
        return ({
            projectId,
            questionnaireId,
        });
    }, [
        projectId,
        questionnaireId,
    ]);

    const {
        data: pillarsResponse,
        loading: pillarsLoading,
    } = useQuery<PillarsQuery, PillarsQueryVariables>(
        PILLARS,
        {
            skip: isNotDefined(pillarsVariables),
            variables: pillarsVariables,
        },
    );

    const pillarsOptions = pillarsResponse?.private?.projectScope?.questionnaire?.leafGroups ?? [];

    return (
        <SelectInput
            name={name}
            label="Pillar and Sub pillar"
            value={value}
            error={error}
            onChange={onChange}
            keySelector={pillarKeySelector}
            labelSelector={pillarLabelSelector}
            options={pillarsOptions}
            disabled={pillarsLoading || disabled}
        />
    );
}

export default PillarSelectInput;
