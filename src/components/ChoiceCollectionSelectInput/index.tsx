import { useMemo, useState } from 'react';
import { isNotDefined } from '@togglecorp/fujs';
import { gql, useQuery } from '@apollo/client';
import { SearchSelectInput } from '@the-deep/deep-ui';

import {
    ChoiceCollectionsQuery,
    ChoiceCollectionsQueryVariables,
} from '#generated/types';

const CHOICE_COLLECTIONS = gql`
    query ChoiceCollections(
        $projectId: ID!,
        $questionnaireId: ID!,
        $search:String
        ) {
    private {
        projectScope(pk: $projectId) {
            id
            choiceCollections(
                filters: {
                    questionnaire: {pk: $questionnaireId},
                    label: {iContains: $search }
                    }
            ) {
                count
                items {
                    id
                    label
                    name
                    questionnaireId
                }
            }
        }
    }
}
`;

type ChoiceCollection = NonNullable<ChoiceCollectionsQuery['private']['projectScope']>['choiceCollections']['items'][number];

const choiceCollectionKeySelector = (d: ChoiceCollection) => d.id;
const choiceCollectionLabelSelector = (d: ChoiceCollection) => d.label;

interface Props<T> {
    projectId: string;
    questionnaireId: string | null;
    name: T;
    label: string;
    onChange: (value: string | undefined, name: T) => void;
    value: string | null | undefined;
    error: string | undefined;
}

function ChoiceCollectionSelectInput<T extends string>(props: Props<T>) {
    const {
        projectId,
        questionnaireId,
        name,
        value,
        label,
        onChange,
        error,
    } = props;

    const [
        choiceCollectionOptions,
        setChoiceCollectionOptions,
    ] = useState<ChoiceCollection[] | undefined | null>();

    const [search, setSearch] = useState<string>();
    const [opened, setOpened] = useState(false);

    const optionsVariables = useMemo(() => {
        if (isNotDefined(projectId) || isNotDefined(questionnaireId)
        ) {
            return undefined;
        }
        return ({
            projectId,
            questionnaireId,
            search,
        });
    }, [
        projectId,
        questionnaireId,
        search,
    ]);

    const {
        data: choiceCollectionsResponse,
        loading: choiceCollectionLoading,
    } = useQuery<
        ChoiceCollectionsQuery,
        ChoiceCollectionsQueryVariables
    >(CHOICE_COLLECTIONS, {
        skip: isNotDefined(optionsVariables) || !opened,
        variables: optionsVariables,
    });
    const searchOption = choiceCollectionsResponse?.private.projectScope?.choiceCollections.items;

    return (
        <SearchSelectInput
            name={name}
            error={error}
            disabled={choiceCollectionLoading}
            keySelector={choiceCollectionKeySelector}
            labelSelector={choiceCollectionLabelSelector}
            onChange={onChange}
            onSearchValueChange={setSearch}
            onOptionsChange={setChoiceCollectionOptions}
            label={label}
            searchOptions={searchOption}
            options={choiceCollectionOptions}
            onShowDropdownChange={setOpened}
            value={value}
        />
    );
}

export default ChoiceCollectionSelectInput;
