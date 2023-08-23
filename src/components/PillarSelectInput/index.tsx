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
                groups (filters: {questionnaire: {pk: $questionnaireId}}){
                    items {
                        id
                        name
                        label
                        parentId
                        questionnaireId
                    }
                }
            }
        }
    }
`;

type Pillar = NonNullable<PillarsQuery['private']['projectScope']>['groups']['items'][number];

const pillarKeySelector = (data: Pillar) => data.id;
const pillarLabelSelector = (data: Pillar) => data.label;

interface PillarProps<T>{
    projectId: string;
    name: T;
    questionnaireId: string | null;
    value: string | null | undefined;
    error: string | undefined;
    onChange: (value: string | undefined, name: T) => void;
}

function PillarSelectInput<T extends string>(props: PillarProps<T>) {
    const {
        projectId,
        questionnaireId,
        value,
        error,
        onChange,
        name,
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

    const pillarsOptions = pillarsResponse?.private?.projectScope?.groups.items ?? [];

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
            disabled={pillarsLoading}
        />
    );
}

export default PillarSelectInput;
