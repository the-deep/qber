import { useCallback } from 'react';
import {
    IoSwapVertical,
} from 'react-icons/io5';
import {
    _cs,
} from '@togglecorp/fujs';
import {
    Element,
    ListView,
    TextOutput,
} from '@the-deep/deep-ui';

import {
    ChoiceCollectionType,
    ChoiceType,
} from '#types/common';

import RankQuestionItem from './RankQuestionItem';
import styles from './index.module.css';

const rankChoiceKeySelector = (c: ChoiceType) => c.id;

interface Props {
    className?: string;
    label?: string;
    hint?: string | null;
    choiceCollection?: ChoiceCollectionType;
}

function RankQuestionPreview(props: Props) {
    const {
        className,
        label,
        hint,
        choiceCollection,
    } = props;

    const choices = choiceCollection?.choices;

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
