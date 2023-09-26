import { useMemo, useCallback } from 'react';
import {
    IoSwapVertical,
} from 'react-icons/io5';
import {
    _cs,
    isNotDefined,
} from '@togglecorp/fujs';
import {
    gql,
    useQuery,
} from '@apollo/client';
import {
    Element,
    ListView,
    TextOutput,
} from '@the-deep/deep-ui';

import {
    RankChoicesQuery,
    RankChoicesQueryVariables,
} from '#generated/types';

import RankQuestionItem from './RankQuestionItem';
import styles from './index.module.css';

const RANK_CHOICES = gql`
    query RankChoices (
        $projectId: ID!,
        $choiceCollectionId: ID!,
        ) {
        private {
            projectScope(pk: $projectId) {
                choiceCollection(pk: $choiceCollectionId) {
                    id
                    name
                    label
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

type ChoiceType = NonNullable<NonNullable<NonNullable<NonNullable<RankChoicesQuery['private']>['projectScope']>['choiceCollection']>['choices']>[number];
const rankChoiceKeySelector = (c: ChoiceType) => c.id;

interface Props {
    className?: string;
    label?: string;
    hint?: string | null;
    choiceCollectionId: string | undefined | null;
    projectId: string;
}

function RankQuestionPreview(props: Props) {
    const {
        className,
        label,
        hint,
        choiceCollectionId,
        projectId,
    } = props;

    const rankChoicesVariables = useMemo(() => {
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
    } = useQuery<RankChoicesQuery, RankChoicesQueryVariables>(
        RANK_CHOICES,
        {
            skip: isNotDefined(rankChoicesVariables),
            variables: rankChoicesVariables,
        },
    );

    const choices = optionsListResponse?.private?.projectScope?.choiceCollection?.choices ?? [];

    const rankChoiceRendererParams = useCallback((_: string, datum: ChoiceType) => ({
        title: datum.label,
    }), []);

    return (
        <div className={_cs(styles.preview, className)}>
            <TextOutput
                label={label ?? 'Enter Question Label'}
                description={hint ?? 'Enter hint'}
                spacing="none"
                hideLabelColon
                block
            />
            <Element
                className={styles.choicesPreview}
                icons={<IoSwapVertical />}
                iconsContainerClassName={styles.icon}
            >
                <ListView
                    className={styles.choices}
                    data={choices}
                    keySelector={rankChoiceKeySelector}
                    renderer={RankQuestionItem}
                    rendererParams={rankChoiceRendererParams}
                    filtered={false}
                    errored={false}
                    pending={false}
                />
            </Element>
        </div>
    );
}

export default RankQuestionPreview;
